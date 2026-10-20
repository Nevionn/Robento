import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

import type { BentoGroup, Shortcut } from "../components/BentoGrid/BentoGrid";

interface UseBentoShortcutsParams {
	setGroups: React.Dispatch<React.SetStateAction<BentoGroup[]>>;
}

interface SavedShortcut extends Shortcut {
	group_id: string;
	sort_order: number;
	created_at: string;
}

export function useBentoShortcuts({ setGroups }: UseBentoShortcutsParams) {
	/**
	 * Создаёт ярлык в БД и добавляет его в локальную группу.
	 */
	const createShortcut = useCallback(
		async (_groupId: string, _shortcut: Omit<Shortcut, "id">) => {},
		[],
	);

	/**
	 * Загружает все ярлыки одним запросом и распределяет их по группам.
	 */
	const loadShortcuts = useCallback(async () => {
		const shortcuts = await invoke<SavedShortcut[]>("get_shortcuts");

		setGroups((prev) =>
			prev.map((group) => ({
				...group,
				shortcuts: shortcuts
					.filter((shortcut) => shortcut.group_id === group.id)
					.sort((a, b) => a.sort_order - b.sort_order)
					.map(({ id, name, target, source, reservePath2icon, icon }) => ({
						id,
						name,
						target,
						source,
						reservePath2icon,
						icon,
					})),
			})),
		);
	}, [setGroups]);

	/**
	 * Сохраняет порядок ярлыков в БД.
	 */
	const updateShortcutsOrder = useCallback(
		async (
			shortcuts: {
				id: string;
				groupId: string;
				sortOrder: number;
			}[],
		) => {
			try {
				await invoke("update_shortcuts_order", {
					shortcuts: shortcuts.map((shortcut) => [
						shortcut.id,
						shortcut.groupId,
						shortcut.sortOrder,
					]),
				});
			} catch (error) {
				console.error("Не удалось сохранить порядок ярлыков:", error);
				throw error;
			}
		},
		[],
	);

	/**
	 * Удаляет ярлык из БД и локального состояния.
	 */
	const deleteShortcut = useCallback(
		async (id: string) => {
			try {
				await invoke("delete_shortcut", { id });

				setGroups((prev) =>
					prev.map((group) => ({
						...group,
						shortcuts: group.shortcuts.filter((shortcut) => shortcut.id !== id),
					})),
				);
			} catch (error) {
				console.error("Не удалось удалить ярлык:", error);
				throw error;
			}
		},
		[setGroups],
	);

	return {
		createShortcut,
		loadShortcuts,
		updateShortcutsOrder,
		deleteShortcut,
	};
}

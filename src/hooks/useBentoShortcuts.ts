import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

import type { BentoGroup, Shortcut } from "../components/BentoGrid/BentoGrid";

interface UseBentoShortcutsParams {
	setGroups: React.Dispatch<React.SetStateAction<BentoGroup[]>>;
}

interface SavedShortcut {
	id: string;
	group_id: string;
	name: string;
	target: string;
	source: string;
	icon: string | null;
	reserve_path2icon: string | null;
	sort_order: number;
}

/**
 * Операции с ярлыками.
 *
 * Отвечает за:
 * createShortcut: Создаёт ярлык в БД и добавляет его в локальную группу.
 * loadShortcuts: Загружает все ярлыки одним запросом и распределяет их по группам.
 * updateShortcutsOrder: Сохраняет порядок ярлыков в БД.
 * deleteShortcut: Удаляет ярлык из БД и локального состояния.
 */

export function useBentoShortcuts({ setGroups }: UseBentoShortcutsParams) {
	const createShortcut = useCallback(
		async (groupId: string, shortcut: Omit<Shortcut, "id">) => {
			try {
				const saved = await invoke<SavedShortcut>("create_shortcut", {
					groupId,
					name: shortcut.name,
					target: shortcut.target,
					source: shortcut.source,
					icon: shortcut.icon,
					reserve_path2icon: shortcut.reserve_path2icon ?? null,
				});

				setGroups((prev) =>
					prev.map((group) =>
						group.id === groupId
							? {
									...group,
									shortcuts: [
										...group.shortcuts,
										{
											id: saved.id,
											name: saved.name,
											target: saved.target,
											source: saved.source,
											icon: saved.icon,
											reserve_path2icon: saved.reserve_path2icon ?? undefined,
										},
									],
								}
							: group,
					),
				);
			} catch (error) {
				console.error("Не удалось создать ярлык:", error);
				throw error;
			}
		},
		[setGroups],
	);

	const loadShortcuts = useCallback(async () => {
		const shortcuts = await invoke<SavedShortcut[]>("get_shortcuts");

		setGroups((prev) =>
			prev.map((group) => ({
				...group,
				shortcuts: shortcuts
					.filter((shortcut) => shortcut.group_id === group.id)
					.sort((a, b) => a.sort_order - b.sort_order)
					.map(({ id, name, target, source, reserve_path2icon, icon }) => ({
						id,
						name,
						target,
						source,
						reserve_path2icon: reserve_path2icon ?? undefined,
						icon,
					})),
			})),
		);
	}, [setGroups]);

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

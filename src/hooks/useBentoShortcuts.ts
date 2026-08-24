import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";
import type { Layout } from "react-grid-layout";
import type { BentoGroup, Shortcut } from "../components/BentoGrid/BentoGrid";
import { updateLayoutHeight } from "../components/BentoGrid/layout";

interface UseBentoShortcutsParams {
	setGroups: React.Dispatch<React.SetStateAction<BentoGroup[]>>;
	setLayout: React.Dispatch<React.SetStateAction<Layout>>;
}

interface SavedShortcut {
	id: string;
	group_id: string;
	name: string;
	target: string;
	source: string;
	icon: string | null;
	sort_order: number;
	created_at: string;
}

/**
 * CRUD-операции ярлыков.
 *
 * Отвечает за:
 * - создание ярлыка в БД;
 * - загрузку ярлыков из БД;
 * - обновление порядка ярлыков;
 * - перенос ярлыков между группами;
 * - удаление ярлыка из БД.
 *
 * Локальное отображение и DnD остаются ответственностью
 * BentoGrid, ShortcutGrid и SortableShortcut.
 */

export function useBentoShortcuts({
	setGroups,
	setLayout,
}: UseBentoShortcutsParams) {
	/**
	 * Создаёт ярлык в БД и добавляет его в локальную группу.
	 */

	const createShortcut = useCallback(
		async (groupId: string, shortcut: Omit<Shortcut, "id">) => {
			try {
				const savedShortcut = await invoke<SavedShortcut>("create_shortcut", {
					groupId,
					name: shortcut.name,
					target: shortcut.target,
					source: shortcut.source,
					icon: shortcut.icon,
				});
				setGroups((prev) => {
					const next = prev.map((group) =>
						group.id === savedShortcut.group_id
							? {
									...group,
									shortcuts: [
										...group.shortcuts,
										{
											id: savedShortcut.id,
											name: savedShortcut.name,
											target: savedShortcut.target,
											source: savedShortcut.source,
											icon: savedShortcut.icon,
										},
									],
								}
							: group,
					);
					setLayout((current) => updateLayoutHeight(next, current));
					return next;
				});
			} catch (error) {
				console.error("Не удалось создать ярлык:", error);
			}
		},
		[setGroups, setLayout],
	);

	/**
	 * Загружает все ярлыки из БД.
	 *
	 * Возвращает сырые данные ярлыков, чтобы BentoGrid
	 * мог применить их после завершения первичной загрузки.
	 */

	const loadShortcuts = useCallback(async (): Promise<SavedShortcut[]> => {
		try {
			return await invoke<SavedShortcut[]>("get_shortcuts");
		} catch (error) {
			console.error("Не удалось загрузить ярлыки:", error);
			return [];
		}
	}, []);

	/**
	 * Применяет загруженные из БД ярлыки к локальным группам.
	 *
	 * После применения пересчитывает высоту всех групп.
	 *    └─ берёт уже загруженные groups
	 *    └─ распределяет ярлыки по group_id
	 *    └─ сортирует ярлыки по sort_order
	 *    └─ записывает shortcuts внутрь groups
	 */

	const applyLoadedShortcuts = useCallback(
		(savedShortcuts: SavedShortcut[]) => {
			setGroups((prev) => {
				const next = prev.map((group) => ({
					...group,
					shortcuts: savedShortcuts
						.filter((shortcut) => shortcut.group_id === group.id)
						.sort(
							(firstShortcut, secondShortcut) =>
								firstShortcut.sort_order - secondShortcut.sort_order,
						)
						.map((shortcut) => ({
							id: shortcut.id,
							name: shortcut.name,
							target: shortcut.target,
							source: shortcut.source,
							icon: shortcut.icon,
						})),
				}));
				setLayout((current) => updateLayoutHeight(next, current));
				return next;
			});
		},
		[setGroups, setLayout],
	);

	/**
	 * Сохраняет новый порядок ярлыков в БД.
	 *
	 * Каждый элемент содержит:
	 * - id ярлыка;
	 * - id группы;
	 * - новый sort_order.
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
				await invoke("delete_shortcut", {
					id,
				});
				setGroups((prev) => {
					const next = prev.map((group) => ({
						...group,
						shortcuts: group.shortcuts.filter((shortcut) => shortcut.id !== id),
					}));
					setLayout((current) => updateLayoutHeight(next, current));
					return next;
				});
			} catch (error) {
				console.error("Не удалось удалить ярлык:", error);
			}
		},
		[setGroups, setLayout],
	);

	return {
		createShortcut,
		loadShortcuts,
		applyLoadedShortcuts,
		updateShortcutsOrder,
		deleteShortcut,
	};
}

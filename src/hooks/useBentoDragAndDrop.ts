import {
	type CollisionDetection,
	closestCenter,
	type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback } from "react";

import type { BentoGroup } from "../components/BentoGrid/BentoGrid";
import { useBentoGroups } from "./useBentoGroups";
import { useBentoShortcuts } from "./useBentoShortcuts";

interface UseBentoDragAndDropParams {
	groups: BentoGroup[];
	setGroups: React.Dispatch<React.SetStateAction<BentoGroup[]>>;
}

/**
 * Управляет drag-and-drop групп и ярлыков:
 * определяет цели столкновений, обновляет порядок и сохраняет его в БД.
 * При ошибке сохранения восстанавливает предыдущее состояние.
 */

export function useBentoDragAndDrop({
	groups,
	setGroups,
}: UseBentoDragAndDropParams) {
	const { updateGroupsOrder } = useBentoGroups({ setGroups });
	const { updateShortcutsOrder } = useBentoShortcuts({ setGroups });

	const collisionDetection: CollisionDetection = useCallback((args) => {
		const activeType = args.active.data.current?.type;

		if (activeType === "shortcut") {
			const droppableContainers = args.droppableContainers.filter(
				(container) => {
					const type = container.data.current?.type;
					return type === "shortcut" || type === "group";
				},
			);

			return closestCenter({
				...args,
				droppableContainers,
			});
		}

		if (activeType === "group") {
			const droppableContainers = args.droppableContainers.filter(
				(container) => container.data.current?.type === "group",
			);

			return closestCenter({
				...args,
				droppableContainers,
			});
		}

		return closestCenter(args);
	}, []);

	const handleDragEnd = useCallback(
		async ({ active, over }: DragEndEvent) => {
			if (!over || active.id === over.id) return;

			const activeType = active.data.current?.type;

			// Перемещение групп
			if (activeType === "group") {
				const oldIndex = groups.findIndex(
					(group) => group.id === String(active.id),
				);
				const newIndex = groups.findIndex(
					(group) => group.id === String(over.id),
				);

				if (oldIndex < 0 || newIndex < 0) return;

				const previousGroups = groups;
				const nextGroups = arrayMove(groups, oldIndex, newIndex);

				setGroups(nextGroups);

				try {
					await updateGroupsOrder(nextGroups.map((group) => group.id));
				} catch (error) {
					console.error("Failed to save group order:", error);
					setGroups(previousGroups);
				}

				return;
			}

			// Перемещение ярлыков
			if (activeType === "shortcut") {
				const shortcutId = String(active.id);
				const sourceGroupId = active.data.current?.groupId as string;

				const overType = over.data.current?.type;

				const targetGroupId =
					overType === "shortcut"
						? (over.data.current?.groupId as string)
						: overType === "group"
							? String(over.id)
							: null;

				if (!targetGroupId) return;

				const sourceGroup = groups.find((group) => group.id === sourceGroupId);
				const targetGroup = groups.find((group) => group.id === targetGroupId);

				if (!sourceGroup || !targetGroup) return;

				const activeShortcut = sourceGroup.shortcuts.find(
					(shortcut) => shortcut.id === shortcutId,
				);

				if (!activeShortcut) return;

				const previousGroups = groups;

				// Перемещение внутри одной группы
				if (sourceGroupId === targetGroupId) {
					const oldIndex = sourceGroup.shortcuts.findIndex(
						(shortcut) => shortcut.id === shortcutId,
					);

					const newIndex =
						overType === "shortcut"
							? sourceGroup.shortcuts.findIndex(
									(shortcut) => shortcut.id === String(over.id),
								)
							: sourceGroup.shortcuts.length - 1;

					if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
						return;
					}

					const nextShortcuts = arrayMove(
						sourceGroup.shortcuts,
						oldIndex,
						newIndex,
					);

					const nextGroups = groups.map((group) =>
						group.id === sourceGroupId
							? { ...group, shortcuts: nextShortcuts }
							: group,
					);

					setGroups(nextGroups);

					try {
						await updateShortcutsOrder(
							nextShortcuts.map((shortcut, index) => ({
								id: shortcut.id,
								groupId: sourceGroupId,
								sortOrder: index,
							})),
						);
					} catch (error) {
						console.error("Failed to save shortcut order:", error);
						setGroups(previousGroups);
					}

					return;
				}

				// Перемещение в другую группу
				const sourceShortcuts = sourceGroup.shortcuts.filter(
					(shortcut) => shortcut.id !== shortcutId,
				);

				const targetShortcuts = [...targetGroup.shortcuts];

				const targetIndex =
					overType === "shortcut"
						? targetShortcuts.findIndex(
								(shortcut) => shortcut.id === String(over.id),
							)
						: targetShortcuts.length;

				targetShortcuts.splice(
					targetIndex < 0 ? targetShortcuts.length : targetIndex,
					0,
					activeShortcut,
				);

				const nextGroups = groups.map((group) => {
					if (group.id === sourceGroupId) {
						return { ...group, shortcuts: sourceShortcuts };
					}

					if (group.id === targetGroupId) {
						return { ...group, shortcuts: targetShortcuts };
					}

					return group;
				});

				setGroups(nextGroups);

				try {
					await updateShortcutsOrder([
						...sourceShortcuts.map((shortcut, index) => ({
							id: shortcut.id,
							groupId: sourceGroupId,
							sortOrder: index,
						})),
						...targetShortcuts.map((shortcut, index) => ({
							id: shortcut.id,
							groupId: targetGroupId,
							sortOrder: index,
						})),
					]);
				} catch (error) {
					console.error("Failed to save shortcut order:", error);
					setGroups(previousGroups);
				}
			}
		},
		[groups, setGroups, updateGroupsOrder, updateShortcutsOrder],
	);

	return {
		handleDragEnd,
		collisionDetection,
	};
}

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

		if (!activeType) {
			return closestCenter(args);
		}

		const droppableContainers = args.droppableContainers.filter(
			(container) => container.data.current?.type === activeType,
		);

		return closestCenter({
			...args,
			droppableContainers,
		});
	}, []);

	const handleDragEnd = useCallback(
		async ({ active, over }: DragEndEvent) => {
			if (!over || active.id === over.id) return;

			const activeType = active.data.current?.type;

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

			if (activeType === "shortcut") {
				const groupId = active.data.current?.groupId as string;
				const group = groups.find((item) => item.id === groupId);

				if (!group) return;

				const oldIndex = group.shortcuts.findIndex(
					(shortcut) => shortcut.id === String(active.id),
				);
				const newIndex = group.shortcuts.findIndex(
					(shortcut) => shortcut.id === String(over.id),
				);

				if (oldIndex < 0 || newIndex < 0) return;

				const previousGroups = groups;
				const nextGroups = groups.map((item) =>
					item.id === groupId
						? {
								...item,
								shortcuts: arrayMove(item.shortcuts, oldIndex, newIndex),
							}
						: item,
				);

				setGroups(nextGroups);

				try {
					const updatedGroup = nextGroups.find((item) => item.id === groupId);

					if (!updatedGroup) return;

					await updateShortcutsOrder(
						updatedGroup.shortcuts.map((shortcut, index) => ({
							id: shortcut.id,
							groupId,
							sortOrder: index,
						})),
					);
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

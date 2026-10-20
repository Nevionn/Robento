import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";

import { useBentoGroups } from "../../hooks/useBentoGroups";
import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";

import styles from "./BentoGrid.module.css";

export interface Shortcut {
	id: string;
	name: string;
	target: string;
	source: string;
	reservePath2icon?: string;
	icon: string | null;
}

export interface BentoGroup {
	id: string;
	title: string;
	shortcuts: Shortcut[];
}

/**
 * Сетка всех групп.
 * Загрузка и изменение данных (группы, ярлыки), обработка перетаскивания групп (стратегия сортировки).
 */

export default function BentoGrid() {
	const [groups, setGroups] = useState<BentoGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { loadGroups, updateGroupsOrder } = useBentoGroups({ setGroups });

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);

	useEffect(() => {
		let cancelled = false;

		async function start() {
			try {
				await loadGroups();
			} catch (error) {
				if (!cancelled) {
					setError(String(error));
					console.error("Failed to load groups:", error);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void start();

		return () => {
			cancelled = true;
		};
	}, [loadGroups]);

	async function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;

		const oldIndex = groups.findIndex(
			(group) => group.id === String(active.id),
		);
		const newIndex = groups.findIndex((group) => group.id === String(over.id));

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
	}

	if (loading) return null;

	if (error) {
		return (
			<div className={styles.wrapper}>Не удалось загрузить группы: {error}</div>
		);
	}

	return (
		<div
			className={groups.length > 0 ? styles.wrapper_withGroups : styles.wrapper}
		>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={groups.map((group) => group.id)}
					strategy={rectSortingStrategy}
				>
					<div className={styles.bentoGrid}>
						{groups.map((group) => (
							<BentoGroupCard key={group.id} group={group} />
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}

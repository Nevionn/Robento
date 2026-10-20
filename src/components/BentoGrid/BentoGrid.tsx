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
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";

import styles from "./BentoGrid.module.css";

export interface Shortcut {
	id: string;
	name: string;
	target: string;
	source: string;
	path2icon?: string;
	icon: string | null;
}

export interface BentoGroup {
	id: string;
	title: string;
	shortcuts: Shortcut[];
}

interface GroupDto {
	id: string;
	title: string;
	sort_order: number;
}

export default function BentoGrid() {
	const [groups, setGroups] = useState<BentoGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
	);

	useEffect(() => {
		let cancelled = false;

		async function loadGroups() {
			try {
				const result = await invoke<GroupDto[]>("get_groups");

				if (cancelled) return;

				setGroups(
					result.map((group) => ({
						id: group.id,
						title: group.title,
						shortcuts: [],
					})),
				);
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

		void loadGroups();

		return () => {
			cancelled = true;
		};
	}, []);

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
			await invoke("update_groups_order", {
				groupIds: nextGroups.map((group) => group.id),
			});
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

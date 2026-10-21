import {
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";

import { useBentoDragAndDrop } from "../../hooks/useBentoDragAndDrop";
import { useBentoGroups } from "../../hooks/useBentoGroups";
import { useBentoShortcuts } from "../../hooks/useBentoShortcuts";

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
 * Отвечает за загрузку данных (группы и ярлыки) и отображение групп.
 * Логика drag-and-drop берется из useBentoDragAndDrop.
 */

export default function BentoGrid() {
	const [groups, setGroups] = useState<BentoGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { loadGroups } = useBentoGroups({ setGroups });
	const { loadShortcuts } = useBentoShortcuts({ setGroups });

	const { handleDragEnd, collisionDetection } = useBentoDragAndDrop({
		groups,
		setGroups,
	});

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

				if (cancelled) return;

				await loadShortcuts();
			} catch (error) {
				if (!cancelled) {
					setError(String(error));
					console.error("Failed to load groups and shortcuts:", error);
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
	}, [loadGroups, loadShortcuts]);

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
				collisionDetection={collisionDetection}
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

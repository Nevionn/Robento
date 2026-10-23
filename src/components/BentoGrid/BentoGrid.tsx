import {
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useCallback, useEffect, useState } from "react";

import { useBentoDragAndDrop } from "../../hooks/useBentoDragAndDrop";
import { useBentoGroups } from "../../hooks/useBentoGroups";
import { useBentoKeyboardShortcuts } from "../../hooks/useBentoKeyboardShortcuts";
import { useBentoShortcuts } from "../../hooks/useBentoShortcuts";

import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";
import { CreateGroupModal } from "../modals/CreateGroupModal";

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
 * Сетка групп.
 *
 * Загружает и отображает группы с ярлыками,
 * управляет drag-and-drop и модальным окном создания группы.
 */

export default function BentoGrid() {
	const [groups, setGroups] = useState<BentoGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const { loadGroups, createGroup } = useBentoGroups({ setGroups });
	const { loadShortcuts } = useBentoShortcuts({ setGroups });

	const { handleDragEnd, collisionDetection } = useBentoDragAndDrop({
		groups,
		setGroups,
	});

	const openCreateModal = useCallback(() => {
		setIsCreateModalOpen(true);
	}, []);

	const closeCreateModal = useCallback(() => {
		setIsCreateModalOpen(false);
	}, []);

	useBentoKeyboardShortcuts({
		focusedGroupId: null,
		focusedShortcutId: null,

		onCreateGroup: openCreateModal,
		onEditGroup: () => {},
		onDeleteGroup: () => {},
		onDeleteShortcut: () => {},
		onAddShortcut: () => {},
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

			<CreateGroupModal
				isOpen={isCreateModalOpen}
				onClose={closeCreateModal}
				createGroup={createGroup}
			/>
		</div>
	);
}

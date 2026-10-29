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

import { filterBentoGroups } from "../../utils/filterBentoGroups";

import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";
import { CreateGroupModal } from "../modals/CreateGroupModal/CreateGroupModal";
import { CreateShortcutModal } from "../modals/CreateShortcutModal/CreateShortcutModal";
import styles from "./BentoGrid.module.css";
import BentoSearch from "./Search/BentoSearch";

export interface Shortcut {
	id: string;
	name: string;
	target: string;
	source: string;
	reserve_path2icon?: string;
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
	const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

	const [isCreateShortcutModalOpen, setIsCreateShortcutModalOpen] =
		useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const filteredGroups = filterBentoGroups(groups, searchQuery);
	const isSearchActive = searchQuery.trim().length > 0;

	const { loadGroups, createGroup, updateGroupTitle, deleteGroup } =
		useBentoGroups({
			setGroups,
		});
	const { loadShortcuts, createShortcut, deleteShortcut } = useBentoShortcuts({
		setGroups,
	});

	const { handleDragEnd, collisionDetection } = useBentoDragAndDrop({
		groups,
		setGroups,
	});

	const openCreateModal = useCallback(() => {
		setModalMode("create");
		setEditingGroupId(null);
		setIsCreateModalOpen(true);
	}, []);

	const openEditModal = useCallback((id: string) => {
		setModalMode("edit");
		setEditingGroupId(id);
		setIsCreateModalOpen(true);
	}, []);

	const closeCreateModal = useCallback(() => {
		setIsCreateModalOpen(false);
		setEditingGroupId(null);
	}, []);

	const openCreateShortcutModal = useCallback(() => {
		if (!focusedGroupId) return;

		setIsCreateShortcutModalOpen(true);
	}, [focusedGroupId]);

	const handleDeleteGroup = useCallback(
		async (id: string) => {
			try {
				await deleteGroup(id);

				setFocusedGroupId((currentId) => (currentId === id ? null : currentId));
			} catch (error) {
				console.error("Failed to delete group:", error);
			}
		},
		[deleteGroup],
	);

	useBentoKeyboardShortcuts({
		focusedGroupId,
		focusedShortcutId: null,

		onCreateGroup: openCreateModal,
		onEditGroup: openEditModal,
		onDeleteGroup: handleDeleteGroup,
		onAddShortcut: openCreateShortcutModal,
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
			<div className={styles.search}>
				<BentoSearch value={searchQuery} onChange={setSearchQuery} />
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragEnd={isSearchActive ? undefined : handleDragEnd}
			>
				<SortableContext
					items={filteredGroups.map((group) => group.id)}
					strategy={rectSortingStrategy}
				>
					{isSearchActive && filteredGroups.length > 0 && (
						<p className={styles.helperSearch}>Перетаскивание отключено</p>
					)}

					<div className={styles.bentoGrid}>
						{filteredGroups.map((group) => (
							<BentoGroupCard
								key={group.id}
								group={group}
								isSelected={focusedGroupId === group.id}
								onSelect={setFocusedGroupId}
								onDeleteShortcut={deleteShortcut}
							/>
						))}
					</div>

					{searchQuery.trim() !== "" && filteredGroups.length === 0 && (
						<p className={styles.emptySearch}>Ничего не найдено</p>
					)}
				</SortableContext>
			</DndContext>

			<CreateGroupModal
				isOpen={isCreateModalOpen}
				mode={modalMode}
				groupToEdit={
					groups.find((group) => group.id === editingGroupId) ?? null
				}
				onClose={closeCreateModal}
				createGroup={async (title) => {
					await createGroup(title);
				}}
				updateGroupTitle={async (id, title) => {
					await updateGroupTitle(id, title);
				}}
			/>

			<CreateShortcutModal
				isOpen={isCreateShortcutModalOpen}
				onClose={() => setIsCreateShortcutModalOpen(false)}
				onSave={async (data) => {
					if (!focusedGroupId) {
						throw new Error("Сначала выберите группу");
					}

					await createShortcut(focusedGroupId, {
						name: data.name || data.target.split(/[\\/]/).pop() || data.target,
						target: data.target,
						source: data.source,
						icon: data.icon,
						reserve_path2icon: data.reserve_path2icon || undefined,
					});
				}}
			/>
		</div>
	);
}

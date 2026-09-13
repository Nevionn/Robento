/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	MouseSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useRef, useState } from "react";

import type { Layout } from "react-grid-layout";
import ReactGridLayout, { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";

import { useBentoGroups } from "../../hooks/useBentoGroups";
import { useBentoKeyboardShortcuts } from "../../hooks/useBentoKeyboardShortcuts";
import { useBentoShortcuts } from "../../hooks/useBentoShortcuts";

import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";
import Hotkeys from "../Hotkeys/Hotkeys";
import styles from "./BentoGrid.module.css";
import { generateLayout, updateLayoutHeight } from "./layout";

export interface Shortcut {
	id: string;
	name: string;
	target: string;
	source: string;
	icon: string | null;
}

export interface BentoGroup {
	id: string;
	title: string;
	shortcuts: Shortcut[];
	isEditing?: boolean;
}

const initialGroups: BentoGroup[] = [];

/**
 * Главный контейнер Bento-сетки.
 *
 * Отвечает за:
 * - хранение групп в локальном state;
 * - первичную загрузку групп и ярлыков;
 * - отображение Bento-карточек;
 * - перемещение ярлыков;
 * - перенос ярлыков между группами;
 * - сортировку ярлыков внутри группы;
 * - локальное редактирование названия группы;
 * - перерасчёт высоты групп после изменения содержимого;
 * - обработку DnD файлов из ОС.
 *
 * CRUD-операции групп и ярлыков выполняются соответствующими хуками:
 * - useBentoGroups — группы;
 * - useBentoShortcuts — ярлыки.
 */

export default function BentoGrid() {
	const { width, containerRef, mounted } = useContainerWidth();

	const [groups, setGroups] = useState<BentoGroup[]>(initialGroups);
	const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);
	const [focusedShortcutId, setFocusedShortcutId] = useState<string | null>(
		null,
	);

	const [dropTargetGroup, setDropTargetGroup] = useState<string | null>(null);
	const [isDraggingShortcut, setIsDraggingShortcut] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	const dropTargetGroupRef = useRef<string | null>(null);
	const [layout, setLayout] = useState<Layout>(generateLayout(initialGroups));

	const {
		addGroupDraft,
		submitGroupTitle,
		deleteGroup,
		updateGroupsOrder,
		loadGroups,
	} = useBentoGroups({
		setGroups,
		setLayout,
	});

	const {
		createShortcut,
		loadShortcuts,
		applyLoadedShortcuts,
		updateShortcutsOrder,
		deleteShortcut,
	} = useBentoShortcuts({
		setGroups,
		setLayout,
	});

	/**
	 * Первичная загрузка.
	 *
	 * loadGroups() -> loadShortcuts() -> applyLoadedShortcuts(savedShortcuts)
	 *
	 * ReactGridLayout НЕ монтируется до тех пор,
	 * пока ярлыки не загружены и groups не получили
	 * актуальное содержимое.
	 */

	useEffect(() => {
		let cancelled = false;

		async function initialize() {
			try {
				await loadGroups();

				if (cancelled) {
					return;
				}

				const savedShortcuts = await loadShortcuts();

				if (cancelled) {
					return;
				}

				applyLoadedShortcuts(savedShortcuts);
			} finally {
				if (!cancelled) {
					setIsInitialLoading(false);
				}
			}
		}

		void initialize();

		return () => {
			cancelled = true;
		};
	}, [loadGroups, loadShortcuts, applyLoadedShortcuts]);

	/**
	 * После первичной загрузки groups уже содержит ярлыки.
	 *
	 * Здесь строим layout только один раз из актуального
	 * состояния.
	 */

	useEffect(() => {
		if (isInitialLoading) {
			return;
		}

		setLayout((current) => updateLayoutHeight(groups, current));
	}, [isInitialLoading]);

	useBentoKeyboardShortcuts({
		focusedGroupId,
		focusedShortcutId,
		onCreateGroup: addGroupDraft,
		onEditGroup: startEditingGroup,
		onDeleteGroup: deleteGroup,
		onDeleteShortcut: deleteShortcut,
	});

	function handleGroupTitleChange(id: string, title: string) {
		setGroups((prev) =>
			prev.map((group) =>
				group.id === id
					? {
							...group,
							title,
						}
					: group,
			),
		);
	}

	function startEditingGroup(id: string) {
		setGroups((prev) =>
			prev.map((group) =>
				group.id === id
					? {
							...group,
							isEditing: true,
						}
					: group,
			),
		);
	}

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	function handleShortcutDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over) {
			return;
		}

		let sourceId: string | undefined;
		let targetId: string | undefined;

		groups.forEach((group) => {
			if (group.shortcuts.some((item) => item.id === active.id)) {
				sourceId = group.id;
			}
		});

		if (typeof over.id === "string" && over.id.startsWith("group-")) {
			targetId = over.id.replace("group-", "");
		} else {
			groups.forEach((group) => {
				if (group.shortcuts.some((item) => item.id === over.id)) {
					targetId = group.id;
				}
			});
		}

		if (!sourceId || !targetId) {
			return;
		}

		const copy = structuredClone(groups);

		const source = copy.find((group) => group.id === sourceId);
		const target = copy.find((group) => group.id === targetId);

		if (!source || !target) {
			return;
		}

		const oldIndex = source.shortcuts.findIndex(
			(item) => item.id === active.id,
		);

		if (oldIndex === -1) {
			return;
		}

		// Сортировка внутри группы.
		if (sourceId === targetId) {
			const newIndex = source.shortcuts.findIndex(
				(item) => item.id === over.id,
			);

			if (newIndex === -1 || oldIndex === newIndex) {
				return;
			}

			source.shortcuts = arrayMove(source.shortcuts, oldIndex, newIndex);
		} else {
			// Перенос между группами.
			const [item] = source.shortcuts.splice(oldIndex, 1);

			const targetIndex = target.shortcuts.findIndex(
				(item) => item.id === over.id,
			);

			if (targetIndex === -1) {
				target.shortcuts.push(item);
			} else {
				target.shortcuts.splice(targetIndex, 0, item);
			}
		}

		setGroups(copy);
		setLayout((current) => updateLayoutHeight(copy, current));

		const shortcuts: {
			id: string;
			groupId: string;
			sortOrder: number;
		}[] = copy.flatMap((group: BentoGroup) =>
			group.shortcuts.map((shortcut: Shortcut, index: number) => ({
				id: shortcut.id,
				groupId: group.id,
				sortOrder: index,
			})),
		);

		void updateShortcutsOrder(shortcuts);
	}

	useEffect(() => {
		let unlisten: undefined | (() => void);

		async function init() {
			const webview = getCurrentWebview();

			unlisten = await webview.onDragDropEvent(async (event) => {
				switch (event.payload.type) {
					case "over":
						break;

					case "leave":
						setDropTargetGroup(null);
						break;

					case "drop": {
						const targetGroupId = dropTargetGroupRef.current;

						if (!targetGroupId) {
							return;
						}

						const path = event.payload.paths[0];

						const shortcut = await invoke<Shortcut>("parse_shortcut", {
							path,
						});

						await createShortcut(targetGroupId, shortcut);
						break;
					}
				}
			});
		}

		void init();

		return () => {
			unlisten?.();
		};
	}, []);

	return (
		<section
			ref={containerRef}
			className={`${styles.wrapper} ${
				groups.length > 0 ? styles.wrapper_withGroups : ""
			}`}
		>
			{isInitialLoading && null}

			{!isInitialLoading && groups.length === 0 && <Hotkeys />}

			{!isInitialLoading && groups.length > 0 && mounted && (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={() => setIsDraggingShortcut(true)}
					onDragEnd={(event) => {
						setIsDraggingShortcut(false);
						handleShortcutDragEnd(event);
					}}
					onDragCancel={() => setIsDraggingShortcut(false)}
				>
					<ReactGridLayout
						width={width}
						layout={layout}
						gridConfig={{
							cols: 2,
							rowHeight: 140,
							margin: [16, 16],
							containerPadding: [0, 0],
						}}
						dragConfig={{
							enabled: !isDraggingShortcut,
							cancel: ".shortcut-drag",
						}}
						resizeConfig={{
							enabled: false,
						}}
						onLayoutChange={(next) => {
							setLayout([...next]);

							const orderedGroupIds = [...next]
								.sort((currentGroup, nextGroup) => {
									if (currentGroup.y !== nextGroup.y) {
										return currentGroup.y - nextGroup.y;
									}

									return currentGroup.x - nextGroup.x;
								})
								.map((groupLayout) => groupLayout.i);

							void updateGroupsOrder(orderedGroupIds);
						}}
					>
						{groups.map((group) => (
							<div key={group.id}>
								<BentoGroupCard
									group={group}
									onTitleChange={handleGroupTitleChange}
									onSubmitGroup={submitGroupTitle}
									onGroupFocus={() => {
										setFocusedGroupId(group.id);
										setFocusedShortcutId(null);
									}}
									onShortcutFocus={(shortcutId) => {
										setFocusedShortcutId(shortcutId);
										setFocusedGroupId(group.id);
									}}
									onDragOver={(id) => {
										dropTargetGroupRef.current = id;
										setDropTargetGroup(id);
									}}
									onDragLeave={() => {
										dropTargetGroupRef.current = null;
										setDropTargetGroup(null);
									}}
									dropTargetGroup={dropTargetGroup}
								/>
							</div>
						))}
					</ReactGridLayout>
				</DndContext>
			)}
		</section>
	);
}

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
import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";

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
 * - хранение групп;
 * - отображение Bento-карточек;
 * - перемещение ярлыков;
 * - перенос ярлыков между группами;
 * - сортировку ярлыков внутри группы;
 * - перерасчёт высоты групп после изменения содержимого.
 */

export default function BentoGrid() {
	const { width, containerRef, mounted } = useContainerWidth();

	const [groups, setGroups] = useState(initialGroups);
	const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);
	const [dropTargetGroup, setDropTargetGroup] = useState<string | null>(null);
	const [isDraggingShortcut, setIsDraggingShortcut] = useState(false);

	const dropTargetGroupRef = useRef<string | null>(null);

	const [layout, setLayout] = useState<Layout>(generateLayout(initialGroups));

	const { addGroupDraft, submitGroupTitle } = useBentoGroups({
		setGroups,
		setLayout,
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

	function addShortcutToGroup(groupId: string, shortcut: Shortcut) {
		setGroups((prev) => {
			const next = prev.map((group) =>
				group.id === groupId
					? {
							...group,
							shortcuts: [...group.shortcuts, shortcut],
						}
					: group,
			);

			setLayout((current) => updateLayoutHeight(next, current));

			return next;
		});
	}

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.repeat) {
				return;
			}

			if (event.shiftKey && event.key.toLowerCase() === "g") {
				event.preventDefault();
				addGroupDraft();
				return;
			}

			if (event.key === "r" && focusedGroupId) {
				event.preventDefault();
				startEditingGroup(focusedGroupId);
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [focusedGroupId]);

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

		setGroups((prev) => {
			const copy = structuredClone(prev);

			const source = copy.find((group) => group.id === sourceId);

			const target = copy.find((group) => group.id === targetId);

			if (!source || !target) {
				return prev;
			}

			const oldIndex = source.shortcuts.findIndex(
				(item) => item.id === active.id,
			);

			if (oldIndex === -1) {
				return prev;
			}

			// сортировка внутри группы

			if (sourceId === targetId) {
				const newIndex = source.shortcuts.findIndex(
					(item) => item.id === over.id,
				);

				if (newIndex === -1) {
					return prev;
				}

				if (oldIndex === newIndex) {
					return prev;
				}

				source.shortcuts = arrayMove(source.shortcuts, oldIndex, newIndex);

				return copy;
			}

			// перенос между группами

			const [item] = source.shortcuts.splice(oldIndex, 1);

			const targetIndex = target.shortcuts.findIndex(
				(item) => item.id === over.id,
			);

			if (targetIndex === -1) {
				target.shortcuts.push(item);
			} else {
				target.shortcuts.splice(targetIndex, 0, item);
			}

			setLayout((current) => updateLayoutHeight(copy, current));

			return copy;
		});
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
						const target = dropTargetGroupRef.current;

						if (!target) {
							return;
						}

						const path = event.payload.paths[0];

						const shortcut = await invoke<Shortcut>("parse_shortcut", {
							path,
						});

						addShortcutToGroup(target, {
							...shortcut,
							id: crypto.randomUUID(),
						});

						break;
					}
				}
			});
		}

		init();

		return () => {
			unlisten?.();
		};
	}, []);

	return (
		<section ref={containerRef} className={styles.wrapper}>
			{mounted && (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={() => setIsDraggingShortcut(true)}
					onDragEnd={(e) => {
						setIsDraggingShortcut(false);
						handleShortcutDragEnd(e);
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
						onLayoutChange={(next) => setLayout([...next])}
					>
						{groups.map((group) => (
							<div key={group.id}>
								<BentoGroupCard
									group={group}
									onTitleChange={handleGroupTitleChange}
									onSubmitGroup={submitGroupTitle}
									onFocus={() => setFocusedGroupId(group.id)}
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

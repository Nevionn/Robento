import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	MouseSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { useEffect, useState } from "react";

import type { Layout } from "react-grid-layout";
import ReactGridLayout, { useContainerWidth } from "react-grid-layout";

import "react-grid-layout/css/styles.css";

import BentoGroupCard from "../BentoGroupCard/BentoGroupCard";
import styles from "./BentoGrid.module.css";

export interface Shortcut {
	id: string;
	name: string;
	icon: string;
}

export interface BentoGroup {
	id: string;
	title: string;
	shortcuts: Shortcut[];
	isEditing?: boolean;
}

const initialGroups: BentoGroup[] = [];

/**
 * Вычисляет необходимую высоту карточки в grid-ячейках.
 *
 * Расчёт основан на двухколоночном расположении ярлыков:
 * каждые два элемента занимают один ряд.
 */

function calcH(count: number) {
	return Math.max(1, Math.ceil(count / 2));
}

/**
 * Генерирует начальную раскладку карточек Bento-сетки.
 *
 * Распределяет группы между двумя колонками,
 * стараясь сохранять одинаковую высоту колонок.
 *
 * Возвращает layout, совместимый с react-grid-layout.
 */

function generateLayout(groups: BentoGroup[]): Layout {
	const colY = [0, 0];

	return groups.map((group) => {
		const h = calcH(group.shortcuts.length);

		const col = colY[0] <= colY[1] ? 0 : 1;
		const y = colY[col];

		colY[col] += h;

		return {
			i: group.id,
			x: col,
			y,
			w: 1,
			h,
		};
	});
}

function updateLayoutHeight(groups: BentoGroup[], layout: Layout): Layout {
	return layout.map((item) => {
		const group = groups.find((group) => group.id === item.i);

		if (!group) {
			return item;
		}

		return {
			...item,
			h: calcH(group.shortcuts.length),
		};
	});
}

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

	const [layout, setLayout] = useState<Layout>(generateLayout(initialGroups));

	function createGroup() {
		const group: BentoGroup = {
			id: crypto.randomUUID(),
			title: "",
			shortcuts: [],
			isEditing: true,
		};

		setGroups((prev) => {
			const next = [...prev, group];

			setLayout(generateLayout(next));

			return next;
		});
	}

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

	function handleFinishEditing(id: string) {
		setGroups((prev) =>
			prev.map((group) =>
				group.id === id
					? {
							...group,
							isEditing: false,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.repeat) {
				return;
			}

			if (event.shiftKey && event.key.toLowerCase() === "g") {
				event.preventDefault();
				createGroup();
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

		if (!over || active.id === over.id) {
			return;
		}

		let sourceId: string | undefined;
		let targetId: string | undefined;

		groups.forEach((group) => {
			if (group.shortcuts.some((item) => item.id === active.id)) {
				sourceId = group.id;
			}

			if (group.shortcuts.some((item) => item.id === over.id)) {
				targetId = group.id;
			}
		});

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

	return (
		<section ref={containerRef} className={styles.wrapper}>
			{mounted && (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleShortcutDragEnd}
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
							enabled: true,
							cancel: "button",
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
									onFinishEditing={handleFinishEditing}
									onFocus={() => setFocusedGroupId(group.id)}
								/>
							</div>
						))}
					</ReactGridLayout>
				</DndContext>
			)}
		</section>
	);
}

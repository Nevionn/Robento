import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	MouseSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { useState } from "react";

import type { Layout } from "react-grid-layout";
import ReactGridLayout, { useContainerWidth } from "react-grid-layout";

import "react-grid-layout/css/styles.css";

import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";
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
}

const initialGroups: BentoGroup[] = [
	{
		id: "browser",
		title: "Браузеры",
		shortcuts: [
			{ id: "chrome", name: "Chrome", icon: "🌐" },
			{ id: "firefox", name: "Firefox", icon: "🦊" },
			{ id: "edge", name: "Edge", icon: "🔷" },
			{ id: "waterfox", name: "Waterfox", icon: "🔷" },
			{ id: "librewolf", name: "LibreWolf", icon: "🔷" },
		],
	},
	{
		id: "games",
		title: "Игры",
		shortcuts: [
			{ id: "steam", name: "Steam", icon: "🎮" },
			{ id: "minecraft", name: "Minecraft", icon: "⛏️" },
			{ id: "wow", name: "Wow", icon: "⚔️" },
		],
	},
	{
		id: "work",
		title: "Работа",
		shortcuts: [
			{ id: "vscode", name: "VS Code", icon: "💻" },
			{ id: "figma", name: "Figma", icon: "🎨" },
		],
	},
	{
		id: "media",
		title: "Медиа",
		shortcuts: [
			{ id: "spotify", name: "Spotify", icon: "🎵" },
			{ id: "youtube", name: "YouTube", icon: "▶️" },
			{ id: "discord", name: "Discord", icon: "💬" },
			{ id: "photos", name: "Photos", icon: "🖼️" },
		],
	},
];

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

	const [layout, setLayout] = useState<Layout>(generateLayout(initialGroups));

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

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
							<div key={group.id} className={styles.card}>
								<header className={styles.header}>
									<h2>{group.title}</h2>
								</header>

								<div className={styles.shortcuts}>
									<ShortcutGrid
										groupId={group.id}
										shortcuts={group.shortcuts}
									/>
								</div>
							</div>
						))}
					</ReactGridLayout>
				</DndContext>
			)}
		</section>
	);
}

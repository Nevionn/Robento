import { useState } from "react";

import ReactGridLayout, {
	type Layout,
	useContainerWidth,
} from "react-grid-layout";

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
			{
				id: "chrome",
				name: "Chrome",
				icon: "🌐",
			},
			{
				id: "firefox",
				name: "Firefox",
				icon: "🦊",
			},
			{
				id: "edge",
				name: "Edge",
				icon: "🔷",
			},
			{
				id: "waterfox",
				name: "Waterfox",
				icon: "🔷",
			},
			{
				id: "librewolf",
				name: "LibreWolf",
				icon: "🔷",
			},
		],
	},
	{
		id: "games",
		title: "Игры",
		shortcuts: [
			{
				id: "steam",
				name: "Steam",
				icon: "🎮",
			},
			{
				id: "minecraft",
				name: "Minecraft",
				icon: "⛏️",
			},
			{
				id: "wow",
				name: "Wow",
				icon: "⚔️",
			},
		],
	},
	{
		id: "work",
		title: "Работа",
		shortcuts: [
			{
				id: "vscode",
				name: "VS Code",
				icon: "💻",
			},
			{
				id: "figma",
				name: "Figma",
				icon: "🎨",
			},
		],
	},
	{
		id: "media",
		title: "Медиа",
		shortcuts: [
			{
				id: "spotify",
				name: "Spotify",
				icon: "🎵",
			},
			{
				id: "youtube",
				name: "YouTube",
				icon: "▶️",
			},
			{
				id: "discord",
				name: "Discord",
				icon: "💬",
			},
			{
				id: "photos",
				name: "Photos",
				icon: "🖼️",
			},
		],
	},
];

/**
 * Основной компонент Bento-сетки.
 *
 * Поддерживает:
 * - drag & drop карточек;
 * - изменение порядка ярлыков;
 * - динамический расчёт размеров карточек.
 *
 * Использует:
 * - react-grid-layout — для перемещения карточек групп;
 * - ShortcutGrid — для сортировки ярлыков внутри групп.
 *
 * Отвечает за:
 * - отображение групп ярлыков в двухколоночном grid layout;
 * - управление позициями карточек через react-grid-layout;
 * - хранение состояния групп и порядка ярлыков внутри них;
 * - передачу управления сортировкой ярлыков в ShortcutGrid.
 *
 */

export default function BentoGrid() {
	const { width, containerRef, mounted } = useContainerWidth();

	const [groups, setGroups] = useState(initialGroups);

	const [layout, setLayout] = useState<Layout>(generateLayout(initialGroups));

	/**
	 * Вычисляет необходимую высоту карточки в grid-ячейках.
	 *
	 * Расчёт основан на двухколоночном расположении ярлыков:
	 * каждые два элемента занимают один ряд.
	 */

	function calcH(count: number): number {
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

	return (
		<section ref={containerRef} className={styles.wrapper}>
			{mounted && (
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
						cancel: "button, .shortcut",
					}}
					resizeConfig={{
						enabled: false,
					}}
					onLayoutChange={(next) => {
						setLayout([...next]);
					}}
				>
					{groups.map((group) => (
						<div key={group.id} className={styles.card}>
							<header className={styles.header}>
								<h2>{group.title}</h2>
							</header>

							<div className={styles.shortcuts}>
								<ShortcutGrid
									shortcuts={group.shortcuts}
									onChange={(shortcuts) => {
										setGroups((prev) =>
											prev.map((g) =>
												g.id === group.id
													? {
															...g,
															shortcuts,
														}
													: g,
											),
										);
									}}
								/>
							</div>
						</div>
					))}
				</ReactGridLayout>
			)}
		</section>
	);
}

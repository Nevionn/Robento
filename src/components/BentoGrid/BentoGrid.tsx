import { useState } from "react";
import ReactGridLayout, {
	type Layout,
	useContainerWidth,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import styles from "./BentoGrid.module.css";

interface Shortcut {
	name: string;
	icon: string;
}

interface BentoGroup {
	id: string;
	title: string;
	shortcuts: Shortcut[];
}

const groups: BentoGroup[] = [
	{
		id: "browser",
		title: "Браузеры",
		shortcuts: [
			{ name: "Chrome", icon: "🌐" },
			{ name: "Firefox", icon: "🦊" },
			{ name: "Edge", icon: "🔷" },
			{ name: "Waterfox", icon: "🔷" },
			{ name: "librewolf", icon: "🔷" },
		],
	},
	{
		id: "games",
		title: "Игры",
		shortcuts: [
			{ name: "Steam", icon: "🎮" },
			{ name: "Minecraft", icon: "⛏️" },
			{ name: "Wow", icon: "⚔️" },
		],
	},
	{
		id: "work",
		title: "Работа",
		shortcuts: [
			{ name: "VS Code", icon: "💻" },
			{ name: "Figma", icon: "🎨" },
		],
	},
	{
		id: "media",
		title: "Медиа",
		shortcuts: [
			{ name: "Spotify", icon: "🎵" },
			{ name: "YouTube", icon: "▶️" },
			{ name: "Discord", icon: "💬" },
			{ name: "Photos", icon: "🖼️" },
		],
	},
];

/** Сколько рядов нужно под N ярлыков (2 в ряд) */
function calcH(count: number): number {
	return Math.max(1, Math.ceil(count / 2));
}

/** Генерируем layout: кладём каждую группу в более низкую колонку */
function generateLayout(groups: BentoGroup[]): Layout {
	const colY = [0, 0];

	return groups.map((group) => {
		const h = calcH(group.shortcuts.length);
		const col = colY[0] <= colY[1] ? 0 : 1;
		const y = colY[col];
		colY[col] += h;

		return { i: group.id, x: col, y, w: 1, h };
	});
}

export default function BentoGrid() {
	const { width, containerRef, mounted } = useContainerWidth();

	// layout пересчитывается при изменении groups
	const initialLayout = generateLayout(groups);
	const [layout, setLayout] = useState<Layout>(initialLayout);

	// если groups изменятся снаружи — обновляем высоты, сохраняя позиции
	// (в будущем, когда список станет динамическим)
	// useEffect(() => {
	//     setLayout((prev) => {
	//         const byId = Object.fromEntries(prev.map((item) => [item.i, item]));
	//         return groups.map((g) => {
	//             const old = byId[g.id];
	//             const h = calcH(g.shortcuts.length);
	//             return old
	//                 ? { ...old, h }
	//                 : { i: g.id, x: 0, y: 0, w: 1, h };
	//         });
	//     });
	// }, [groups]);

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
					onLayoutChange={(next) => setLayout([...next])}
				>
					{groups.map((group) => (
						<div key={group.id} className={styles.card}>
							<header className={styles.header}>
								<h2>{group.title}</h2>
							</header>
							<div className={styles.shortcuts}>
								{group.shortcuts.map((item) => (
									<button key={item.name} className={styles.shortcut}>
										<span className={styles.icon}>{item.icon}</span>
										<span>{item.name}</span>
									</button>
								))}
							</div>
						</div>
					))}
				</ReactGridLayout>
			)}
		</section>
	);
}

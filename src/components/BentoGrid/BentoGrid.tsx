import styles from "./BentoGrid.module.css";

interface Shortcut {
	name: string;
	icon: string;
}

interface BentoGroup {
	title: string;
	shortcuts: Shortcut[];
}

const groups: BentoGroup[] = [
	{
		title: "Браузеры",
		shortcuts: [
			{
				name: "Chrome",
				icon: "🌐",
			},
			{
				name: "Firefox",
				icon: "🦊",
			},
			{
				name: "Edge",
				icon: "🔷",
			},
			{
				name: "Waterfox",
				icon: "🔷",
			},
		],
	},
	{
		title: "Игры",
		shortcuts: [
			{
				name: "Steam",
				icon: "🎮",
			},
			{
				name: "Minecraft",
				icon: "⛏️",
			},
			{
				name: "Dota",
				icon: "⚔️",
			},
		],
	},
	{
		title: "Работа",
		shortcuts: [
			{
				name: "VS Code",
				icon: "💻",
			},
			{
				name: "Figma",
				icon: "🎨",
			},
		],
	},
	{
		title: "Медиа",
		shortcuts: [
			{
				name: "Spotify",
				icon: "🎵",
			},
			{
				name: "YouTube",
				icon: "▶️",
			},
			{
				name: "Discord",
				icon: "💬",
			},
			{
				name: "Photos",
				icon: "🖼️",
			},
		],
	},
];

function BentoGrid() {
	return (
		<section className={styles.grid}>
			{groups.map((group) => (
				<div
					className={`${styles.card} ${styles[group.title]}`}
					key={group.title}
				>
					<header className={styles.header}>
						<h2>{group.title}</h2>
					</header>

					<div className={styles.shortcuts}>
						{group.shortcuts.map((item) => (
							<button className={styles.shortcut} key={item.name}>
								<span className={styles.icon}>{item.icon}</span>
								<span>{item.name}</span>
							</button>
						))}
					</div>
				</div>
			))}
		</section>
	);
}

export default BentoGrid;

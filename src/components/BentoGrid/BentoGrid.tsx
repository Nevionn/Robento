import {
	DndContext,
	DragEndEvent,
	MouseSensor,
	useSensor,
	useSensors,
	closestCenter,
} from "@dnd-kit/core";

import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useState } from "react";

import styles from "./BentoGrid.module.css";

import SortableCard from "./SortableCard";

interface Shortcut {
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
		id: "games",

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
		id: "work",

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
		id: "media",

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
	const [groups, setGroups] = useState<BentoGroup[]>(initialGroups);

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 10,
			},
		}),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		setGroups((items) => {
			const oldIndex = items.findIndex((item) => item.id === active.id);

			const newIndex = items.findIndex((item) => item.id === over.id);

			return arrayMove(items, oldIndex, newIndex);
		});
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={groups.map((item) => item.id)}
				strategy={verticalListSortingStrategy}
			>
				<section className={styles.grid}>
					{groups.map((group) => (
						<SortableCard key={group.id} group={group} />
					))}
				</section>
			</SortableContext>
		</DndContext>
	);
}

export default BentoGrid;

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

import ShortcutContextMenu from "../ShortcutContextMenu/ShortcutContextMenu";

import styles from "./SortableShortcut.module.css";

interface Props {
	id: string;
	groupId: string;
	name: string;
	icon: string | null;
	target: string;
}

/**
 * Компонент ярлыка.
 * Отображение, перетаскивание и запуск программ.
 */

export default function SortableShortcut({
	id,
	groupId,
	name,
	icon,
	target,
}: Props) {
	const {
		setNodeRef,
		attributes,
		listeners,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		data: {
			type: "shortcut",
			groupId,
		},
	});

	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
	} | null>(null);

	async function handleClick() {
		await invoke("launch_shortcut", { target });
	}

	return (
		<>
			<button
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				className={`${styles.shortcut} shortcut-drag`}
				style={{
					transform: CSS.Transform.toString(transform),
					transition,
					opacity: isDragging ? 0.5 : 1,
					zIndex: isDragging ? 10 : undefined,
				}}
				onClick={(event) => {
					event.stopPropagation();
					void handleClick();
				}}
				onContextMenu={(event) => {
					event.preventDefault();
					event.stopPropagation();

					setContextMenu({
						x: event.clientX,
						y: event.clientY,
					});
				}}
			>
				{icon ? (
					<img src={icon} className={styles.icon} alt="" />
				) : (
					<div className={styles.icon} />
				)}

				<span className={styles.name_shortcut}>{name}</span>
			</button>

			{contextMenu && (
				<ShortcutContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</>
	);
}

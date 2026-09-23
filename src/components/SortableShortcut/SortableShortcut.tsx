import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { invoke } from "@tauri-apps/api/core";

import styles from "./SortableShortcut.module.css";

interface Props {
	id: string;
	name: string;
	icon: string | null;
	target: string;

	onShortcutFocus(shortcutId: string | null): void;
}

/**
 * Отдельный перетаскиваемый ярлык.
 *
 * Поддерживает перенос между группами
 * через общий DndContext.
 */

export default function SortableShortcut({
	id,
	name,
	icon,
	target,
	onShortcutFocus,
}: Props) {
	const { setNodeRef, attributes, listeners, transform, isDragging } =
		useSortable({
			id,
		});

	async function handleClick() {
		await invoke("launch_shortcut", {
			target,
		});
	}

	return (
		<button
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={`${styles.shortcut} shortcut-drag`}
			style={{
				transform: CSS.Transform.toString(transform),
				transition: "none",
				opacity: isDragging ? 0.5 : 1,
				zIndex: isDragging ? 10 : undefined,
			}}
			onMouseEnter={() => {
				onShortcutFocus(id);
			}}
			onClick={(event) => {
				event.stopPropagation();
				void handleClick();
			}}
		>
			{icon ? (
				<img src={icon} className={styles.icon} alt="" />
			) : (
				<div className={styles.icon} />
			)}

			<span className={styles.name_shortcut}>{name}</span>
		</button>
	);
}

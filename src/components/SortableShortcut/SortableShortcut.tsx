import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { invoke } from "@tauri-apps/api/core";

import styles from "./SortableShortcut.module.css";

interface Props {
	id: string;
	name: string;
	icon: string | null;
	target: string;
	searchQuery: string;

	onShortcutFocus(shortcutId: string | null): void;
}

/**
 * Отдельный перетаскиваемый ярлык.
 *
 * Поддерживает перенос между группами
 * через общий DndContext.
 * Фильтрацию по поиску через проп searchQuery.
 */

export default function SortableShortcut({
	id,
	name,
	icon,
	target,
	searchQuery,
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

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const isSearchActive = normalizedQuery.length > 0;
	const isMatch = name.toLowerCase().includes(normalizedQuery);

	return (
		<button
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={`
            ${styles.shortcut}
             shortcut-drag
            ${isSearchActive && isMatch ? styles.match : ""}
    		${isSearchActive && !isMatch ? styles.dimmed : ""}
					 `}
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

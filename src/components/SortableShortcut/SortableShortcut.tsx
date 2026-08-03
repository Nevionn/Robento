import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "../BentoGrid/BentoGrid.module.css";

interface Props {
	id: string;
	name: string;
	icon: string | null;
}

/**
 * Отдельный перетаскиваемый ярлык.
 *
 * Поддерживает перенос между группами
 * через общий DndContext.
 */

export default function SortableShortcut({ id, name, icon }: Props) {
	const { setNodeRef, attributes, listeners, transform, isDragging } =
		useSortable({
			id,
		});

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
		>
			{icon ? (
				<img src={icon} className={styles.icon} />
			) : (
				<div className={styles.icon} />
			)}

			<span>{name}</span>
		</button>
	);
}

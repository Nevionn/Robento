import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BentoGroup } from "../BentoGrid/BentoGrid";
import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";
import styles from "./BentoGroupCard.module.css";

interface Props {
	group: BentoGroup;
	isSelected: boolean;
	onSelect: (id: string) => void;
}

/**
 * Компонент отдельной группы.
 * Визуальное перемещение гупп.
 * @param {BentoGroup} props.group.
 */

export default function BentoGroupCard({ group, isSelected, onSelect }: Props) {
	const {
		setNodeRef,
		transform,
		transition,
		isDragging,
		attributes,
		listeners,
	} = useSortable({
		id: group.id,
		data: { type: "group" },
	});

	return (
		<div
			ref={setNodeRef}
			className={`${styles.card} ${isSelected ? styles.selected : ""}`}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				zIndex: isDragging ? 2 : undefined,
				opacity: isDragging ? 0.6 : 1,
			}}
			{...attributes}
			{...listeners}
			onClick={() => onSelect(group.id)}
		>
			<header className={styles.header}>
				<h2>{group.title}</h2>
			</header>

			<div className={styles.shortcuts}>
				<ShortcutGrid groupId={group.id} shortcuts={group.shortcuts} />
			</div>
		</div>
	);
}

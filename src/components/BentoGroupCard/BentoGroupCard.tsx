import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BentoGroup } from "../BentoGrid/BentoGrid";
import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";
import styles from "./BentoGroupCard.module.css";

interface Props {
	group: BentoGroup;
}

export default function BentoGroupCard({ group }: Props) {
	const {
		setNodeRef,
		transform,
		transition,
		isDragging,
		attributes,
		listeners,
	} = useSortable({
		id: group.id,
	});

	return (
		<div
			ref={setNodeRef}
			className={styles.card}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				zIndex: isDragging ? 2 : undefined,
				opacity: isDragging ? 0.6 : 1,
			}}
			{...attributes}
			{...listeners}
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

import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import styles from "./BentoGrid.module.css";

import type { BentoGroup } from "./BentoGrid";

interface Props {
	group: BentoGroup;
}

export default function SortableCard({ group }: Props) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: group.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),

		transition: transition ?? "transform 250ms cubic-bezier(0.25, 1, 0.5, 1)",

		zIndex: isDragging ? 10 : undefined,

		opacity: isDragging ? 0.7 : 1,
	};

	return (
		<article
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={styles.card}
		>
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
		</article>
	);
}

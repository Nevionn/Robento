import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";

import type { BentoGroup, Shortcut } from "../BentoGrid/BentoGrid";
import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";
import styles from "./BentoGroupCard.module.css";

interface Props {
	group: BentoGroup;
	isSelected: boolean;
	onSelect: (id: string) => void;
	onDeleteShortcut: (id: string) => Promise<void>;
	onEditShortcut: (shortcut: Shortcut) => void;
	onEditGroup: (id: string) => void;
}

/**
 * Карточка группы.
 *
 * Отвечает за:
 * onSelect: Выбирает группу.
 * onDeleteShortcut: Удаляет ярлык.
 * onEditShortcut: Открывает редактирование ярлыка.
 * onEditGroup: Открывает редактирование группы.
 */

export default function BentoGroupCard({
	group,
	isSelected,
	onSelect,
	onDeleteShortcut,
	onEditShortcut,
	onEditGroup,
}: Props) {
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

				<button
					type="button"
					className={styles.editButton}
					aria-label="Редактировать группу"
					title="Редактировать группу"
					onClick={(event) => {
						event.stopPropagation();
						onEditGroup(group.id);
					}}
				>
					<Pencil size={16} />
				</button>
			</header>

			<div className={styles.shortcuts}>
				<ShortcutGrid
					groupId={group.id}
					shortcuts={group.shortcuts}
					onDeleteShortcut={onDeleteShortcut}
					onEditShortcut={onEditShortcut}
				/>
			</div>
		</div>
	);
}

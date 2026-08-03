import { useDroppable } from "@dnd-kit/core";
import type { BentoGroup } from "../BentoGrid/BentoGrid";
import styles from "../BentoGrid/BentoGrid.module.css";
import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";

interface Props {
	group: BentoGroup;
	onTitleChange(id: string, title: string): void;
	onFinishEditing(id: string): void;
	onFocus(): void;
	onDragOver(id: string): void;
	onDragLeave(): void;
	dropTargetGroup: string | null;
}

/**
 * Карточка Bento-группы.
 *
 * Отвечает за:
 * - отображение заголовка группы;
 * - редактирование названия группы;
 * - отображение ярлыков группы.
 */

export default function BentoGroupCard({
	group,
	onTitleChange,
	onFinishEditing,
	onFocus,
	onDragOver,
	onDragLeave,
}: Props) {
	const { setNodeRef, isOver } = useDroppable({
		id: `group-${group.id}`,
	});
	return (
		<div
			ref={setNodeRef}
			tabIndex={0}
			className={styles.card}
			style={{
				background: isOver ? "#4a4c7d" : undefined,
			}}
			onFocus={onFocus}
			onMouseEnter={() => {
				onFocus();
				onDragOver(group.id);
			}}
			onDragEnter={() => {
				onDragOver(group.id);
			}}
			onDragLeave={onDragLeave}
		>
			<header className={styles.header}>
				{group.isEditing ? (
					<input
						autoFocus
						value={group.title}
						onChange={(event) => onTitleChange(group.id, event.target.value)}
						onBlur={() => onFinishEditing(group.id)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								onFinishEditing(group.id);
							}
						}}
					/>
				) : (
					<h2>{group.title}</h2>
				)}
			</header>

			<div className={styles.shortcuts}>
				<ShortcutGrid groupId={group.id} shortcuts={group.shortcuts} />
			</div>
		</div>
	);
}

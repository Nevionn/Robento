import { useDroppable } from "@dnd-kit/core";
import type { BentoGroup } from "../BentoGrid/BentoGrid";
import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";
import styles from "./BentoGroupCard.module.css";

interface Props {
	group: BentoGroup;
	onTitleChange(id: string, title: string): void;
	onSubmitGroup(id: string, title: string): void;
	onGroupFocus(): void;
	onDragOver(id: string): void;
	onDragLeave(): void;
	dropTargetGroup: string | null;

	/* transition props */
	onShortcutFocus(shortcutId: string | null): void;
	searchQuery: string;
}

/**
 * Карточка Bento-группы.
 *
 * Отвечает за:
 * - отображение заголовка группы;
 * - редактирование названия группы;
 * - отображение ярлыков группы.
 * - передачу фокуса выбранного ярлыка.
 */

export default function BentoGroupCard({
	group,
	searchQuery,
	onTitleChange,
	onSubmitGroup,
	onGroupFocus,
	onShortcutFocus,
	onDragOver,
	onDragLeave,
}: Props) {
	const { setNodeRef, isOver } = useDroppable({
		id: `group-${group.id}`,
	});

	function handleSubmit() {
		onSubmitGroup(group.id, group.title);
	}

	return (
		<div
			ref={setNodeRef}
			tabIndex={0}
			className={styles.card}
			style={{
				background: isOver ? "#4a4c7d" : undefined,
			}}
			onClick={onGroupFocus}
			onMouseEnter={() => {
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
						onBlur={handleSubmit}
						onKeyDown={(event) => {
							if (event.key !== "Enter") {
								return;
							}

							event.preventDefault();
							handleSubmit();
						}}
					/>
				) : (
					<h2>{group.title}</h2>
				)}
			</header>

			<div className={styles.shortcuts}>
				<ShortcutGrid
					groupId={group.id}
					shortcuts={group.shortcuts}
					searchQuery={searchQuery}
					onShortcutFocus={onShortcutFocus}
				/>
			</div>
		</div>
	);
}

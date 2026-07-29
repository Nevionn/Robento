import type { BentoGroup } from "../BentoGrid/BentoGrid";
import styles from "../BentoGrid/BentoGrid.module.css";
import ShortcutGrid from "../ShortcutGrid/ShortcutGrid";

interface Props {
	group: BentoGroup;
	onTitleChange(id: string, title: string): void;
	onFinishEditing(id: string): void;
	onFocus(): void;
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
}: Props) {
	return (
		<div className={styles.card} tabIndex={0} onFocus={onFocus}>
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

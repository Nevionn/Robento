import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import type { Shortcut } from "../BentoGrid/BentoGrid";
import SortableShortcut from "../SortableShortcut/SortableShortcut";

interface Props {
	groupId: string;
	shortcuts: Shortcut[];
	onDeleteShortcut: (id: string) => Promise<void>;
	onEditShortcut: (shortcut: Shortcut) => void;
}

/**
 * Сетка ярлыков.
 *
 * Отвечает за:
 * Отображение ярлыков группы.
 * Передачу обработчиков удаления и редактирования.
 */

export default function ShortcutGrid({
	groupId,
	shortcuts,
	onDeleteShortcut,
	onEditShortcut,
}: Props) {
	return (
		<SortableContext
			items={shortcuts.map((shortcut) => shortcut.id)}
			strategy={rectSortingStrategy}
		>
			{shortcuts.map((shortcut) => (
				<SortableShortcut
					key={shortcut.id}
					id={shortcut.id}
					groupId={groupId}
					name={shortcut.name}
					icon={shortcut.icon}
					target={shortcut.target}
					onDelete={onDeleteShortcut}
					onEdit={() => onEditShortcut(shortcut)}
				/>
			))}
		</SortableContext>
	);
}

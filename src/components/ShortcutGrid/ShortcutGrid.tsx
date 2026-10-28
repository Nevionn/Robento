import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import type { Shortcut } from "../BentoGrid/BentoGrid";
import SortableShortcut from "../SortableShortcut/SortableShortcut";

interface Props {
	groupId: string;
	shortcuts: Shortcut[];
	onDeleteShortcut: (id: string) => Promise<void>;
}

/**
 * Сетка ярлыков.
 * Отображение списка ярлыков группы.
 */

export default function ShortcutGrid({
	groupId,
	shortcuts,
	onDeleteShortcut,
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
				/>
			))}
		</SortableContext>
	);
}

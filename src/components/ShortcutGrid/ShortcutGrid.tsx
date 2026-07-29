import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import SortableShortcut from "../SortableShortcut/SortableShortcut";

export interface Shortcut {
	id: string;
	name: string;
	icon: string;
}

interface Props {
	groupId: string;
	shortcuts: Shortcut[];
}

/**
 * Сетка ярлыков внутри одной Bento-группы.
 *
 * Отвечает за:
 * - отображение ярлыков;
 * - сортировку ярлыков внутри группы;
 * - передачу нового порядка в BentoGrid.
 *
 * Перенос между группами обрабатывается
 * родительским DndContext.
 */

export default function ShortcutGrid({ groupId, shortcuts }: Props) {
	return (
		<SortableContext
			id={groupId}
			items={shortcuts.map((item) => item.id)}
			strategy={rectSortingStrategy}
		>
			{shortcuts.map((shortcut) => (
				<SortableShortcut
					key={shortcut.id}
					id={shortcut.id}
					name={shortcut.name}
					icon={shortcut.icon}
				/>
			))}
		</SortableContext>
	);
}

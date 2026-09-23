import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import type { Shortcut } from "../BentoGrid/BentoGrid";

import SortableShortcut from "../SortableShortcut/SortableShortcut";

interface Props {
	groupId: string;
	shortcuts: Shortcut[];
	searchQuery: string;
	onShortcutFocus(shortcutId: string | null): void;
}

/**
 * Сетка ярлыков внутри одной Bento-группы.
 *
 * Отвечает за:
 * - отображение ярлыков;
 * - сортировку ярлыков внутри группы;
 * - передачу фокуса выбранного ярлыка.
 *
 * Перенос между группами обрабатывается
 * родительским DndContext.
 */

export default function ShortcutGrid({
	shortcuts,
	searchQuery,
	onShortcutFocus,
}: Props) {
	return (
		<SortableContext
			items={shortcuts.map((item) => item.id)}
			strategy={rectSortingStrategy}
		>
			{shortcuts.map((shortcut) => (
				<SortableShortcut
					key={shortcut.id}
					id={shortcut.id}
					name={shortcut.name}
					icon={shortcut.icon}
					target={shortcut.target}
					searchQuery={searchQuery}
					onShortcutFocus={onShortcutFocus}
				/>
			))}
		</SortableContext>
	);
}

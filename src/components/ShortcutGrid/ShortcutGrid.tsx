import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	MouseSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";

import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";

import SortableShortcut from "../SortableShortcut/SortableShortcut";

export interface Shortcut {
	id: string;
	name: string;
	icon: string;
}

interface Props {
	shortcuts: Shortcut[];

	onChange(shortcuts: Shortcut[]): void;
}

/**
 * Сетка ярлыков внутри одной Bento-группы.
 *
 * Отвечает за:
 * - отображение списка ярлыков;
 * - сортировку элементов через dnd-kit;
 * - обработку изменения порядка после перетаскивания;
 * - передачу нового порядка в родительский компонент через onChange.
 *
 * Использует rectSortingStrategy для корректной сортировки
 * элементов в двумерной сетке.
 */

export default function ShortcutGrid({ shortcuts, onChange }: Props) {
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = shortcuts.findIndex((item) => item.id === active.id);

		const newIndex = shortcuts.findIndex((item) => item.id === over.id);

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		onChange(arrayMove(shortcuts, oldIndex, newIndex));
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
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
					/>
				))}
			</SortableContext>
		</DndContext>
	);
}

import type { Layout } from "react-grid-layout";
import type { BentoGroup } from "./BentoGrid";

/**
 * Вычисляет необходимую высоту карточки в grid-ячейках.
 *
 * Расчёт основан на двухколоночном расположении ярлыков:
 * каждые два элемента занимают один ряд.
 */

function calcH(count: number) {
	return Math.max(1, Math.ceil(count / 2));
}

/**
 * Генерирует начальную раскладку карточек Bento-сетки.
 *
 * Распределяет группы между двумя колонками,
 * стараясь сохранять одинаковую высоту колонок.
 *
 * Возвращает layout, совместимый с react-grid-layout.
 */

export function generateLayout(groups: BentoGroup[]): Layout {
	const colY = [0, 0];

	return groups.map((group) => {
		const h = calcH(group.shortcuts.length);

		const col = colY[0] <= colY[1] ? 0 : 1;
		const y = colY[col];

		colY[col] += h;

		return {
			i: group.id,
			x: col,
			y,
			w: 1,
			h,
		};
	});
}

/**
 * Перерасчет высоты после добавления нового ярлыка в группу.
 */

export function updateLayoutHeight(
	groups: BentoGroup[],
	layout: Layout,
): Layout {
	return layout.map((item) => {
		const group = groups.find((group) => group.id === item.i);

		if (!group) {
			return item;
		}

		return {
			...item,
			h: calcH(group.shortcuts.length),
		};
	});
}

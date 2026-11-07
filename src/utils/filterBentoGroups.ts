import type { BentoGroup } from "../components/BentoGrid/BentoGrid";

/**
 * Фильтрует группы и ярлыки по поисковому запросу.
 * Сохраняет группы с совпадающими названиями ярлыков.
 *
 * @param groups - Исходные группы.
 * @param query - Поисковый запрос.
 * @returns Отфильтрованный массив групп.
 */

export function filterBentoGroups(
	groups: BentoGroup[],
	query: string,
): BentoGroup[] {
	const normalizedQuery = query.trim().toLocaleLowerCase();

	return groups
		.map((group) => ({
			...group,
			shortcuts: group.shortcuts.filter((shortcut) =>
				shortcut.name.toLocaleLowerCase().includes(normalizedQuery),
			),
		}))
		.filter(
			(group) =>
				group.shortcuts.length > 0 ||
				group.title.toLocaleLowerCase().includes(normalizedQuery),
		);
}

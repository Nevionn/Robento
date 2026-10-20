import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

import type { BentoGroup } from "../components/BentoGrid/BentoGrid";

interface UseBentoGroupsParams {
	setGroups: React.Dispatch<React.SetStateAction<BentoGroup[]>>;
}

interface GroupDto {
	id: string;
	title: string;
	sort_order: number;
	created_at: string;
}

/**
 * Операции с группами.
 *
 * Отвечает за:
 * loadGroups: Загружает группы из БД.
 * updateGroupsOrder: Сохраняет порядок групп в БД.
 * deleteGroup: Удаляет группу из БД и локального состояния.
 * checkHasGroups: Проверяет, существуют ли группы в БД.
 */

// TODO: Добавить методы для создания и редактирования группы, и удаление всех групп

export function useBentoGroups({ setGroups }: UseBentoGroupsParams) {
	const loadGroups = useCallback(async () => {
		const savedGroups = await invoke<GroupDto[]>("get_groups");

		const loadedGroups: BentoGroup[] = savedGroups.map((group) => ({
			id: group.id,
			title: group.title,
			shortcuts: [],
		}));

		setGroups(loadedGroups);
	}, [setGroups]);

	const updateGroupsOrder = useCallback(async (groupIds: string[]) => {
		await invoke("update_groups_order", { groupIds });
	}, []);

	const deleteGroup = useCallback(
		async (id: string) => {
			await invoke("delete_group", { id });

			setGroups((prev) => prev.filter((group) => group.id !== id));
		},
		[setGroups],
	);

	const checkHasGroups = useCallback(async () => {
		return await invoke<boolean>("has_groups");
	}, []);

	return {
		loadGroups,
		updateGroupsOrder,
		deleteGroup,
		checkHasGroups,
	};
}

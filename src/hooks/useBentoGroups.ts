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
 * createGroup: Создает новую группу.
 * updateGroupsOrder: Сохраняет порядок групп в БД.
 * deleteGroup: Удаляет группу из БД и локального состояния.
 * deleteAllGroups: Удаляет все группы и ярлыки из БД.
 * checkHasGroups: Проверяет, существуют ли группы в БД.
 */

// TODO: Добавить метод для редактирования группы

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

	const createGroup = useCallback(
		async (title: string) => {
			const createdGroup = await invoke<GroupDto>("create_group", {
				title,
			});

			setGroups((prev) => [
				...prev,
				{
					id: createdGroup.id,
					title: createdGroup.title,
					shortcuts: [],
				},
			]);

			return createdGroup;
		},
		[setGroups],
	);

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

	const deleteAllGroups = useCallback(async () => {
		await invoke("delete_all_groups");

		setGroups([]);
	}, [setGroups]);

	const checkHasGroups = useCallback(async () => {
		return await invoke<boolean>("has_groups");
	}, []);

	return {
		loadGroups,
		createGroup,
		updateGroupsOrder,
		deleteGroup,
		deleteAllGroups,
		checkHasGroups,
	};
}

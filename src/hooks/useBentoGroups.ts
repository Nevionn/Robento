import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";

import type { Layout } from "react-grid-layout";
import type { BentoGroup } from "../components/BentoGrid/BentoGrid";

import { generateLayout } from "../components/BentoGrid/layout";

interface UseBentoGroupsParams {
	setGroups: React.Dispatch<React.SetStateAction<BentoGroup[]>>;
	setLayout: React.Dispatch<React.SetStateAction<Layout>>;
}

/**
 * Операции с группами.
 *
 * Отвечает только за:
 * - создание draft-группы;
 * - сохранение новой группы в БД;
 * - загрузку групп из БД;
 * - изменение названия существующей группы;
 * - сохранение порядка групп в БД;
 * - удаление группы;
 * - маршрутизацию submit между create и update.
 *
 * Локальное редактирование title и управление isEditing
 * остаются ответственностью BentoGrid/BentoGroupCard.
 */

export function useBentoGroups({ setGroups, setLayout }: UseBentoGroupsParams) {
	/**
	 * Создаёт локальную draft-группу.
	 *
	 * Draft имеет id вида `draft-*`.
	 * В БД такая группа ещё не существует.
	 */

	const addGroupDraft = useCallback(() => {
		const group: BentoGroup = {
			id: `draft-${crypto.randomUUID()}`,
			title: "",
			shortcuts: [],
			isEditing: true,
		};

		setGroups((prev) => {
			const next = [...prev, group];

			setLayout(generateLayout(next));

			return next;
		});
	}, [setGroups, setLayout]);

	/**
	 * Создаёт новую группу в БД.
	 *
	 * Локальный draft id заменяется реальным id,
	 * который возвращает backend.
	 */

	const persistGroup = useCallback(
		async (id: string, title: string) => {
			try {
				const group = await invoke<{
					id: string;
					title: string;
					sort_order: number;
					created_at: string;
				}>("create_group", {
					title,
				});

				setGroups((prev) => {
					const next = prev.map((item) =>
						item.id === id
							? {
									...item,
									id: group.id,
									title: group.title,
									isEditing: false,
								}
							: item,
					);

					setLayout(generateLayout(next));

					return next;
				});
			} catch (error) {
				console.error("Не удалось создать группу:", error);
			}
		},
		[setGroups, setLayout],
	);

	/**
	 * Загружает существующие группы из БД.
	 *
	 * Все загруженные группы получают реальный backend id
	 * и не являются draft-группами.
	 */

	const loadGroups = useCallback(async () => {
		try {
			const savedGroups =
				await invoke<
					{
						id: string;
						title: string;
						sort_order: number;
						created_at: string;
					}[]
				>("get_groups");

			const loadedGroups: BentoGroup[] = savedGroups.map((group) => ({
				id: group.id,
				title: group.title,
				shortcuts: [],
				isEditing: false,
			}));

			setGroups(loadedGroups);
			setLayout(generateLayout(loadedGroups));
		} catch (error) {
			console.error("Не удалось загрузить группы:", error);
		}
	}, [setGroups, setLayout]);

	/**
	 * Обновляет название уже существующей группы в БД.
	 */

	const updateGroupTitle = useCallback(
		async (id: string, title: string) => {
			try {
				const group = await invoke<{
					id: string;
					title: string;
					sort_order: number;
					created_at: string;
				}>("update_group_title", {
					id,
					title,
				});

				setGroups((prev) =>
					prev.map((item) =>
						item.id === id
							? {
									...item,
									title: group.title,
									isEditing: false,
								}
							: item,
					),
				);
			} catch (error) {
				console.error("Не удалось изменить название группы:", error);
			}
		},
		[setGroups],
	);

	/**
	 * Сохраняет текущий порядок групп в БД (reDnd).
	 *
	 * Получает массив id групп в порядке их расположения
	 * на сетке и передаёт его backend для обновления sort_order.
	 *
	 * Порядок массива соответствует порядку групп:
	 * индекс группы в массиве используется как её новая позиция.
	 */

	const updateGroupsOrder = useCallback(async (groupIds: string[]) => {
		try {
			await invoke("update_groups_order", {
				groupIds,
			});
		} catch (error) {
			console.error("Не удалось сохранить порядок групп:", error);
		}
	}, []);

	/**
	 * Единая точка сохранения заголовка.
	 *
	 * Draft -> create_group
	 * Existing -> update_group_title
	 */

	const submitGroupTitle = useCallback(
		async (id: string, title: string) => {
			if (id.startsWith("draft-")) {
				await persistGroup(id, title);
				return;
			}

			await updateGroupTitle(id, title);
		},
		[persistGroup, updateGroupTitle],
	);

	/**
	 * Удаляет существующую группу из БД.
	 *
	 * Draft-группы в БД не существуют, поэтому для них
	 * достаточно удалить локальную группу без backend-вызова.
	 *
	 * После удаления пересчитывается layout.
	 */

	const deleteGroup = useCallback(
		async (id: string) => {
			try {
				if (!id.startsWith("draft-")) {
					await invoke("delete_group", { id });
				}

				setGroups((prev) => {
					const next = prev.filter((group) => group.id !== id);

					setLayout(generateLayout(next));

					return next;
				});
			} catch (error) {
				console.error("Не удалось удалить группу:", error);
			}
		},
		[setGroups, setLayout],
	);

	useEffect(() => {
		void loadGroups();
	}, [loadGroups]);

	return {
		addGroupDraft,
		persistGroup,
		loadGroups,
		updateGroupTitle,
		submitGroupTitle,
		updateGroupsOrder,
		deleteGroup,
	};
}

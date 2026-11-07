import type { OpenDialogOptions } from "@tauri-apps/plugin-dialog";

/** Фильтры для выбора файлов иконок. */

export const iconFileFilters: NonNullable<OpenDialogOptions["filters"]> = [
	{
		name: "Файлы иконок",
		extensions: ["ico", "png", "jpg", "jpeg", "svg", "webp", "icns"],
	},
	{ name: "Все файлы", extensions: ["*"] },
];

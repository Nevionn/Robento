/**
 * Данные исполняемого файла, полученные при его выборе
 * через команду `pick_executable`.
 *
 * Используются для автоматического заполнения полей ярлыка:
 * названия, пути, источника и основной иконки.
 */

export interface PickedExe {
	name: string;
	target: string;
	source: string;
	icon: string | null;
}

/**
 * Данные ярлыка, собранные в форме создания или редактирования
 * перед передачей в функцию сохранения.
 *
 * Содержат значения полей формы, включая основную и резервную иконки.
 */

export interface DataFromExe {
	target: string;
	source: string;
	reserve_path2icon: string | null;
	name: string;
	icon: string | null;
}

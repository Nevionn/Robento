import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";
import { type SubmitEvent, useState } from "react";

import styles from "./CreateShortcutModal.module.css";

interface PickedExe {
	name: string;
	target: string;
	source: string;
	icon: string | null;
}

export interface DataFromExe {
	target: string;
	source: string;
	reserve_path2icon: string | null;
	name: string;
	icon: string | null;
}

interface CreateShortcutModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: DataFromExe) => Promise<void>;
}

/**
 * Модальное окно создания ярлыка.
 *
 * Отвечает за:
 * handlePickTarget: Выбирает исполняемый файл и заполняет данные ярлыка.
 * handlePickIcon: Выбирает необязательную резервную иконку.
 * handleSubmit: Проверяет данные формы и передаёт их на сохранение.
 */

export function CreateShortcutModal({
	isOpen,
	onClose,
	onSave,
}: CreateShortcutModalProps) {
	const [target, setTarget] = useState("");
	const [source, setSource] = useState("");
	const [name, setName] = useState("");
	const [icon, setIcon] = useState<string | null>(null);
	const [reserve_path2icon, setReservePath2icon] = useState("");

	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isPickingFile, setIsPickingFile] = useState(false);

	if (!isOpen) return null;

	const isBusy = isSubmitting || isPickingFile;

	const resetForm = () => {
		setTarget("");
		setSource("");
		setReservePath2icon("");
		setName("");
		setIcon(null);
		setError("");
	};

	const handlePickTarget = async () => {
		setIsPickingFile(true);
		setError("");

		try {
			const shortcut = await invoke<PickedExe | null>("pick_executable");

			if (!shortcut) return;

			setTarget(shortcut.target);
			setSource(shortcut.source);
			setName(shortcut.name);
			setIcon(shortcut.icon);
		} catch (error) {
			console.error("Не удалось выбрать исполняемый файл:", error);
			setError(String(error));
		} finally {
			setIsPickingFile(false);
		}
	};

	const handlePickIcon = async () => {
		setIsPickingFile(true);
		setError("");

		try {
			const selected = await open({
				title: "Выберите файл иконки",
				multiple: false,
				directory: false,
				filters: [
					{
						name: "Файлы иконок",
						extensions: ["ico", "png", "jpg", "jpeg", "svg", "webp", "icns"],
					},
					{ name: "Все файлы", extensions: ["*"] },
				],
			});

			if (typeof selected === "string") {
				setReservePath2icon(selected);
			}
		} catch (error) {
			console.error("Не удалось выбрать иконку:", error);
			setError(String(error));
		} finally {
			setIsPickingFile(false);
		}
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedTarget = target.trim();

		if (!trimmedTarget) {
			setError("Укажите путь к исполняемому файлу");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await onSave({
				target: trimmedTarget,
				source: source.trim() || trimmedTarget,
				reserve_path2icon: reserve_path2icon.trim() || null,
				name: name.trim(),
				icon,
			});

			resetForm();
			onClose();
		} catch (error) {
			console.error("Не удалось создать ярлык:", error);
			setError("Не удалось создать ярлык");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (isBusy) return;

		resetForm();
		onClose();
	};

	return (
		<div className={styles.overlay}>
			<div
				className={styles.modal}
				role="dialog"
				aria-modal="true"
				aria-labelledby="shortcut-modal-title"
			>
				<h2 id="shortcut-modal-title" className={styles.title}>
					Создание ярлыка
				</h2>

				<form onSubmit={handleSubmit}>
					<label className={styles.label} htmlFor="shortcut-target">
						Путь к исполняемому файлу
					</label>

					<div className={styles.inputRow}>
						<input
							id="shortcut-target"
							className={styles.input}
							type="text"
							value={target}
							onChange={(event) => {
								setTarget(event.target.value);
								setSource(event.target.value);
								setError("");
							}}
							placeholder="Путь"
							autoFocus
							disabled={isBusy}
						/>

						<button
							className={styles.browseButton}
							type="button"
							title="Выбрать исполняемый файл"
							aria-label="Выбрать исполняемый файл"
							onClick={() => void handlePickTarget()}
							disabled={isBusy}
						>
							<FolderOpen size={18} />
						</button>
					</div>

					<label className={styles.label} htmlFor="shortcut-name">
						Название ярлыка
					</label>

					<input
						id="shortcut-name"
						className={styles.input}
						type="text"
						value={name}
						onChange={(event) => {
							setName(event.target.value);
							setError("");
						}}
						placeholder="Название"
						disabled={isBusy}
					/>

					<label className={styles.label} htmlFor="shortcut-reserve-icon">
						Резервная иконка (необязательно)
					</label>

					<div className={styles.inputRow}>
						<input
							id="shortcut-reserve-icon"
							className={styles.input}
							type="text"
							value={reserve_path2icon}
							onChange={(event) => {
								setReservePath2icon(event.target.value);
								setError("");
							}}
							placeholder="Путь к файлу иконки"
							disabled={isBusy}
						/>

						<button
							className={styles.browseButton}
							type="button"
							title="Выбрать файл резервной иконки"
							aria-label="Выбрать файл резервной иконки"
							onClick={() => void handlePickIcon()}
							disabled={isBusy}
						>
							<FolderOpen size={18} />
						</button>
					</div>

					{error && (
						<p className={styles.error} role="alert">
							{error}
						</p>
					)}

					<div className={styles.actions}>
						<button
							className={`${styles.button} ${styles.createButton}`}
							type="submit"
							disabled={isBusy}
						>
							{isSubmitting
								? "Сохранение..."
								: isPickingFile
									? "Выбор файла..."
									: "Создать"}
						</button>

						<button
							className={`${styles.button} ${styles.cancelButton}`}
							type="button"
							onClick={handleClose}
							disabled={isBusy}
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

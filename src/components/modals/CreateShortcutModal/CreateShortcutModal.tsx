import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { iconFileFilters } from "../../../shared/dialogPlugin/fileDialogFilters";
import type { DataFromExe, PickedExe } from "../../../shared/types/exe";

import styles from "./CreateShortcutModal.module.css";

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
	const { t } = useTranslation();

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
				title: t("CreateShortcutModal.iconDialogTitle"),
				multiple: false,
				directory: false,
				filters: iconFileFilters,
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
			setError(t("CreateShortcutModal.emptyTarget"));
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
			setError(t("CreateShortcutModal.createError"));
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
					{t("CreateShortcutModal.title")}
				</h2>

				<form onSubmit={handleSubmit}>
					<label className={styles.label} htmlFor="shortcut-target">
						{t("CreateShortcutModal.targetLabel")}
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
							placeholder={t("CreateShortcutModal.targetPlaceholder")}
							autoFocus
							disabled={isBusy}
						/>

						<button
							className={styles.browseButton}
							type="button"
							title={t("CreateShortcutModal.pickExecutable")}
							aria-label={t("CreateShortcutModal.pickExecutable")}
							onClick={() => void handlePickTarget()}
							disabled={isBusy}
						>
							<FolderOpen size={18} />
						</button>
					</div>

					<label className={styles.label} htmlFor="shortcut-name">
						{t("CreateShortcutModal.nameLabel")}
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
						placeholder={t("CreateShortcutModal.namePlaceholder")}
						disabled={isBusy}
					/>

					<label className={styles.label} htmlFor="shortcut-reserve-icon">
						{t("CreateShortcutModal.reserveIconLabel")}
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
							placeholder={t("CreateShortcutModal.reserveIconPlaceholder")}
							disabled={isBusy}
						/>

						<button
							className={styles.browseButton}
							type="button"
							title={t("CreateShortcutModal.pickReserveIcon")}
							aria-label={t("CreateShortcutModal.pickReserveIcon")}
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
							disabled={isBusy || !target.trim()}
						>
							{isSubmitting
								? t("actionButton.saving")
								: isPickingFile
									? t("actionButton.pickingFile")
									: t("actionButton.create")}
						</button>

						<button
							className={`${styles.button} ${styles.cancelButton}`}
							type="button"
							onClick={handleClose}
							disabled={isBusy}
						>
							{t("actionButton.cancel")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

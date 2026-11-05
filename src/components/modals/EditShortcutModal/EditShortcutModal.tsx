import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { iconFileFilters } from "../../../shared/dialogPlugin/fileDialogFilters";
import type { DataFromExe, PickedExe } from "../../../shared/types/exe";
import type { Shortcut } from "../../BentoGrid/BentoGrid";
import styles from "../CreateShortcutModal/CreateShortcutModal.module.css";

interface EditShortcutModalProps {
	isOpen: boolean;
	shortcut: Shortcut | null;
	onClose: () => void;
	onSave: (id: string, data: DataFromExe) => Promise<void>;
}

/**
 * Модальное окно редактирования ярлыка.
 *
 * Отвечает за:
 * handlePickTarget: Выбирает исполняемый файл и обновляет данные ярлыка.
 * handlePickIcon: Выбирает резервную иконку.
 * handleSubmit: Проверяет форму и сохраняет изменения ярлыка.
 */

export function EditShortcutModal({
	isOpen,
	shortcut,
	onClose,
	onSave,
}: EditShortcutModalProps) {
	const { t } = useTranslation();

	const [target, setTarget] = useState("");
	const [source, setSource] = useState("");
	const [name, setName] = useState("");
	const [icon, setIcon] = useState<string | null>(null);
	const [reserve_path2icon, setReservePath2icon] = useState("");

	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isPickingFile, setIsPickingFile] = useState(false);

	useEffect(() => {
		if (!isOpen || !shortcut) return;

		setTarget(shortcut.target);
		setSource(shortcut.source);
		setName(shortcut.name);
		setIcon(shortcut.icon);
		setReservePath2icon(shortcut.reserve_path2icon ?? "");
		setError("");
	}, [isOpen, shortcut]);

	if (!isOpen || !shortcut) return null;

	const isBusy = isSubmitting || isPickingFile;

	const hasChanges =
		target !== shortcut.target ||
		name !== shortcut.name ||
		source !== shortcut.source ||
		icon !== shortcut.icon ||
		reserve_path2icon !== (shortcut.reserve_path2icon ?? "");

	const handlePickTarget = async () => {
		setIsPickingFile(true);
		setError("");

		try {
			const picked = await invoke<PickedExe | null>("pick_executable");

			if (!picked) return;

			setTarget(picked.target);
			setSource(picked.source);
			setName(picked.name);
			setIcon(picked.icon);
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
				title: t("EditShortcutModal.iconDialogTitle"),
				multiple: false,
				directory: false,
				filters: iconFileFilters,
			});

			if (typeof selected === "string") {
				setReservePath2icon(selected);
			}
		} catch (error) {
			console.error("Не удалось выбрать резервную иконку:", error);
			setError(String(error));
		} finally {
			setIsPickingFile(false);
		}
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedTarget = target.trim();
		const trimmedName = name.trim();

		if (!trimmedTarget) {
			setError(t("EditShortcutModal.emptyTarget"));
			return;
		}

		if (!trimmedName) {
			setError(t("EditShortcutModal.emptyName"));
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await onSave(shortcut.id, {
				name: trimmedName,
				target: trimmedTarget,
				source: source.trim() || trimmedTarget,
				icon,
				reserve_path2icon: reserve_path2icon.trim() || null,
			});

			onClose();
		} catch (error) {
			console.error("Не удалось изменить ярлык:", error);
			setError(t("EditShortcutModal.saveError"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (isBusy) return;
		setError("");
		onClose();
	};

	return (
		<div className={styles.overlay}>
			<div
				className={styles.modal}
				role="dialog"
				aria-modal="true"
				aria-labelledby="edit-shortcut-modal-title"
			>
				<h2 id="edit-shortcut-modal-title" className={styles.title}>
					{t("EditShortcutModal.title")}
				</h2>

				<form onSubmit={handleSubmit}>
					<label className={styles.label} htmlFor="edit-shortcut-target">
						{t("EditShortcutModal.targetLabel")}
					</label>

					<div className={styles.inputRow}>
						<input
							id="edit-shortcut-target"
							className={styles.input}
							type="text"
							value={target}
							onChange={(event) => {
								setTarget(event.target.value);
								setSource(event.target.value);
								setError("");
							}}
							placeholder={t("EditShortcutModal.targetPlaceholder")}
							autoFocus
							disabled={isBusy}
						/>

						<button
							className={styles.browseButton}
							type="button"
							title={t("EditShortcutModal.pickExecutable")}
							aria-label={t("EditShortcutModal.pickExecutable")}
							onClick={() => void handlePickTarget()}
							disabled={isBusy}
						>
							<FolderOpen size={18} />
						</button>
					</div>

					<label className={styles.label} htmlFor="edit-shortcut-name">
						{t("EditShortcutModal.nameLabel")}
					</label>

					<input
						id="edit-shortcut-name"
						className={styles.input}
						type="text"
						value={name}
						onChange={(event) => {
							setName(event.target.value);
							setError("");
						}}
						placeholder={t("EditShortcutModal.namePlaceholder")}
						disabled={isBusy}
					/>

					<label className={styles.label} htmlFor="edit-shortcut-reserve-icon">
						{t("EditShortcutModal.reserveIconLabel")}
					</label>

					<div className={styles.inputRow}>
						<input
							id="edit-shortcut-reserve-icon"
							className={styles.input}
							type="text"
							value={reserve_path2icon}
							onChange={(event) => {
								setReservePath2icon(event.target.value);
								setError("");
							}}
							placeholder={t("EditShortcutModal.reserveIconPlaceholder")}
							disabled={isBusy}
						/>

						<button
							className={styles.browseButton}
							type="button"
							title={t("EditShortcutModal.pickReserveIcon")}
							aria-label={t("EditShortcutModal.pickReserveIcon")}
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
							disabled={isBusy || !hasChanges}
						>
							{isSubmitting
								? t("actionButton.saving")
								: isPickingFile
									? t("actionButton.pickingFile")
									: t("actionButton.save")}
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

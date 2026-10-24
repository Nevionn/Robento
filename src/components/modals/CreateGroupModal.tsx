// biome-ignore-all lint/correctness/useExhaustiveDependencies: намеренное управление зависимостями useEffect
import { type SubmitEvent, useEffect, useState } from "react";

import type { BentoGroup } from "../BentoGrid/BentoGrid";
import styles from "./CreateGroupModal.module.css";

type ModalMode = "create" | "edit";

interface CreateGroupModalProps {
	isOpen: boolean;
	mode: ModalMode;
	groupToEdit: BentoGroup | null;
	onClose: () => void;
	createGroup: (title: string) => Promise<void>;
	updateGroupTitle: (id: string, title: string) => Promise<void>;
}

/**
 * Модальное окно для создания группы или редактирования её названия.
 *
 * Инициализирует поле ввода при открытии, проверяет название,
 * выполняет соответствующую операцию и отображает ошибки.
 * Блокирует закрытие окна во время сохранения.
 */

export function CreateGroupModal({
	isOpen,
	mode,
	groupToEdit,
	onClose,
	createGroup,
	updateGroupTitle,
}: CreateGroupModalProps) {
	const [title, setTitle] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

		setTitle(mode === "edit" ? (groupToEdit?.title ?? "") : "");
		setError("");
	}, [isOpen, mode, groupToEdit?.id]);

	if (!isOpen) return null;

	const isEditMode = mode === "edit";

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedTitle = title.trim();

		if (!trimmedTitle) {
			setError("Введите название группы");
			return;
		}

		if (isEditMode && !groupToEdit) {
			setError("Группа не найдена");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			if (isEditMode && groupToEdit) {
				await updateGroupTitle(groupToEdit.id, trimmedTitle);
			} else {
				await createGroup(trimmedTitle);
			}

			setTitle("");
			onClose();
		} catch (error) {
			console.error("Failed to save group:", error);
			setError(
				isEditMode
					? "Не удалось изменить название группы"
					: "Не удалось создать группу",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (isSubmitting) return;

		setTitle("");
		setError("");
		onClose();
	};

	return (
		<div className={styles.overlay}>
			<div
				className={styles.modal}
				role="dialog"
				aria-modal="true"
				aria-labelledby="create-group-title"
			>
				<h2 id="create-group-title" className={styles.title}>
					{isEditMode ? "Редактирование группы" : "Создание группы"}
				</h2>

				<form onSubmit={handleSubmit}>
					<label className={styles.label} htmlFor="group-title">
						Название группы
					</label>

					<input
						id="group-title"
						className={styles.input}
						type="text"
						value={title}
						onChange={(event) => {
							setTitle(event.target.value);
							setError("");
						}}
						placeholder="Введите название"
						maxLength={100}
						autoFocus
						disabled={isSubmitting}
					/>

					{error && (
						<p className={styles.error} role="alert">
							{error}
						</p>
					)}

					<div className={styles.actions}>
						<button
							className={`${styles.button} ${styles.createButton}`}
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting
								? "Сохранение..."
								: isEditMode
									? "Сохранить"
									: "Создать"}
						</button>

						<button
							className={`${styles.button} ${styles.cancelButton}`}
							type="button"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

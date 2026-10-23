import { type SubmitEvent, useState } from "react";

import styles from "./CreateGroupModal.module.css";

interface CreateGroupModalProps {
	isOpen: boolean;
	onClose: () => void;
	createGroup: (title: string) => Promise<unknown>;
}

export function CreateGroupModal({
	isOpen,
	onClose,
	createGroup,
}: CreateGroupModalProps) {
	const [title, setTitle] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedTitle = title.trim();

		if (!trimmedTitle) {
			setError("Введите название группы");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await createGroup(trimmedTitle);
			setTitle("");
			onClose();
		} catch (error) {
			console.error("Failed to create group:", error);
			setError("Не удалось создать группу");
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
					Создание группы
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
							{isSubmitting ? "Создание..." : "Создать"}
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

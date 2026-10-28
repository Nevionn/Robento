import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./ShortcutContextMenu.module.css";

interface Props {
	x: number;
	y: number;
	onClose: () => void;
	onLaunch: () => Promise<void>;
	onDelete: () => Promise<void>;
}

/**
 * Контекстное меню ярлыка.
 *
 * Отображает действия запуска, редактирования и удаления.
 * Закрывается при клике вне меню или нажатии Escape.
 */

export default function ShortcutContextMenu({
	x,
	y,
	onClose,
	onLaunch,
	onDelete,
}: Props) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handlePointerDown(event: PointerEvent) {
			if (
				event.target instanceof Node &&
				!menuRef.current?.contains(event.target)
			) {
				onClose();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	return createPortal(
		<div
			ref={menuRef}
			className={styles.menu}
			role="menu"
			style={{ left: x, top: y }}
			onContextMenu={(event) => event.preventDefault()}
			onClick={(event) => event.stopPropagation()}
		>
			<button
				className={styles.menuItem}
				type="button"
				role="menuitem"
				onClick={() => void onLaunch()}
			>
				Запустить
			</button>

			<button
				className={styles.menuItem}
				type="button"
				role="menuitem"
				onClick={onClose}
			>
				Редактировать
			</button>

			<button
				className={`${styles.menuItem} ${styles.delete}`}
				type="button"
				role="menuitem"
				onClick={() => void onDelete()}
			>
				Удалить
			</button>
		</div>,
		document.body,
	);
}

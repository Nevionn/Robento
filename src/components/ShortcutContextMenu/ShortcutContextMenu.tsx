import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import styles from "./ShortcutContextMenu.module.css";

interface Props {
	x: number;
	y: number;
	onClose: () => void;
	onLaunch: () => Promise<void>;
	onDelete: () => Promise<void>;
	onEdit: () => void;
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
	onEdit,
}: Props) {
	const { t } = useTranslation();
	const menuRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x, y });

	useLayoutEffect(() => {
		const menu = menuRef.current;
		if (!menu) return;

		const rect = menu.getBoundingClientRect();
		const margin = 8;

		const viewportWidth = document.documentElement.clientWidth;
		const viewportHeight = document.documentElement.clientHeight;

		let left = x;
		let top = y;

		// Если меню выходит за правую границу — открываем влево
		if (left + rect.width > viewportWidth - margin) {
			left = x - rect.width;
		}

		// Если меню выходит за нижнюю границу — открываем вверх
		if (top + rect.height > viewportHeight - margin) {
			top = y - rect.height;
		}

		// Не позволяем меню выходить за остальные границы
		left = Math.max(
			margin,
			Math.min(left, viewportWidth - rect.width - margin),
		);

		top = Math.max(
			margin,
			Math.min(top, viewportHeight - rect.height - margin),
		);

		setPosition({ x: left, y: top });
	}, [x, y]);

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
			style={{ left: position.x, top: position.y }}
			onContextMenu={(event) => event.preventDefault()}
			onClick={(event) => event.stopPropagation()}
		>
			<button
				className={styles.menuItem}
				type="button"
				role="menuitem"
				onClick={() => void onLaunch()}
			>
				{t("ShortcutContextMenu.launch")}
			</button>

			<button
				className={styles.menuItem}
				type="button"
				role="menuitem"
				onClick={() => {
					onEdit();
					onClose();
				}}
			>
				{t("ShortcutContextMenu.edit")}
			</button>

			<button
				className={`${styles.menuItem} ${styles.delete}`}
				type="button"
				role="menuitem"
				onClick={() => void onDelete()}
			>
				{t("ShortcutContextMenu.delete")}
			</button>
		</div>,
		document.body,
	);
}

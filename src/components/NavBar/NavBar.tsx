import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

import { useBentoGroups } from "../../hooks/useBentoGroups";
import type { ViewName } from "../../types/View";
import WindowFocusIndicator from "../WindowFocusIndicator/WindowFocusIndicator";

import styles from "./NavBar.module.css";

type NavBarProps = {
	activeView: ViewName;
	setActiveView: (view: ViewName) => void;
};

/**
 * Панель навигации между основными представлениями приложения.
 *
 * Состояние синхронизируется с событиями создания и удаления групп.
 * Сетка, настройки, горячие клавиши и индикатор фокуса окна.
 */

export default function NavBar({ activeView, setActiveView }: NavBarProps) {
	const [hasGroups, setHasGroups] = useState(false);

	const { checkHasGroups } = useBentoGroups({
		setGroups: () => {},
	});

	useEffect(() => {
		let unlistenCreated: (() => void) | undefined;
		let unlistenDeleted: (() => void) | undefined;
		let cancelled = false;

		async function init() {
			const updateHasGroups = async () => {
				const result = await checkHasGroups();

				if (!cancelled) {
					setHasGroups(result);
				}
			};

			try {
				await updateHasGroups();

				if (cancelled) return;

				unlistenCreated = await listen("group-created", updateHasGroups);

				unlistenDeleted = await listen("group-deleted", updateHasGroups);

				if (cancelled) {
					unlistenCreated();
					unlistenDeleted();
				}
			} catch (error) {
				console.error("Не удалось инициализировать навигацию:", error);
			}
		}

		void init();

		return () => {
			cancelled = true;
			unlistenCreated?.();
			unlistenDeleted?.();
		};
	}, [checkHasGroups]);

	return (
		<div className={styles.navWrapper}>
			<nav className={styles.nav}>
				<button
					className={`${styles.button} ${
						activeView === "grid" ? styles.active : ""
					}`}
					onClick={() => setActiveView("grid")}
				>
					Сетка
				</button>

				<button
					className={`${styles.button} ${
						activeView === "settings" ? styles.active : ""
					}`}
					onClick={() => setActiveView("settings")}
				>
					Настройки
				</button>

				{hasGroups && (
					<button
						className={`${styles.button} ${
							activeView === "hotkeys" ? styles.active : ""
						}`}
						onClick={() => setActiveView("hotkeys")}
					>
						Клавиши
					</button>
				)}
			</nav>

			<div className={styles.focusIndicator}>
				<WindowFocusIndicator />
			</div>
		</div>
	);
}

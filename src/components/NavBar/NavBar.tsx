import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

import { useBentoGroups } from "../../hooks/useBentoGroups";
import type { ViewName } from "../../types/View";

import styles from "./NavBar.module.css";

type NavBarProps = {
	activeView: ViewName;
	setActiveView: (view: ViewName) => void;
};

/**
 * Панель навигации между основными представлениями приложения.
 * Сетка, настройки, горячие клавиши.
 *
 * Состояние синхронизируется с событиями создания и удаления групп.
 */

export default function NavBar({ activeView, setActiveView }: NavBarProps) {
	const [hasGroups, setHasGroups] = useState(false);

	const { checkHasGroups } = useBentoGroups({
		setGroups: () => {},
		setLayout: () => {},
	});

	useEffect(() => {
		let unlistenCreated: (() => void) | undefined;
		let unlistenDeleted: (() => void) | undefined;

		async function init() {
			const updateHasGroups = async () => {
				const result = await checkHasGroups();

				setHasGroups(result);
			};

			await updateHasGroups();

			unlistenCreated = await listen("group-created", updateHasGroups);
			unlistenDeleted = await listen("group-deleted", updateHasGroups);
		}

		void init();

		return () => {
			unlistenCreated?.();
			unlistenDeleted?.();
		};
	}, [checkHasGroups]);

	return (
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
					Горячие клавиши
				</button>
			)}
		</nav>
	);
}

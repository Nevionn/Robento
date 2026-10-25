import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

import styles from "./WindowFocusIndicator.module.css";

/**
 * Индикатор системного фокуса текущего окна Tauri.
 */

export default function WindowFocusIndicator() {
	const [isFocused, setIsFocused] = useState(false);

	useEffect(() => {
		let unlisten: (() => void) | undefined;
		let cancelled = false;

		async function subscribeToFocus() {
			const appWindow = getCurrentWindow();

			try {
				const stopListening = await appWindow.onFocusChanged(({ payload }) => {
					setIsFocused(payload);
				});

				if (cancelled) {
					stopListening();
					return;
				}

				unlisten = stopListening;

				const focused = await appWindow.isFocused();

				if (!cancelled) {
					setIsFocused(focused);
				}
			} catch (error) {
				console.error("Не удалось отследить фокус окна:", error);
			}
		}

		void subscribeToFocus();

		return () => {
			cancelled = true;
			unlisten?.();
		};
	}, []);

	return (
		<span
			className={styles.indicator}
			role="status"
			aria-label={isFocused ? "Окно активно" : "Окно не в фокусе"}
			title={isFocused ? "Окно активно" : "Окно не в фокусе"}
		>
			<span
				className={`${styles.dot} ${
					isFocused ? styles.focused : styles.unfocused
				}`}
			/>
		</span>
	);
}

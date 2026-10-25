import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useEffect, useRef, useState } from "react";

import { useSettings } from "../context/SettingsProvider";
import styles from "./Settings.module.css";

/**
 * Отображает настройки приложения и обрабатывает их изменение.
 *
 * Получает настройки и функцию обновления из SettingsProvider.
 */

export default function Settings() {
	const { settings, updateGeneral } = useSettings();

	const [databasePath, setDatabasePath] = useState<string>("");
	const [copied, setCopied] = useState(false);

	const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let cancelled = false;

		invoke<string>("get_database_path")
			.then((path) => {
				if (!cancelled) setDatabasePath(path);
			})
			.catch((error: unknown) => {
				console.error("Не удалось получить путь к БД:", error);
			});

		return () => {
			cancelled = true;

			if (copiedTimer.current !== null) {
				clearTimeout(copiedTimer.current);
			}
		};
	}, []);

	async function handleCopyPath() {
		if (!databasePath) return;

		try {
			const directoryPath = databasePath.replace(/[\\/][^\\/]+$/, "");

			await writeText(directoryPath);

			if (copiedTimer.current !== null) {
				clearTimeout(copiedTimer.current);
			}

			setCopied(true);

			copiedTimer.current = setTimeout(() => {
				setCopied(false);
				copiedTimer.current = null;
			}, 2000);
		} catch (error: unknown) {
			console.error("Не удалось скопировать путь:", error);
		}
	}

	return (
		<section className={styles.wrapper}>
			<div className={styles.section}>
				<h2 className={styles.title}>Общее</h2>

				<label className={styles.option}>
					<input
						type="checkbox"
						checked={settings.general.launchOnStartup}
						onChange={(event) =>
							updateGeneral("launchOnStartup", event.target.checked)
						}
					/>
					<span className={styles.checkbox} />
					<span>Запускать Robento при запуске системы</span>
				</label>

				<label className={styles.option}>
					<input
						type="checkbox"
						checked={settings.general.hideOnBlur}
						onChange={(event) =>
							updateGeneral("hideOnBlur", event.target.checked)
						}
					/>
					<span className={styles.checkbox} />
					<span>Скрывать Robento, если потерян фокус</span>
				</label>

				<label className={styles.option}>
					<input
						type="checkbox"
						checked={settings.general.gameMode}
						onChange={(event) =>
							updateGeneral("gameMode", event.target.checked)
						}
					/>
					<span className={styles.checkbox} />
					<span>Игровой режим</span>
				</label>
			</div>

			<div className={styles.section}>
				<h2 className={styles.title}>Системная информация</h2>

				<div className={styles.pathLabel}>Директория данных</div>

				<div className={styles.pathRow}>
					<div
						className={`${styles.pathValue} ${copied ? styles.pathCopied : ""}`}
						title={databasePath}
					>
						{databasePath || "Загрузка пути..."}
					</div>

					<button
						type="button"
						className={styles.copyButton}
						onClick={handleCopyPath}
						disabled={!databasePath}
					>
						{copied ? "Скопировано ✓" : "Копировать"}
					</button>
				</div>
			</div>
		</section>
	);
}

import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";
import { GitBranch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../i18n/useLanguage";
import { REP_URL } from "../../shared/link/link";
import { useSettings } from "../context/SettingsProvider";

import styles from "./Settings.module.css";

/**
 * Отображает настройки приложения и обрабатывает их изменение.
 *
 * Получает настройки и функцию обновления из SettingsProvider.
 */

export default function Settings() {
	const { settings, updateGeneral } = useSettings();
	const [appVersion, setAppVersion] = useState("");

	const { t } = useTranslation();
	const { currentLanguage, changeLanguage } = useLanguage();

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

		getVersion()
			.then((version) => {
				if (!cancelled) setAppVersion(version);
			})
			.catch((error: unknown) => {
				console.error("Не удалось получить версию приложения:", error);
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
			{/* Общее */}
			<div className={styles.section}>
				<h2 className={styles.title}>{t("settings.general")}</h2>

				<label className={styles.option}>
					<input
						type="checkbox"
						checked={settings.general.launchOnStartup}
						onChange={(event) =>
							updateGeneral("launchOnStartup", event.target.checked)
						}
					/>
					<span className={styles.checkbox} />
					<span>{t("settings.launchOnStartup")}</span>
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
					<span>{t("settings.hideOnBlur")}</span>
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
					<span>{t("settings.gameMode")}</span>
				</label>
			</div>

			{/* Язык приложения */}
			<div className={styles.section}>
				<h2 className={styles.title}>{t("settings.language")}</h2>

				<div className={styles.languageRow}>
					<span className={styles.pathLabel}>
						{t("settings.selectLanguage")}
					</span>

					<select
						className={styles.languageSelect}
						value={currentLanguage}
						onChange={(event) =>
							void changeLanguage(event.target.value as "eu" | "ru")
						}
					>
						<option value="eu">English</option>
						<option value="ru">Русский</option>
					</select>
				</div>
			</div>

			{/* Системная информация */}
			<div className={styles.section}>
				<h2 className={styles.title}>{t("settings.systemInfo")}</h2>

				<div className={styles.pathLabel}>{t("settings.dataDirectory")}</div>

				<div className={styles.pathRow}>
					<div
						className={`${styles.pathValue} ${copied ? styles.pathCopied : ""}`}
						title={databasePath}
					>
						{databasePath || t("settings.loadingPath")}
					</div>

					<button
						type="button"
						className={styles.copyButton}
						onClick={handleCopyPath}
						disabled={!databasePath}
					>
						{copied ? t("actionButton.copied") : t("actionButton.copy")}
					</button>
				</div>

				<div className={styles.versionRow}>
					<span className={styles.versionLabel}>
						{t("settings.appVersion")}
					</span>

					<span className={styles.appVersion}>
						{appVersion || t("settings.loadingVersion")}
					</span>

					<a
						className={styles.githubLink}
						href={REP_URL}
						onClick={(event) => {
							event.preventDefault();
							void openUrl(REP_URL).catch(console.error);
						}}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="GitHub repository"
						title="GitHub"
					>
						<GitBranch size={16} />
					</a>
				</div>
			</div>
		</section>
	);
}

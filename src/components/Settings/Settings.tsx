import { useSettings } from "../context/SettingsProvider";
import styles from "./Settings.module.css";

/**
 * Отображает настройки приложения и обрабатывает их изменение.
 *
 * Получает настройки и функцию обновления из SettingsProvider.
 */

export default function Settings() {
	const { settings, updateGeneral } = useSettings();

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
		</section>
	);
}

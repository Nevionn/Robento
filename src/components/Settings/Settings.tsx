import { useState } from "react";

import styles from "./Settings.module.css";

type Settings = {
	general: {
		launchOnStartup: boolean;
		hideOnBlur: boolean;
		gameMode: boolean;
	};
};

const STORAGE_KEY = "robento-settings";

const defaultSettings: Settings = {
	general: {
		launchOnStartup: false,
		hideOnBlur: false,
		gameMode: false,
	},
};

function loadSettings(): Settings {
	const stored = localStorage.getItem(STORAGE_KEY);

	if (!stored) {
		return defaultSettings;
	}

	try {
		return JSON.parse(stored) as Settings;
	} catch {
		return defaultSettings;
	}
}

export default function Settings() {
	const [settings, setSettings] = useState<Settings>(loadSettings);

	function updateGeneral(key: keyof Settings["general"], value: boolean) {
		setSettings((current) => {
			const next = {
				...current,
				general: {
					...current.general,
					[key]: value,
				},
			};

			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

			return next;
		});
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
		</section>
	);
}

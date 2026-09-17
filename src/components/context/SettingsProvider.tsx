/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { invoke } from "@tauri-apps/api/core";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type Settings = {
	general: {
		launchOnStartup: boolean;
		hideOnBlur: boolean;
		gameMode: boolean;
	};
};

const STORAGE_KEY = "robento-settings";

export const defaultSettings: Settings = {
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

type SettingsContextValue = {
	settings: Settings;
	updateGeneral: (
		key: keyof Settings["general"],
		value: boolean,
	) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Предоставляет настройки приложения через React Context.
 *
 * Загружает сохранённые настройки из localStorage при запуске приложения,
 * синхронизирует необходимые настройки с Rust и предоставляет
 * дочерним компонентам доступ к настройкам и их изменению.
 *
 * Текущая передача:
 * localStorage → Settings Store → [hideOnBlur, gameMode] → Rust AppSettings
 */

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<Settings>(loadSettings);

	useEffect(() => {
		invoke("set_hide_on_blur", {
			value: settings.general.hideOnBlur,
		}).catch((error) => {
			console.error(
				"Не удалось синхронизировать настройку скрытия при потере фокуса:",
				error,
			);
		});

		invoke("set_game_mode", {
			value: settings.general.gameMode,
		}).catch((error) => {
			console.error("Не удалось синхронизировать игровой режим:", error);
		});
	}, []);

	async function updateGeneral(key: keyof Settings["general"], value: boolean) {
		const next = {
			...settings,
			general: {
				...settings.general,
				[key]: value,
			},
		};

		setSettings(next);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

		if (key === "hideOnBlur") {
			try {
				await invoke("set_hide_on_blur", {
					value,
				});
			} catch (error) {
				console.error(
					"Не удалось изменить настройку скрытия при потере фокуса:",
					error,
				);
			}
		}

		if (key === "gameMode") {
			try {
				await invoke("set_game_mode", {
					value,
				});
			} catch (error) {
				console.error("Не удалось изменить игровой режим:", error);
			}
		}
	}

	return (
		<SettingsContext.Provider
			value={{
				settings,
				updateGeneral,
			}}
		>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error(
			"useSettings должен использоваться внутри SettingsProvider",
		);
	}

	return context;
}

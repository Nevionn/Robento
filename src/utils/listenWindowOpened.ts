import type { UnlistenFn } from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";

/**
 * Слушает событие открытия окна из tray / Alt+Space
 */

export function listenWindowOpened(callback: () => void): Promise<UnlistenFn> {
	return listen("window-opened", callback);
}

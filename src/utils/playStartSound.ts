import startSound from "../assets/sound/start.wav";

/**
 * Звук при открытии окна
 */

export function playStartSound() {
	const audio = new Audio(startSound);

	audio.volume = 0.3;

	audio.play().catch((error) => {
		console.error("Не удалось воспроизвести start.wav:", error);
	});
}

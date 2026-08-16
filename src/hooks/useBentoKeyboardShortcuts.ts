import { useEffect } from "react";

interface UseBentoKeyboardShortcutsParams {
	focusedGroupId: string | null;
	onCreateGroup(): void;
	onEditGroup(id: string): void;
	onDeleteGroup(id: string): void;
}

/**
 * Горячие клавиши Bento-сетки.
 *
 * Shift + G — создать новую группу.
 * R        — редактировать выбранную группу.
 * Shift + R — удалить выбранную группу.
 *
 * Хук не управляет состоянием групп.
 * Определяет клавиши и вызывает переданные callbacks.
 */

export function useBentoKeyboardShortcuts({
	focusedGroupId,
	onCreateGroup,
	onEditGroup,
	onDeleteGroup,
}: UseBentoKeyboardShortcutsParams) {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.repeat) {
				return;
			}

			// Shift + G — создать группу
			if (event.shiftKey && event.key.toLowerCase() === "g") {
				event.preventDefault();
				onCreateGroup();
				return;
			}

			// Shift + R — удалить выбранную группу
			if (event.shiftKey && event.key.toLowerCase() === "r") {
				if (!focusedGroupId) {
					return;
				}

				event.preventDefault();
				onDeleteGroup(focusedGroupId);
				return;
			}

			// R — редактировать выбранную группу
			if (event.key.toLowerCase() === "r") {
				if (!focusedGroupId) {
					return;
				}

				event.preventDefault();
				onEditGroup(focusedGroupId);
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [focusedGroupId, onCreateGroup, onEditGroup, onDeleteGroup]);
}

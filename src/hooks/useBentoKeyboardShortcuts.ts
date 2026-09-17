import { useEffect } from "react";

interface UseBentoKeyboardShortcutsParams {
	focusedGroupId: string | null;
	focusedShortcutId: string | null;

	onCreateGroup(): void;
	onEditGroup(id: string): void;
	onDeleteGroup(id: string): void;
	onDeleteShortcut(id: string): void;
	onAddShortcut(): void;
}

/**
 * Горячие клавиши Bento-сетки.
 *
 * Shift + G — создать новую группу.
 * R        — редактировать выбранную группу.
 * Shift + R — удалить выбранную группу / ярлык.
 * Shift + F — создать ярлык в активной группе.
 *
 * Хук не управляет состоянием групп.
 * Определяет клавиши и вызывает переданные callbacks.
 */

export function useBentoKeyboardShortcuts({
	focusedGroupId,
	focusedShortcutId,
	onCreateGroup,
	onEditGroup,
	onDeleteGroup,
	onDeleteShortcut,
	onAddShortcut,
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

			// Shift + R — удалить выбранный объект
			if (event.shiftKey && event.key.toLowerCase() === "r") {
				event.preventDefault();

				if (focusedShortcutId) {
					onDeleteShortcut(focusedShortcutId);
					return;
				}

				if (focusedGroupId) {
					onDeleteGroup(focusedGroupId);
				}

				return;
			}

			// Shift + F — добавить ярлык в активную группу
			if (event.shiftKey && event.key.toLowerCase() === "f") {
				if (!focusedGroupId || focusedShortcutId) {
					return;
				}

				event.preventDefault();
				onAddShortcut();
				return;
			}

			// R — редактировать выбранную группу
			if (event.key.toLowerCase() === "r") {
				if (!focusedGroupId || focusedShortcutId) {
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
	}, [
		focusedGroupId,
		focusedShortcutId,
		onCreateGroup,
		onEditGroup,
		onDeleteGroup,
		onDeleteShortcut,
		onAddShortcut,
	]);
}

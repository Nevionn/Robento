import { useEffect } from "react";

interface UseBentoKeyboardShortcutsParams {
	focusedGroupId: string | null;
	focusedShortcutId: string | null;

	onCreateGroup(): void;
	onEditGroup(id: string): void;
	onDeleteGroup(id: string): void;
	onAddShortcut(): void;
}

/**
 * Горячие клавиши Bento-сетки.
 *
 * Shift + G — создать новую группу.
 * R        — редактировать выбранную группу.
 * Shift + R — удалить выбранную группу.
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
	onAddShortcut,
}: UseBentoKeyboardShortcutsParams) {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.repeat) return;

			const target = event.target;

			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target instanceof HTMLSelectElement ||
				(target instanceof HTMLElement && target.isContentEditable)
			) {
				return;
			}

			// Shift + G — создать группу
			if (event.shiftKey && event.code === "KeyG") {
				event.preventDefault();
				onCreateGroup();
				return;
			}

			// Shift + R — удалить выбранную группу
			if (event.shiftKey && event.code === "KeyR") {
				event.preventDefault();

				if (focusedGroupId) {
					onDeleteGroup(focusedGroupId);
				}

				return;
			}

			// Shift + F — добавить ярлык в активную группу
			if (event.shiftKey && event.code === "KeyF") {
				if (!focusedGroupId || focusedShortcutId) {
					return;
				}

				event.preventDefault();
				onAddShortcut();
				return;
			}

			// R — редактировать выбранную группу
			if (event.code === "KeyR" && !event.shiftKey) {
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
		onAddShortcut,
	]);
}

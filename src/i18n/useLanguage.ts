import { useTranslation } from "react-i18next";

export type Language = "ru" | "eu";

export function useLanguage() {
	const { i18n } = useTranslation();

	const currentLanguage = i18n.language as Language;

	const changeLanguage = async (language: Language) => {
		await i18n.changeLanguage(language);

		localStorage.setItem("language", language);
	};

	return {
		currentLanguage,
		changeLanguage,
	};
}

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import eu from "../locales/eu/translation.json";
import ru from "../locales/ru/translation.json";

const resources = {
	ru: {
		translation: ru,
	},
	eu: {
		translation: eu,
	},
};

const savedLanguage = localStorage.getItem("language");

i18n.use(initReactI18next).init({
	resources,
	lng: savedLanguage || "eu",
	fallbackLng: "eu",

	interpolation: {
		escapeValue: false,
	},
});

export default i18n;

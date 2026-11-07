import { useTranslation } from "react-i18next";

import styles from "./BentoSearch.module.css";

interface BentoSearchProps {
	value: string;
	onChange(value: string): void;
}

/**
 * Компонент поиска ярлыков.
 */

export default function BentoSearch({ value, onChange }: BentoSearchProps) {
	const { t } = useTranslation();

	return (
		<div className={styles.search}>
			<input
				className={styles.input}
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={t("BentoSearch.placeholder")}
				aria-label={t("BentoSearch.ariaLabel")}
				autoComplete="off"
				spellCheck={false}
			/>
		</div>
	);
}

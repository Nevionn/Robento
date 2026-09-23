import styles from "./BentoSearch.module.css";

interface BentoSearchProps {
	value: string;
	onChange(value: string): void;
}

/**
 * Компонент поиска ярлыков.
 */

export default function BentoSearch({ value, onChange }: BentoSearchProps) {
	return (
		<div className={styles.search}>
			<input
				className={styles.input}
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="Поиск приложений..."
				aria-label="Search shortcuts"
				autoComplete="off"
				spellCheck={false}
			/>
		</div>
	);
}

import styles from "./Settings.module.css";

export default function Settings() {
	return (
		<section className={styles.wrapper}>
			<div className={styles.section}>
				<h2 className={styles.title}>Общее</h2>

				<label className={styles.option}>
					<input type="checkbox" />
					<span className={styles.checkbox} />
					<span>Запускать Robento при запуске системы</span>
				</label>

				<label className={styles.option}>
					<input type="checkbox" />
					<span className={styles.checkbox} />
					<span>Скрывать Robento, если потерян фокус</span>
				</label>

				<label className={styles.option}>
					<input type="checkbox" />
					<span className={styles.checkbox} />
					<span>Игровой режим</span>
				</label>
			</div>
		</section>
	);
}

import styles from "./Hotkeys.module.css";

const hotkeys = [
	{
		description: "Создать новую группу",
		keys: ["Shift", "G"],
	},
	{
		description: "Редактировать выбранную группу",
		keys: ["R"],
	},
	{
		description: "Удалить выбранную группу/ярлык",
		keys: ["Shift", "R"],
	},
	{
		description: "Открыть/свернуть окно",
		keys: ["Alt", "B"],
	},
];

export default function Hotkeys() {
	return (
		<div className={styles.wrapper}>
			{hotkeys.map((hotkey) => (
				<div className={styles.row} key={hotkey.description}>
					<span className={styles.description}>{hotkey.description}</span>

					<div className={styles.keys}>
						{hotkey.keys.map((key) => (
							<span className={styles.key} key={key}>
								{key}
							</span>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

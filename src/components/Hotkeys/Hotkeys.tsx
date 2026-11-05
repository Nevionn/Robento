import { useTranslation } from "react-i18next";

import styles from "./Hotkeys.module.css";

export default function Hotkeys() {
	const { t } = useTranslation();

	const hotkeys = [
		{
			id: "createGroup",
			keys: ["Shift", "G"],
		},
		{
			id: "editGroup",
			keys: ["R"],
		},
		{
			id: "deleteGroup",
			keys: ["Shift", "R"],
		},
		{
			id: "toggleWindow",
			keys: ["Alt", "Space"],
		},
	];

	return (
		<div className={styles.wrapper}>
			{hotkeys.map((hotkey) => (
				<div className={styles.row} key={hotkey.id}>
					<span className={styles.description}>
						{t(`Hotkeys.${hotkey.id}`)}
					</span>

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

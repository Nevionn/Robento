import Hotkeys from "../components/Hotkeys/Hotkeys";
import styles from "./EmptyPage.module.css";

export default function EmptyPage() {
	return (
		<section className={styles.wrapper}>
			<Hotkeys />
		</section>
	);
}

import type { ViewName } from "../../types/View";

import BentoGrid from "../BentoGrid/BentoGrid";
import Hotkeys from "../Hotkeys/Hotkeys";
import Settings from "../Settings/Settings";

const views = {
	grid: BentoGrid,
	hotkeys: Hotkeys,
	settings: Settings,
};

type ViewProps = {
	activeView: ViewName;
};

/**
 * Отображает компонент, соответствующий текущему activeView.
 */

export default function View({ activeView }: ViewProps) {
	const ActiveView = views[activeView] ?? BentoGrid;

	return <ActiveView />;
}

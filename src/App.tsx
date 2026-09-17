import { useState } from "react";
import "./App.css";
import { SettingsProvider } from "./components/context/SettingsProvider";

import NavBar from "./components/NavBar/NavBar";
import View from "./components/View/View";

import type { ViewName } from "./types/View";

function App() {
	const [activeView, setActiveView] = useState<ViewName>("grid");

	return (
		<SettingsProvider>
			<main className="container">
				<NavBar activeView={activeView} setActiveView={setActiveView} />

				<View activeView={activeView} />
			</main>
		</SettingsProvider>
	);
}

export default App;

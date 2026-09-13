import { useState } from "react";
import "./App.css";

import NavBar from "./components/NavBar/NavBar";
import View from "./components/View/View";

import type { ViewName } from "./types/View";

function App() {
	const [activeView, setActiveView] = useState<ViewName>("grid");

	return (
		<main className="container">
			<NavBar activeView={activeView} setActiveView={setActiveView} />

			<View activeView={activeView} />
		</main>
	);
}

export default App;

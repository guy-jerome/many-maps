// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapGallery from "./MapGallery/MapGallery";
import CenteredImage from "./CenteredImage/CenteredImage";
import DungeonEditor from "./DungeonEditor/DungeonEditor";
import LandingPage from "./LandingPage/LandingPage";
import "./App.css";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/gallery" element={<MapGallery />} />
        <Route path="/dungeon" element={<DungeonEditor />} />
        <Route path="/map/:mapId" element={<CenteredImage />} />
        <Route path="/dungeon/:mapId" element={<DungeonEditor />} />
      </Routes>
    </Router>
  );
}

export default App;

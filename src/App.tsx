// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ErrorBoundary } from "./auth/ErrorBoundary";
import MapGallery from "./MapGallery/MapGallery";
import CenteredImage from "./CenteredImage/CenteredImage";
import DungeonEditor from "./DungeonEditor/DungeonEditor";
import LandingPage from "./LandingPage/LandingPage";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/gallery" element={<MapGallery />} />
            <Route path="/dungeon" element={<DungeonEditor />} />
            <Route path="/dungeon/:projectId" element={<DungeonEditor />} />
            <Route path="/map/:mapId" element={<CenteredImage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

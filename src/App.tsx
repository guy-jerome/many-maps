import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapGallery from './MapGallery/MapGallery'
import CenteredImage from './CenteredImage/CenteredImage';
import './App.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapGallery />} />
        <Route path="/map/:mapId" element={<CenteredImage />} />
      </Routes>
    </Router>
  );
}

export default App;

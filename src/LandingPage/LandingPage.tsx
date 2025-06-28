import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  // Auto-login with default username
  const [loggedIn] = React.useState(true);
  const [username] = React.useState("DM");

  return (
    <div className="landing-bg">
      <div className="landing-card">
        <h1>Welcome, {username}!</h1>
        <div className="landing-actions">
          <button className="landing-btn" onClick={() => navigate("/gallery")}>
            Map Gallery
          </button>
          <button className="landing-btn" onClick={() => navigate("/dungeon")}>
            Dungeon Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

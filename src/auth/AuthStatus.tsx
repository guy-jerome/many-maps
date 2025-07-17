// src/auth/AuthStatus.tsx
import React from "react";
import { useAuth } from "./AuthContext";
import "./AuthStatus.css";

export const AuthStatus: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="auth-status guest">
        <div className="status-indicator">
          <span className="status-dot offline"></span>
          <span>Guest User</span>
        </div>
        <p className="auth-message">
          Sign in to save your work and access all features
        </p>
      </div>
    );
  }

  return (
    <div className="auth-status authenticated">
      <div className="status-indicator">
        <span className="status-dot online"></span>
        <span>Signed in as {user.username}</span>
      </div>
      <div className="auth-features">
        <div className="feature-item">
          <span className="feature-icon">💾</span>
          <span>Your data is automatically saved</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🗺️</span>
          <span>Access your personal map gallery</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🏰</span>
          <span>Save and load dungeon projects</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🌐</span>
          <span>Share maps with the community</span>
        </div>
      </div>
    </div>
  );
};

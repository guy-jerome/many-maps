// src/auth/UserSettings.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { updateUser } from "../idbService";
import "./UserSettings.css";

export const UserSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        username,
        email,
        lastLoginAt: new Date()
      };
      
      await updateUser(updatedUser);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="user-settings-container">
        <p>Please log in to view your settings.</p>
      </div>
    );
  }

  return (
    <div className="user-settings-container">
      <h2>User Settings</h2>
      
      <div className="settings-section">
        <h3>Profile Information</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Username:</label>
            {isEditing ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="settings-input"
              />
            ) : (
              <span className="settings-value">{username}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="settings-input"
              />
            ) : (
              <span className="settings-value">{email}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Member Since:</label>
            <span className="settings-value">
              {user.createdAt.toLocaleDateString()}
            </span>
          </div>
          
          <div className="form-group">
            <label>Last Login:</label>
            <span className="settings-value">
              {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : "Never"}
            </span>
          </div>
        </div>
        
        <div className="settings-actions">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="save-btn"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                className="cancel-btn"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="edit-btn"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Account Actions</h3>
        <button
          onClick={logout}
          className="logout-btn"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './UserProfile.css';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="user-profile-header">
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{user.username}</h3>
            <p>{user.email}</p>
          </div>
          <button className="profile-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-profile-content">
          <div className="profile-section">
            <h4>Account Information</h4>
            <div className="profile-item">
              <label>Username:</label>
              <span>{user.username}</span>
            </div>
            <div className="profile-item">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            <div className="profile-item">
              <label>Member since:</label>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            {user.lastLoginAt && (
              <div className="profile-item">
                <label>Last login:</label>
                <span>{formatDate(user.lastLoginAt)}</span>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button 
              className="logout-btn" 
              onClick={() => setShowLogoutConfirm(true)}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {showLogoutConfirm && (
          <div className="logout-confirm-overlay">
            <div className="logout-confirm-modal">
              <h4>Sign Out</h4>
              <p>Are you sure you want to sign out?</p>
              <div className="logout-confirm-actions">
                <button 
                  className="confirm-logout-btn" 
                  onClick={handleLogout}
                >
                  Yes, Sign Out
                </button>
                <button 
                  className="cancel-logout-btn" 
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

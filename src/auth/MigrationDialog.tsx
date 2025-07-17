// src/auth/MigrationDialog.tsx
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { migrateUserData, MigrationResult } from "../utils/dataMigration";
import "./MigrationDialog.css";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export const MigrationDialog: React.FC<Props> = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await migrateUserData(user.id);
      setMigrationResult(result);
      
      if (result.success) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationResult({
        success: false,
        migratedMaps: 0,
        migratedProjects: 0,
        errors: [`Migration failed: ${error}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (migrationResult) {
    return (
      <div className="migration-overlay">
        <div className="migration-dialog">
          <h3>Migration Results</h3>
          
          {migrationResult.success ? (
            <div className="migration-success">
              <p>✅ Data migration completed successfully!</p>
              <ul>
                <li>Maps migrated: {migrationResult.migratedMaps}</li>
                <li>Projects migrated: {migrationResult.migratedProjects}</li>
              </ul>
              <p>Your existing data is now associated with your account.</p>
            </div>
          ) : (
            <div className="migration-error">
              <p>❌ Migration completed with errors:</p>
              <ul>
                {migrationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <p>Some data may need to be manually re-created.</p>
            </div>
          )}
          
          <button onClick={onComplete} className="migration-btn">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-overlay">
      <div className="migration-dialog">
        <h3>Migrate Your Existing Data</h3>
        
        <div className="migration-content">
          <p>
            We've detected that you have existing maps and dungeon projects that aren't 
            associated with your account yet.
          </p>
          
          <p>
            Would you like to migrate this data to your account? This will:
          </p>
          
          <ul>
            <li>Associate your existing maps with your account</li>
            <li>Associate your existing dungeon projects with your account</li>
            <li>Set them as private by default (you can make them public later)</li>
            <li>Preserve all your existing work</li>
          </ul>
          
          <p>
            <strong>Note:</strong> This is a one-time process and cannot be undone.
          </p>
        </div>
        
        <div className="migration-actions">
          <button
            onClick={handleMigrate}
            disabled={isLoading}
            className="migration-btn migrate-btn"
          >
            {isLoading ? "Migrating..." : "Migrate My Data"}
          </button>
          
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="migration-btn skip-btn"
          >
            Skip Migration
          </button>
        </div>
      </div>
    </div>
  );
};

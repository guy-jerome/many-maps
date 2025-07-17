// Loading spinner component
import React from "react";

interface LoadingSpinnerProps {
  loading: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="ci-spinner-overlay">
      <div className="ci-spinner" />
    </div>
  );
};

export default LoadingSpinner;

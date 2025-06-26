import { useCallback } from 'react';

// Rounds a coordinate value to the nearest multiple of cellSize
const useSnapToGrid = (cellSize: number) => {
  return useCallback((value: number) => {
    return Math.round(value / cellSize) * cellSize;
  }, [cellSize]);
};

export default useSnapToGrid;

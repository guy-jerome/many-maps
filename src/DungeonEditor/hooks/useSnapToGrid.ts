// src/hooks/useSnapToGrid.ts
import { useCallback } from "react";
export default function useSnapToGrid(cellSize: number, snapOn: boolean) {
  return useCallback(
    (v: number) => (snapOn ? Math.round(v / cellSize) * cellSize : v),
    [cellSize, snapOn]
  );
}

// src/hooks/useHistory.ts
import { useState } from "react";
export default function useHistory<T>({ initial }: { initial: T }) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);
  function setState(newState: T) {
    setPast([...past, present]);
    setPresent(newState);
    setFuture([]);
  }
  function undo() {
    if (past.length) {
      const previous = past[past.length - 1];
      setPast(past.slice(0, -1));
      setFuture([present, ...future]);
      setPresent(previous);
    }
  }
  function redo() {
    if (future.length) {
      const next = future[0];
      setFuture(future.slice(1));
      setPast([...past, present]);
      setPresent(next);
    }
  }
  return {
    state: present,
    setState,
    undo,
    redo,
    clearHistory: () => {
      setPast([]);
      setFuture([]);
    },
  };
}

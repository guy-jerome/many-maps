// src/hooks/useBackground.ts
import { useState } from "react";
export default function useBackground(initial: string) {
  const [bgColor, setBgColor] = useState(initial);
  return { bgColor, setBgColor };
}

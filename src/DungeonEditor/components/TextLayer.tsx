// src/components/TextLayer.tsx
import { Layer, Text } from "react-konva";
interface Txt {
  x: number;
  y: number;
  text: string;
  id: string;
  fontSize: number;
  fill: string;
}
interface Props {
  texts: Txt[];
}
export default function TextLayer({ texts }: Props) {
  return (
    <Layer>
      {texts.map((t) => (
        <Text
          key={t.id}
          id={t.id}
          x={t.x}
          y={t.y}
          text={t.text}
          fontSize={t.fontSize}
          fill={t.fill}
          draggable
        />
      ))}
    </Layer>
  );
}

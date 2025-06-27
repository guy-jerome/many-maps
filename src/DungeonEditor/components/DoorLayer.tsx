// src/components/DoorLayer.tsx
import { Layer, Line } from 'react-konva';
interface Door { points:number[]; id:string; stroke:string; strokeWidth:number; open:boolean; }
interface Props { doors:Door[]; }
export default function DoorLayer({doors}:Props){
  return (
    <Layer>
      {doors.map(d=><Line key={d.id} id={d.id} points={d.points} stroke={d.stroke} strokeWidth={d.strokeWidth} dash={[4,4]} />)}
    </Layer>
  );
}
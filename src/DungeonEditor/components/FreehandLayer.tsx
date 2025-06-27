// src/components/FreehandLayer.tsx
import { Layer, Line } from 'react-konva';
interface Freehand { points:number[]; id:string; stroke:string; strokeWidth:number; }
interface Props { lines:Freehand[]; current:number[]|null; }
export default function FreehandLayer({lines,current}:Props){
  return (
    <Layer>
      {lines.map(l=><Line key={l.id} id={l.id} points={l.points} stroke={l.stroke} strokeWidth={l.strokeWidth} lineCap="round" lineJoin="round" />)}
      {current && <Line points={current} stroke={lines.length?lines[lines.length-1].stroke:'#000'} strokeWidth={lines.length?lines[lines.length-1].strokeWidth:4} lineCap="round" lineJoin="round" />}
    </Layer>
  );
}
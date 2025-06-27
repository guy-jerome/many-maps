// src/components/RoomLayer.tsx
import { Layer, Rect } from 'react-konva';
interface Room { x:number; y:number; width:number; height:number; id:string; stroke:string; fill:string; strokeWidth:number; }
interface Props { rooms:Room[]; }
export default function RoomLayer({rooms}:Props){
  return (
    <Layer>
      {rooms.map(r=><Rect key={r.id} id={r.id} x={r.x} y={r.y} width={r.width} height={r.height}
        stroke={r.stroke} fill={r.fill} strokeWidth={r.strokeWidth} />)}
    </Layer>
  );
}
// src/components/TokenLayer.tsx
import { Layer, Image } from 'react-konva';
import useImage from 'use-image';
interface Tok { x:number; y:number; id:string; src:string; width:number; height:number; rotation:number; }
interface Props { tokens:Tok[]; }
export default function TokenLayer({tokens}:Props){
  return (
    <Layer>
      {tokens.map(tok => <Token key={tok.id} {...tok} />)}
    </Layer>
  );
}

function Token({id, x,y, src, width, height, rotation}:Tok) {
  const [img] = useImage(src);
  return <Image id={id} x={x} y={y} image={img} width={width} height={height} rotation={rotation} draggable />;
}
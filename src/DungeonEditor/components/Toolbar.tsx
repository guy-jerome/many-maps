// src/components/Toolbar.tsx
interface Props {
  mode:any; setMode:any;
  strokeColor:string; setStrokeColor:any;
  fillColor:string; setFillColor:any;
  strokeWidth:number; setStrokeWidth:any;
  fontSize:number; setFontSize:any;
  bgColor:string; setBgColor:any;
  gridOn:boolean; setGridOn:any;
  snapOn:boolean; setSnapOn:any;
  cellSize:number; setCellSize:any;
  onUndo:any; onRedo:any; onClear:any; onSaveImage:any; onSaveJSON:any;
}

export default function Toolbar(props:Props){
  const {
    mode,setMode, strokeColor,setStrokeColor, fillColor,setFillColor,
    strokeWidth,setStrokeWidth, fontSize,setFontSize,
    bgColor,setBgColor, gridOn,setGridOn, snapOn,setSnapOn,
    cellSize,setCellSize, onUndo,onRedo,onClear,onSaveImage,onSaveJSON
  } = props;

  return (
    <div style={{ marginBottom: 10, display: 'flex', flexWrap:'wrap', gap:8 }}>
      {['select','wall','room','circle','door','freehand','text','token','eraser','pan'].map(m=>
        <button key={m} onClick={()=>setMode(m)} style={{ background: mode===m?'#ddd':undefined }}>{m}</button>
      )}
      <label>Stroke: <input type="color" value={strokeColor} onChange={e=>setStrokeColor(e.target.value)}/></label>
      <label>Fill: <input type="color" value={fillColor} onChange={e=>setFillColor(e.target.value)}/></label>
      <label>Width: <input type="number" value={strokeWidth} min={1} max={20} onChange={e=>setStrokeWidth(+e.target.value)}/></label>
      <label>Font: <input type="number" value={fontSize} min={8} max={72} onChange={e=>setFontSize(+e.target.value)}/></label>
      <label>BG: <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)}/></label>
      <label>Grid: <input type="checkbox" checked={gridOn} onChange={e=>setGridOn(e.target.checked)}/></label>
      <label>Snap: <input type="checkbox" checked={snapOn} onChange={e=>setSnapOn(e.target.checked)}/></label>
      <label>Size: <input type="number" value={cellSize} min={10} max={200} onChange={e=>setCellSize(+e.target.value)}/></label>
      <button onClick={onUndo}>Undo</button><button onClick={onRedo}>Redo</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onSaveImage}>Export PNG</button>
      <button onClick={onSaveJSON}>Save Map</button>
    </div>
  );
}
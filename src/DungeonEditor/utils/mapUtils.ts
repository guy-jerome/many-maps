// src/utils/mapUtils.ts
export function exportToImage(stage:any, filename:string) {
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function saveMapState(key:string, state:any) {
  localStorage.setItem(`dungeonMap-${key}`, JSON.stringify(state));
}
export function loadMapState(key:string) {
  const s = localStorage.getItem(`dungeonMap-${key}`);
  return s? JSON.parse(s): null;
}
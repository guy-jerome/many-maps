export const exportToImage = (
  stage: any,
  fileName: string = "dungeon-map.png"
) => {
  if (!stage) return;
  const uri = stage.toDataURL();
  const link = document.createElement("a");
  link.download = fileName;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

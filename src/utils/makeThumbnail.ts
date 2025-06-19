// src/utils/makeThumbnail
// helper to downscale a Blob into a smaller JPEG blob
export async function makeThumbnail(
  blob: Blob,
  maxW: number,
  maxH: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('2D context failed'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (tb) => {
          if (tb) resolve(tb);
          else reject(new Error('Thumbnail blob failed'));
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load error'));
    };
    img.src = url;
  });
}
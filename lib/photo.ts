export function readPhoto(file: File) {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Use a photo."));
  if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error("That photo is over 8 MB."));
  const url = URL.createObjectURL(file);
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("This browser could not read that photo."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.72;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > 220_000 && quality > 0.4) {
        quality -= 0.12;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      URL.revokeObjectURL(url);
      if (data.length > 280_000) {
        reject(new Error("That photo is still too large after resizing."));
        return;
      }
      resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo could not be opened."));
    };
    image.src = url;
  });
}

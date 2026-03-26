// Client-side image compression before upload
// Reduces file size from 5-10MB to <500KB

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<File> {
  // Skip compression for small files or non-images
  if (file.size < 500 * 1024 || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }
          const compressed = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          // Only use compressed if it's actually smaller
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export async function preparePhoto(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP photo.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose an original photo smaller than 20 MiB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("This image could not be prepared.")),
        "image/jpeg",
        0.85,
      ),
    );
    if (blob.size > 2 * 1024 * 1024)
      throw new Error(
        "This photo is still over 2 MiB after resizing. Choose a smaller image.",
      );
    return blob;
  } finally {
    bitmap.close();
  }
}

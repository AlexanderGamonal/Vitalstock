/**
 * Convierte un archivo de imagen a formato WebP usando el Canvas API del navegador.
 * Esto reduce significativamente el tamaño de las fotos antes de subirlas a Supabase.
 *
 * @param file - El archivo de imagen original (JPG, PNG, HEIC, etc.)
 * @param quality - Calidad del WebP entre 0 y 1 (por defecto 0.82)
 * @param maxWidth - Ancho máximo en píxeles (por defecto 1200px)
 * @returns Un nuevo File en formato WebP
 */
export async function convertToWebP(
  file: File,
  quality = 0.82,
  maxWidth = 1200
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calcular dimensiones respetando el aspecto original
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al convertir la imagen a WebP"));
            return;
          }
          // Crear un nuevo File con extensión .webp
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
          });
          resolve(webpFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Error al cargar la imagen"));
    };

    img.src = objectUrl;
  });
}

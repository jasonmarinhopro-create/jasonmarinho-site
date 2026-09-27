// Compression d'image côté navigateur avant envoi (photos de téléphone de
// 3 à 8 Mo → ~200 à 500 Ko) : envoi rapide en 4G et stockage léger.
// Si le format n'est pas décodable par le navigateur (ex : HEIC hors Safari),
// le fichier d'origine est renvoyé tel quel.
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('compression'))), 'image/jpeg', quality))
  } catch {
    return file
  }
}

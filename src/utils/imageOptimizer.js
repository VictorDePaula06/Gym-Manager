// Celulares recentes (ex: Galaxy S2x) às vezes salvam foto da câmera em
// HEIC/HEIF — formato que <img>/<canvas> não decodificam no navegador.
// Detecta pelo mime type (quando o Android informa certo) ou pela extensão
// do arquivo (quando vem como application/octet-stream).
const isHeic = (file) => {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif');
};

// Converte HEIC/HEIF pra JPEG antes de qualquer outro processamento.
const convertHeicToJpeg = async (file) => {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    // heic2any pode devolver um array de blobs (HEIC com múltiplas imagens) — pega a primeira.
    return Array.isArray(result) ? result[0] : result;
};

// Decodifica o arquivo numa bitmap. createImageBitmap é bem mais leve de
// memória que FileReader(dataURL) + <img> — importante em fotos de 20-50MP
// de câmeras atuais, que no caminho antigo travavam silenciosamente em
// celulares mais específicos. Cai pro caminho via <img> se não suportado.
const decodeToBitmapOrImage = async (blob) => {
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(blob);
        } catch {
            // segue pro fallback abaixo (ex: Safari antigo com algumas orientações EXIF)
        }
    }
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
        img.src = url;
    });
};

/**
 * Compress and resize an image file ensuring it's below a target size.
 * @param {File} file - The original image file.
 * @param {number} maxWidth - Maximum width (default 800px).
 * @param {number} quality - JPEG quality (0 to 1, default 0.8).
 * @returns {Promise<Blob>} - Compressed image blob.
 */
export const compressImage = async (file, maxWidth = 800, quality = 0.8) => {
    const source = isHeic(file) ? await convertHeicToJpeg(file) : file;
    const bitmap = await decodeToBitmapOrImage(source);

    const elem = document.createElement('canvas');
    let width = bitmap.width || bitmap.naturalWidth;
    let height = bitmap.height || bitmap.naturalHeight;

    if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
    }

    elem.width = width;
    elem.height = height;
    const ctx = elem.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    return new Promise((resolve, reject) => {
        ctx.canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
        }, 'image/jpeg', quality);
    });
};

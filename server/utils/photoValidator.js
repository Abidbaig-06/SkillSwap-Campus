/**
 * Maximum allowed size for a processed photo document in MongoDB: 500 KB.
 * (A cropped 400x400 JPEG/WebP is typically 30KB - 80KB).
 */
export const MAX_PHOTO_BYTES = 500 * 1024; // 500 KB

/**
 * Validates file signature (magic numbers) of the image buffer.
 */
export function detectImageMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  return null;
}

/**
 * Parses and validates an uploaded photo Data URL or base64 string.
 * Enforces size limits and checks real binary magic numbers.
 */
export function validateAndParsePhoto(photoData) {
  if (!photoData || typeof photoData !== 'string') {
    const err = new Error('Photo data must be a valid base64 data URL.');
    err.status = 400;
    throw err;
  }

  const match = photoData.match(/^data:(image\/(jpeg|jpg|png|webp|gif));base64,(.+)$/i);
  if (!match) {
    const err = new Error('Invalid photo format. Please provide a JPEG, PNG, or WebP image.');
    err.status = 400;
    throw err;
  }

  const base64Data = match[3];

  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    const err = new Error('Malformed base64 photo data.');
    err.status = 400;
    throw err;
  }

  if (buffer.length < 24) {
    const err = new Error('Photo file is too small or corrupted.');
    err.status = 400;
    throw err;
  }

  if (buffer.length > MAX_PHOTO_BYTES) {
    const err = new Error(`Profile photo exceeds maximum size limit of ${MAX_PHOTO_BYTES / 1024}KB.`);
    err.status = 400;
    throw err;
  }

  const detectedMime = detectImageMimeType(buffer);
  if (!detectedMime) {
    const err = new Error('Invalid image file. File signature does not match a supported image format (JPEG, PNG, WebP).');
    err.status = 400;
    throw err;
  }

  return {
    buffer,
    contentType: detectedMime,
    size: buffer.length
  };
}

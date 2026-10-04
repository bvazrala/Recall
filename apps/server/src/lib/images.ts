import decodeHeic from "heic-decode";
import sharp from "sharp";

// Claude reads JPEG, PNG, GIF, and WebP, but iPhones often send HEIC. Claude also shrinks any image
// larger than its size limit, so shrinking first sends fewer bytes and loses nothing Claude would see.
const MAX_EDGE = 1568;

export async function prepareImage(bytes: Uint8Array, mediaType: string): Promise<{ data: Buffer; mediaType: "image/jpeg" }> {
  const image = mediaType === "image/heic" || mediaType === "image/heif" ? await fromHeic(bytes) : sharp(bytes).rotate(); // rotate() turns the photo upright using the phone's orientation tag
  const data = await image
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { data, mediaType: "image/jpeg" };
}

async function fromHeic(bytes: Uint8Array) {
  const { width, height, data } = await decodeHeic({ buffer: bytes });
  const pixels = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  return sharp(pixels, { raw: { width, height, channels: 4 } }).removeAlpha();
}

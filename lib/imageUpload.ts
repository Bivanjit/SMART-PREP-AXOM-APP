import type { ImagePickerAsset } from 'expo-image-picker';

/**
 * React Native's fetch(file://...).blob() can produce an empty payload on
 * some Android devices. ImagePicker's base64 payload is decoded explicitly
 * and sent to Supabase Storage as bytes instead.
 */
export function imageAssetToBytes(asset: ImagePickerAsset): Uint8Array {
  if (!asset.base64) {
    throw new Error('The selected image could not be read. Please choose it again.');
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = asset.base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length * 3 / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of clean) {
    const value = alphabet.indexOf(character);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset++] = (buffer >> bits) & 255;
    }
  }
  const result = bytes.slice(0, offset);
  if (!result.byteLength) throw new Error('The selected image is empty. Please choose another image.');
  return result;
}

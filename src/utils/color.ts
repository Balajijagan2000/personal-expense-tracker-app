/**
 * Calculates the contrast color (either '#FFFFFF' or '#0F172A') for a given hex color
 * to ensure high accessibility and readability.
 */
export function getContrastColor(hexColor: string): string {
  if (!hexColor) return '#FFFFFF';

  // Remove the hash if it exists
  const cleanHex = hexColor.replace('#', '');

  // Parse R, G, B values
  let r = 255;
  let g = 255;
  let b = 255;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
    g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
    b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '#FFFFFF';
  }

  // Calculate relative luminance (YIQ formula)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Threshold of 130 ensures Amber, Lime, Cyan, Teal, Orange get dark text.
  return yiq >= 130 ? '#0F172A' : '#FFFFFF';
}

/**
 * Safely creates a translucent rgba color for selected background highlights.
 */
export function getTranslucentColor(hexColor: string, opacity: number): string {
  if (!hexColor) return `rgba(0, 0, 0, ${opacity})`;

  // Remove hash
  const cleanHex = hexColor.replace('#', '');

  let r = 0;
  let g = 0;
  let b = 0;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
    g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
    b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return hexColor;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Color utility functions for theme management and accessibility
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Parse HSL string in format "h s% l%" or "hsl(h, s%, l%)"
 */
export function parseHslString(hsl: string): HSL {
  // Remove "hsl(" and ")" if present
  hsl = hsl.replace(/hsl\(|\)/g, '');

  // Split by space or comma
  const parts = hsl.split(/[\s,]+/).filter(Boolean);

  return {
    h: parseFloat(parts[0]),
    s: parseFloat(parts[1].replace('%', '')),
    l: parseFloat(parts[2].replace('%', '')),
  };
}

/**
 * Calculate relative luminance of a color (0-1)
 * Used for WCAG contrast calculations
 */
export function getLuminance(color: string): number {
  let rgb: RGB;

  // Parse color string
  if (color.startsWith('#')) {
    rgb = hexToRgb(color);
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (!matches || matches.length < 3) return 0;
    rgb = { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
  } else if (color.startsWith('hsl') || /^\d+\s+\d+%\s+\d+%$/.test(color.trim())) {
    const hsl = parseHslString(color);
    rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  } else {
    return 0;
  }

  // Convert to sRGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Convert to linear RGB
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsWCAG(
  ratio: number,
  level: 'AA' | 'AAA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
}

/**
 * Suggest an accessible color by adjusting lightness
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  target: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): string {
  const targetRatio = target === 'AAA' ? (size === 'large' ? 4.5 : 7) : (size === 'large' ? 3 : 4.5);

  // Parse foreground color
  let hsl: HSL;
  if (foreground.startsWith('#')) {
    const rgb = hexToRgb(foreground);
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  } else {
    hsl = parseHslString(foreground);
  }

  const bgLuminance = getLuminance(background);

  // Try adjusting lightness
  let bestColor = foreground;
  let bestRatio = getContrastRatio(foreground, background);

  // Determine if we should go lighter or darker
  const shouldGoLighter = bgLuminance < 0.5;

  for (let l = shouldGoLighter ? hsl.l : hsl.l; shouldGoLighter ? l <= 100 : l >= 0; shouldGoLighter ? l += 5 : l -= 5) {
    const rgb = hslToRgb(hsl.h, hsl.s, l);
    const testColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    const ratio = getContrastRatio(testColor, background);

    if (ratio >= targetRatio && ratio > bestRatio) {
      bestColor = testColor;
      bestRatio = ratio;
    }

    if (ratio >= targetRatio * 1.1) {
      // Found a good enough color
      break;
    }
  }

  return bestColor;
}

/**
 * Format HSL for CSS custom property
 */
export function formatHslForCss(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * Darken a color by a percentage
 */
export function darken(color: string, amount: number): string {
  const hsl = color.startsWith('#') ? rgbToHsl(...Object.values(hexToRgb(color))) : parseHslString(color);
  hsl.l = Math.max(0, hsl.l - amount);
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Lighten a color by a percentage
 */
export function lighten(color: string, amount: number): string {
  const hsl = color.startsWith('#') ? rgbToHsl(...Object.values(hexToRgb(color))) : parseHslString(color);
  hsl.l = Math.min(100, hsl.l + amount);
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

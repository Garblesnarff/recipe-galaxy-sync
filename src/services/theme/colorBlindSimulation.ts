import { hexToRgb, rgbToHex, RGB } from './colorUtils';

export type ColorBlindType = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia';

/**
 * Transformation matrices for different types of color blindness
 * Based on research by Machado, Oliveira, and Fernandes (2009)
 */

// Deuteranopia (red-green, missing green cones) - ~6% of males
const DEUTERANOPIA_MATRIX = [
  [0.625, 0.375, 0],
  [0.7, 0.3, 0],
  [0, 0.3, 0.7]
];

// Protanopia (red-green, missing red cones) - ~2% of males
const PROTANOPIA_MATRIX = [
  [0.567, 0.433, 0],
  [0.558, 0.442, 0],
  [0, 0.242, 0.758]
];

// Tritanopia (blue-yellow, missing blue cones) - ~0.001% of population
const TRITANOPIA_MATRIX = [
  [0.95, 0.05, 0],
  [0, 0.433, 0.567],
  [0, 0.475, 0.525]
];

// Achromatopsia (complete color blindness) - very rare
const ACHROMATOPSIA_MATRIX = [
  [0.299, 0.587, 0.114],
  [0.299, 0.587, 0.114],
  [0.299, 0.587, 0.114]
];

/**
 * Apply color transformation matrix to RGB color
 */
function applyMatrix(rgb: RGB, matrix: number[][]): RGB {
  const r = Math.round(matrix[0][0] * rgb.r + matrix[0][1] * rgb.g + matrix[0][2] * rgb.b);
  const g = Math.round(matrix[1][0] * rgb.r + matrix[1][1] * rgb.g + matrix[1][2] * rgb.b);
  const b = Math.round(matrix[2][0] * rgb.r + matrix[2][1] * rgb.g + matrix[2][2] * rgb.b);

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b))
  };
}

/**
 * Simulate deuteranopia (green color blindness)
 */
export function simulateDeuteranopia(color: string): string {
  if (!color || color === 'transparent') return color;

  try {
    const rgb = color.startsWith('#') ? hexToRgb(color) : { r: 0, g: 0, b: 0 };
    const transformed = applyMatrix(rgb, DEUTERANOPIA_MATRIX);
    return rgbToHex(transformed.r, transformed.g, transformed.b);
  } catch {
    return color;
  }
}

/**
 * Simulate protanopia (red color blindness)
 */
export function simulateProtanopia(color: string): string {
  if (!color || color === 'transparent') return color;

  try {
    const rgb = color.startsWith('#') ? hexToRgb(color) : { r: 0, g: 0, b: 0 };
    const transformed = applyMatrix(rgb, PROTANOPIA_MATRIX);
    return rgbToHex(transformed.r, transformed.g, transformed.b);
  } catch {
    return color;
  }
}

/**
 * Simulate tritanopia (blue color blindness)
 */
export function simulateTritanopia(color: string): string {
  if (!color || color === 'transparent') return color;

  try {
    const rgb = color.startsWith('#') ? hexToRgb(color) : { r: 0, g: 0, b: 0 };
    const transformed = applyMatrix(rgb, TRITANOPIA_MATRIX);
    return rgbToHex(transformed.r, transformed.g, transformed.b);
  } catch {
    return color;
  }
}

/**
 * Simulate achromatopsia (complete color blindness - grayscale)
 */
export function simulateAchromatopsia(color: string): string {
  if (!color || color === 'transparent') return color;

  try {
    const rgb = color.startsWith('#') ? hexToRgb(color) : { r: 0, g: 0, b: 0 };
    const transformed = applyMatrix(rgb, ACHROMATOPSIA_MATRIX);
    return rgbToHex(transformed.r, transformed.g, transformed.b);
  } catch {
    return color;
  }
}

/**
 * Simulate any type of color blindness
 */
export function simulateColorBlindness(color: string, type: ColorBlindType): string {
  switch (type) {
    case 'deuteranopia':
      return simulateDeuteranopia(color);
    case 'protanopia':
      return simulateProtanopia(color);
    case 'tritanopia':
      return simulateTritanopia(color);
    case 'achromatopsia':
      return simulateAchromatopsia(color);
    default:
      return color;
  }
}

/**
 * Apply color blind filter to the entire page using CSS filters
 * This is a simpler approach that uses SVG filters
 */
export function applyColorBlindFilter(type: ColorBlindType): void {
  removeColorBlindFilter();

  if (type === 'none') return;

  // Create SVG filter element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'colorblind-filter';
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';

  let filterContent = '';

  switch (type) {
    case 'deuteranopia':
      filterContent = `
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0
                                               0.7 0.3 0 0 0
                                               0 0.3 0.7 0 0
                                               0 0 0 1 0"/>
        </filter>
      `;
      break;
    case 'protanopia':
      filterContent = `
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0
                                               0.558 0.442 0 0 0
                                               0 0.242 0.758 0 0
                                               0 0 0 1 0"/>
        </filter>
      `;
      break;
    case 'tritanopia':
      filterContent = `
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0
                                               0 0.433 0.567 0 0
                                               0 0.475 0.525 0 0
                                               0 0 0 1 0"/>
        </filter>
      `;
      break;
    case 'achromatopsia':
      filterContent = `
        <filter id="achromatopsia">
          <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0
                                               0.299 0.587 0.114 0 0
                                               0.299 0.587 0.114 0 0
                                               0 0 0 1 0"/>
        </filter>
      `;
      break;
  }

  svg.innerHTML = filterContent;
  document.body.appendChild(svg);

  // Apply filter to root element
  document.documentElement.style.filter = `url(#${type})`;
}

/**
 * Remove color blind filter
 */
export function removeColorBlindFilter(): void {
  const existingFilter = document.getElementById('colorblind-filter');
  if (existingFilter) {
    existingFilter.remove();
  }
  document.documentElement.style.filter = '';
}

/**
 * Get friendly name for color blind type
 */
export function getColorBlindTypeName(type: ColorBlindType): string {
  switch (type) {
    case 'deuteranopia':
      return 'Deuteranopia (Green Weak)';
    case 'protanopia':
      return 'Protanopia (Red Weak)';
    case 'tritanopia':
      return 'Tritanopia (Blue Weak)';
    case 'achromatopsia':
      return 'Achromatopsia (Total Color Blindness)';
    default:
      return 'None';
  }
}

/**
 * Get description for color blind type
 */
export function getColorBlindTypeDescription(type: ColorBlindType): string {
  switch (type) {
    case 'deuteranopia':
      return 'Most common form (6% of males). Difficulty distinguishing red and green.';
    case 'protanopia':
      return 'Common form (2% of males). Difficulty with red colors.';
    case 'tritanopia':
      return 'Rare form (<0.01%). Difficulty distinguishing blue and yellow.';
    case 'achromatopsia':
      return 'Very rare. Complete inability to perceive color (grayscale vision).';
    default:
      return 'Normal color vision';
  }
}

/**
 * Google Polyline encoding/decoding utilities
 * Efficiently encode and decode GPS coordinates for storage and transmission
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Encode an array of coordinates into a polyline string
 * Uses Google's Polyline encoding algorithm
 * @param coordinates Array of {lat, lng} objects
 * @param precision Encoding precision (default 5 for ~1m accuracy)
 * @returns Encoded polyline string
 */
export function encodePolyline(coordinates: LatLng[], precision: number = 5): string {
  if (!coordinates || coordinates.length === 0) {
    return '';
  }

  const factor = Math.pow(10, precision);
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    const lat = Math.round(coord.lat * factor);
    const lng = Math.round(coord.lng * factor);

    output += encodeValue(lat - prevLat);
    output += encodeValue(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return output;
}

/**
 * Decode a polyline string into an array of coordinates
 * @param encoded Encoded polyline string
 * @param precision Decoding precision (default 5)
 * @returns Array of {lat, lng} objects
 */
export function decodePolyline(encoded: string, precision: number = 5): LatLng[] {
  if (!encoded) {
    return [];
  }

  const factor = Math.pow(10, precision);
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    const latResult = decodeValue(encoded, index);
    lat += latResult.value;
    index = latResult.index;

    // Decode longitude
    const lngResult = decodeValue(encoded, index);
    lng += lngResult.value;
    index = lngResult.index;

    coordinates.push({
      lat: lat / factor,
      lng: lng / factor,
    });
  }

  return coordinates;
}

/**
 * Encode a single value for polyline encoding
 * @param value Number to encode
 * @returns Encoded string
 */
function encodeValue(value: number): string {
  let encoded = '';
  let num = value < 0 ? ~(value << 1) : value << 1;

  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }

  encoded += String.fromCharCode(num + 63);
  return encoded;
}

/**
 * Decode a single value from polyline string
 * @param encoded Encoded polyline string
 * @param index Current index in the string
 * @returns Decoded value and new index
 */
function decodeValue(encoded: string, index: number): { value: number; index: number } {
  let byte = 0;
  let shift = 0;
  let result = 0;

  do {
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  const value = result & 1 ? ~(result >> 1) : result >> 1;
  return { value, index };
}

/**
 * Simplify a polyline to reduce the number of points
 * Uses Ramer-Douglas-Peucker algorithm
 * @param coordinates Array of coordinates
 * @param tolerance Simplification tolerance (higher = more aggressive)
 * @returns Simplified array of coordinates
 */
export function simplifyPolyline(coordinates: LatLng[], tolerance: number = 0.00001): LatLng[] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  return ramerDouglasPeucker(coordinates, tolerance);
}

/**
 * Ramer-Douglas-Peucker algorithm for polyline simplification
 */
function ramerDouglasPeucker(points: LatLng[], epsilon: number): LatLng[] {
  if (points.length <= 2) {
    return points;
  }

  // Find the point with maximum distance from the line segment
  let maxDistance = 0;
  let maxIndex = 0;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const leftPart = ramerDouglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const rightPart = ramerDouglasPeucker(points.slice(maxIndex), epsilon);

    // Combine results (remove duplicate point at maxIndex)
    return leftPart.slice(0, -1).concat(rightPart);
  } else {
    // If max distance is less than epsilon, return only endpoints
    return [firstPoint, lastPoint];
  }
}

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function perpendicularDistance(point: LatLng, lineStart: LatLng, lineEnd: LatLng): number {
  const dx = lineEnd.lng - lineStart.lng;
  const dy = lineEnd.lat - lineStart.lat;

  if (dx === 0 && dy === 0) {
    // Line segment is actually a point
    return Math.sqrt(
      Math.pow(point.lng - lineStart.lng, 2) + Math.pow(point.lat - lineStart.lat, 2)
    );
  }

  const t =
    ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (dx * dx + dy * dy);

  if (t < 0) {
    // Beyond start of line segment
    return Math.sqrt(
      Math.pow(point.lng - lineStart.lng, 2) + Math.pow(point.lat - lineStart.lat, 2)
    );
  } else if (t > 1) {
    // Beyond end of line segment
    return Math.sqrt(
      Math.pow(point.lng - lineEnd.lng, 2) + Math.pow(point.lat - lineEnd.lat, 2)
    );
  }

  // Perpendicular distance
  const projectionLng = lineStart.lng + t * dx;
  const projectionLat = lineStart.lat + t * dy;

  return Math.sqrt(
    Math.pow(point.lng - projectionLng, 2) + Math.pow(point.lat - projectionLat, 2)
  );
}

/**
 * Get bounding box for a set of coordinates
 * @param coordinates Array of coordinates
 * @returns Bounding box {north, south, east, west}
 */
export function getBoundingBox(coordinates: LatLng[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = coordinates[0].lat;
  let south = coordinates[0].lat;
  let east = coordinates[0].lng;
  let west = coordinates[0].lng;

  for (const coord of coordinates) {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  }

  return { north, south, east, west };
}

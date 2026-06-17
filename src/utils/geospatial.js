/**
 * Check if a point is inside a polygon using the Ray Casting algorithm.
 * @param {Array} point [lng, lat]
 * @param {Array} polygon Array of [lng, lat] coordinates defining the polygon boundary
 * @returns {boolean} True if point is inside the polygon
 */
export function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false

  const x = point[0]
  const y = point[1]
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)

    if (intersect) inside = !inside
  }

  return inside
}

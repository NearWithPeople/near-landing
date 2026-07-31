export function isPointInPolygon(point, polygon) {
  if (!point || !polygon?.length || polygon.length < 3) return false

  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi

    if (intersects) inside = !inside
  }

  return inside
}

export function simplifyPolygonPoints(points, minDistancePx = 6) {
  if (points.length <= 2) return points

  const simplified = [points[0]]

  for (let index = 1; index < points.length; index += 1) {
    const previous = simplified[simplified.length - 1]
    const current = points[index]
    const distance = Math.hypot(current.x - previous.x, current.y - previous.y)

    if (distance >= minDistancePx) {
      simplified.push(current)
    }
  }

  return simplified
}

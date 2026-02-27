/**
 * 簡易 Haversine 距離（公里）
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 粗估 ETA 分鐘數（假設市區平均時速約 30 km/h）
 */
export function etaMinutes(km) {
  if (km <= 0) return 0
  return Math.max(1, Math.round((km / 30) * 60))
}

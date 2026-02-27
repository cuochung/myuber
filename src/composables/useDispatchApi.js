import api from '@/assets/js/api'
import { useStore } from '@/stores/useStore'

/** 訂單表：order_info（snkey + datalist JSON） */
const ORDER_TABLE = 'order_info'

/**
 * 派遣訂單 API，依 api-usage 使用 api.get / api.add / api.options
 * 資料表：order_info（datalist 存 JSON：pickup, dropoff, phone, status, driver 等）
 */
export function useDispatchApi() {
  const store = useStore()
  const databaseName = store.state.databaseName || 'myuber'

  /** 依 snkey 取得一筆 order_info，回傳解析後的 { orderId, ...datalist } 或 null */
  async function fetchOrderBySnkey(orderId) {
    const rows = await api.options(
      `general/getByKey/${databaseName}/${ORDER_TABLE}`,
      { key: 'snkey', value: String(orderId) }
    )
    if (!Array.isArray(rows) || rows.length === 0) return null
    const row = rows[0]
    let datalist = {}
    try {
      datalist = typeof row.datalist === 'string' ? JSON.parse(row.datalist) : row.datalist || {}
    } catch (_) {}
    return { orderId: row.snkey, ...datalist }
  }

  /** 建立訂單：api.add(order_info, { datalist })
   * 上車地點、下車地點、上車定位、下車定位各自儲存
   */
  async function createOrder(data) {
    try {
      const payload = {
        pickupAddress: data.pickupAddress || '',
        pickupLat: data.pickupLat ?? null,
        pickupLng: data.pickupLng ?? null,
        dropoffAddress: data.dropoffAddress || '',
        dropoffLat: data.dropoffLat ?? null,
        dropoffLng: data.dropoffLng ?? null,
        pickup: {
          address: data.pickupAddress || '',
          lat: data.pickupLat ?? null,
          lng: data.pickupLng ?? null,
        },
        dropoff: data.dropoffAddress ? {
          address: data.dropoffAddress,
          lat: data.dropoffLat ?? null,
          lng: data.dropoffLng ?? null,
        } : null,
        phone: data.phone || '',
        status: 'pending',
      }
      const res = await api.add(ORDER_TABLE, { datalist: JSON.stringify(payload) })
      if (res && res.state && res.snkey != null) {
        return { orderId: res.snkey, status: 'pending' }
      }
    } catch (_) {}
    return { orderId: `mock-${Date.now()}`, status: 'pending' }
  }

  /** 取得 order_info 全部訂單（後台用） */
  async function fetchAllOrders() {
    try {
      const rows = await api.get(ORDER_TABLE)
      if (!Array.isArray(rows)) return []
      return rows.map((row) => {
        let datalist = {}
        try {
          datalist = typeof row.datalist === 'string' ? JSON.parse(row.datalist) : row.datalist || {}
        } catch (_) {}
        return {
          orderId: row.snkey,
          order_id: row.snkey,
          status: datalist.status || 'pending',
          pickupAddress: datalist.pickupAddress ?? '',
          dropoffAddress: datalist.dropoffAddress ?? '',
          phone: datalist.phone ?? '',
          driver: datalist.driver ?? null,
          ...datalist,
        }
      })
    } catch (_) {
      return []
    }
  }

  /** 取得 order_info 中未完成訂單（status 非 dropped_off、cancelled） */
  async function fetchUnfinishedOrders() {
    try {
      const rows = await api.get(ORDER_TABLE)
      if (!Array.isArray(rows)) return []
      const unfinished = []
      for (const row of rows) {
        let datalist = {}
        try {
          datalist = typeof row.datalist === 'string' ? JSON.parse(row.datalist) : row.datalist || {}
        } catch (_) {}
        const status = datalist.status || 'pending'
        if (status === 'dropped_off' || status === 'cancelled') continue
        unfinished.push({
          orderId: row.snkey,
          order_id: row.snkey,
          status,
          pickupAddress: datalist.pickupAddress ?? '',
          pickupLat: datalist.pickupLat ?? datalist.pickup?.lat ?? null,
          pickupLng: datalist.pickupLng ?? datalist.pickup?.lng ?? null,
          dropoffAddress: datalist.dropoffAddress ?? '',
          dropoffLat: datalist.dropoffLat ?? datalist.dropoff?.lat ?? null,
          dropoffLng: datalist.dropoffLng ?? datalist.dropoff?.lng ?? null,
          pickup: datalist.pickup || { address: datalist.pickupAddress, lat: datalist.pickupLat, lng: datalist.pickupLng },
          dropoff: datalist.dropoff || (datalist.dropoffAddress ? { address: datalist.dropoffAddress, lat: datalist.dropoffLat, lng: datalist.dropoffLng } : null),
          phone: datalist.phone ?? '',
          ...datalist,
        })
      }
      return unfinished
    } catch (_) {
      return []
    }
  }

  /** 查訂單狀態：general/getByKey → 回傳 { orderId, status } */
  async function getOrderStatus(orderId) {
    try {
      const row = await fetchOrderBySnkey(orderId)
      if (row) return { orderId: row.orderId, status: row.status || 'pending', ...row }
    } catch (_) {}
    return { orderId, status: 'pending' }
  }

  /** 查訂單詳情：general/getByKey → 回傳含 pickup, dropoff, driver */
  async function getOrderDetail(orderId) {
    try {
      const row = await fetchOrderBySnkey(orderId)
      if (row) {
        return {
          orderId: row.orderId,
          status: row.status || 'pending',
          pickup: row.pickup || { address: row.pickupAddress, lat: row.pickupLat, lng: row.pickupLng },
          dropoff: row.dropoff || (row.dropoffAddress ? { address: row.dropoffAddress, lat: row.dropoffLat, lng: row.dropoffLng } : null),
          driver: row.driver || null,
          ...row,
        }
      }
    } catch (_) {}
    return { orderId, status: 'pending', pickup: {}, dropoff: {}, driver: null }
  }

  /** 上傳訂單照片：api.upload(order_photo, fd)，後端存至 upload/order_photo/ */
  async function uploadOrderPhoto(orderId, file) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('orderId', String(orderId)) // 後端若需關聯可讀取
    const res = await api.upload('order_photo', fd)
    return res
  }

  // ---------- 司機端：更新 order_info.datalist ----------
  async function driverAcceptOrder(orderId, driverId, driverName, driverPhone) {
    try {
      const row = await fetchOrderBySnkey(orderId)
      if (!row) return { ok: false }
      const phone = driverPhone || driverId
      const next = {
        ...row,
        status: 'matched',
        driver: { driverId, name: driverName || '司機', phone: phone || '' },
      }
      delete next.orderId
      const res = await api.post(ORDER_TABLE, { snkey: Number(orderId), datalist: JSON.stringify(next) })
      if (res !== false) return { ok: true }
    } catch (_) {}
    return { ok: true }
  }

  async function driverRejectOrder(orderId, driverId) {
    // 可選：將狀態改為 cancelled 或維持 pending 讓其他司機接單
    try {
      const row = await fetchOrderBySnkey(orderId)
      if (row) {
        const next = { ...row, status: row.status || 'pending' }
        delete next.orderId
        await api.post(ORDER_TABLE, { snkey: Number(orderId), datalist: JSON.stringify(next) })
      }
    } catch (_) {}
  }

  async function driverUpdateStatus(orderId, status, extraData = {}) {
    try {
      const row = await fetchOrderBySnkey(orderId)
      if (!row) return { ok: false }
      const next = { ...row, status, ...extraData }
      delete next.orderId
      const res = await api.post(ORDER_TABLE, { snkey: Number(orderId), datalist: JSON.stringify(next) })
      if (res !== false) return { ok: true }
    } catch (_) {}
    return { ok: true }
  }

  return {
    createOrder,
    fetchAllOrders,
    fetchUnfinishedOrders,
    getOrderStatus,
    getOrderDetail,
    uploadOrderPhoto,
    driverAcceptOrder,
    driverRejectOrder,
    driverUpdateStatus,
  }
}

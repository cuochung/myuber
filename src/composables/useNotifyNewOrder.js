/**
 * 顧客下單後通知司機（發送 order_created 至 WebSocket）
 */
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${location.hostname}:3001`

export function useNotifyNewOrder() {
  function notify(payload) {
    const url = `${WS_URL}?role=customer&id=${encodeURIComponent(payload.phone || 'guest')}`
    const ws = new WebSocket(url)
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'order_created',
        orderId: payload.orderId,
        order_id: payload.orderId,
        pickupAddress: payload.pickupAddress,
        pickupLat: payload.pickupLat,
        pickupLng: payload.pickupLng,
        pickup: payload.pickup,
        dropoff: payload.dropoff,
        ...payload,
      }))
      ws.close()
    }
    ws.onerror = () => ws.close()
  }

  return { notify }
}

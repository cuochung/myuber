import { ref, onUnmounted } from 'vue'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${location.hostname}:3001`

/**
 * 司機端 WebSocket：收新單、送 driver_location
 * @param {Ref<string>|string} driverId
 * @param {(msg: object) => void} onNewOrder
 * @returns { { ws, connected, connect, disconnect, sendLocation } }
 */
export function useDriverSocket(driverId, onNewOrder) {
  const ws = ref(null)
  const connected = ref(false)
  let pingTimer = null

  function connect() {
    const id = typeof driverId === 'function' ? driverId() : driverId
    if (!id) return
    const url = `${WS_URL}?role=driver&id=${encodeURIComponent(id)}`
    const socket = new WebSocket(url)
    ws.value = socket

    socket.onopen = () => {
      connected.value = true
      pingTimer = setInterval(() => {
        if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'ping' }))
      }, 15000)
    }

    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'pong') return
        if (msg.type === 'new_order') onNewOrder(msg)
      } catch (_) {}
    }

    socket.onclose = () => {
      connected.value = false
      if (pingTimer) clearInterval(pingTimer)
    }

    socket.onerror = () => {
      connected.value = false
    }
  }

  function sendLocation(orderId, lat, lng) {
    const socket = ws.value
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({ type: 'driver_location', orderId, lat, lng }))
    }
  }

  function disconnect() {
    if (pingTimer) clearInterval(pingTimer)
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    connected.value = false
  }

  onUnmounted(() => disconnect())

  return { ws, connected, connect, disconnect, sendLocation }
}

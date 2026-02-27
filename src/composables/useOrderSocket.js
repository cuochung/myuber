import { ref, onUnmounted } from 'vue'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${location.hostname}:3001`

/**
 * 訂閱單一訂單的 WebSocket（顧客端：配對結果、司機位置）
 * @param {Ref<string>|string} orderId
 * @param {Ref<string>|string} customerId
 * @param {(msg: object) => void} onMessage
 */
export function useOrderSocket(orderId, customerId, onMessage) {
  const ws = ref(null)
  const connected = ref(false)
  let pingTimer = null

  function connect() {
    const oid = typeof orderId === 'function' ? orderId() : orderId
    const cid = typeof customerId === 'function' ? customerId() : customerId
    if (!oid || !cid) return
    const url = `${WS_URL}?role=customer&id=${encodeURIComponent(cid)}&orderId=${encodeURIComponent(oid)}`
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
        onMessage(msg)
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

  function disconnect() {
    if (pingTimer) clearInterval(pingTimer)
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    connected.value = false
  }

  onUnmounted(() => disconnect())

  return { ws, connected, connect, disconnect }
}

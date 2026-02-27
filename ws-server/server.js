/**
 * 派遣系統 WebSocket 服務
 * 用途：新單通知司機、配對結果推播顧客、司機位置更新
 * order_info 有新資料時，後端可 POST /broadcast-new-order 推播給司機
 */
import http from 'http'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.WS_PORT) || 3001

const server = http.createServer((req, res) => {
  if (req.headers.upgrade === 'websocket') return
  if (req.method === 'POST' && req.url === '/broadcast-new-order') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {}
        const count = channels.drivers.size
        broadcastToDrivers({ type: 'new_order', ...payload })
        console.log(`[WS] 收到新單 broadcast orderId=${payload.orderId ?? payload.order_id}，已推播給 ${count} 位司機`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server })

// 依角色分群：driverIds / customerIds，或依訂單訂閱
const channels = {
  drivers: new Map(),   // driverId -> WebSocket
  customers: new Map(), // customerId -> WebSocket
  orders: new Map(),    // orderId -> Set<WebSocket>
}

function broadcast(channelKey, id, payload) {
  const set = channelKey === 'drivers' ? channels.drivers : channels.customers
  const ws = id ? set.get(id) : null
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(payload))
  }
}

function broadcastToDrivers(payload) {
  channels.drivers.forEach((ws) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(payload))
  })
}

function broadcastToOrder(orderId, payload) {
  const set = channels.orders.get(orderId)
  if (set) {
    set.forEach((ws) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(payload))
    })
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const role = url.searchParams.get('role')   // driver | customer
  const id = url.searchParams.get('id')      // driverId / customerId
  const orderId = url.searchParams.get('orderId')

  if (role === 'driver' && id) {
    channels.drivers.set(id, ws)
    console.log(`[WS] 司機 ${id} 已連線，目前共 ${channels.drivers.size} 位司機`)
  } else if (role === 'customer' && id) {
    channels.customers.set(id, ws)
  }
  if (orderId) {
    if (!channels.orders.has(orderId)) channels.orders.set(orderId, new Set())
    channels.orders.get(orderId).add(ws)
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      switch (msg.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', at: Date.now() }))
          break
        case 'driver_location':
          if (msg.orderId) broadcastToOrder(msg.orderId, { type: 'driver_location', ...msg })
          break
        case 'order_created':
          broadcastToDrivers({ type: 'new_order', ...msg })
          break
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'unknown type' }))
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }))
    }
  })

  ws.on('close', () => {
    if (role === 'driver' && id) channels.drivers.delete(id)
    if (role === 'customer' && id) channels.customers.delete(id)
    if (orderId && channels.orders.has(orderId)) {
      channels.orders.get(orderId).delete(ws)
      if (channels.orders.get(orderId).size === 0) channels.orders.delete(orderId)
    }
  })
})

server.listen(PORT, () => {
  console.log(`[WS] 派遣 WebSocket 服務已啟動 ws://0.0.0.0:${PORT}`)
  console.log(`[WS] 後端可 POST http://localhost:${PORT}/broadcast-new-order 推播新單給司機`)
})

export { broadcast, broadcastToDrivers, broadcastToOrder }

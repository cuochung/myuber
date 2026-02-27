# 派遣系統 WebSocket 服務

Node.js 撰寫的即時通道，供「新單通知司機」、「配對結果推播顧客」、「司機位置更新」使用。

## 安裝與啟動

```bash
cd ws-server
npm install
npm start
```

開發時可加自動重啟：

```bash
npm run dev
```

## 環境變數

| 變數 | 說明 | 預設 |
|------|------|------|
| `WS_PORT` | 監聽埠 | `3001` |

## 連線方式

前端以 URL 參數區分角色與訂單，例如：

- 司機：`ws://localhost:3001?role=driver&id=司機ID`
- 顧客：`ws://localhost:3001?role=customer&id=顧客ID`
- 訂閱單筆訂單：`ws://localhost:3001?role=customer&id=顧客ID&orderId=訂單ID`

## 訊息格式（JSON）

- **type: `ping`** → 伺服器回 **`pong`**
- **type: `driver_location`** → 司機上傳位置，需帶 `orderId`，伺服器轉發給該訂單訂閱者
- **type: `order_created`** → 前端或後端發送新單，伺服器轉發給所有已連線司機（`new_order`）

## 後端推播新單（order_info 有新資料時）

當 **order_info** 有新訂單時，後端可 POST 至本服務，司機端會即時收到訂單資訊：

```
POST http://localhost:3001/broadcast-new-order
Content-Type: application/json

{
  "orderId": 123,
  "order_id": 123,
  "pickupAddress": "台北市...",
  "pickupLat": 25.04,
  "pickupLng": 121.55,
  "pickup": { "address": "...", "lat": 25.04, "lng": 121.55 },
  "dropoff": { "address": "...", "lat": 25.05, "lng": 121.56 },
  "phone": "0912345678"
}
```

CI4 在 `order_info` 新增資料後，可呼叫此端點，司機端 WebSocket 會收到 `type: 'new_order'` 的訊息。

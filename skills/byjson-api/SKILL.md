---
name: byjson-api
description: CI4 Byjson 控制器 API 使用規範。用於查詢 datalist（JSON）格式的資料表，支援日期區間、key-value 搜尋等。當需要依日期區間查詢、datalist 內 key 搜尋、或使用 getZoneData/searchByKeyValue 時參考。
---

# Byjson API 使用規範

CI4 Byjson 控制器提供對 **datalist（JSON 欄位）** 結構資料表的進階查詢。表結構為 `snkey` + `datalist`（TEXT/JSON）。

## 共通設定

- **Method**：POST
- **URL 格式**：`byjson/{methodName}/{databaseName}/{sheetName}`
- **Content-Type**：application/x-www-form-urlencoded（前端用 `qs.stringify` 傳送）

## API 方法總覽

| 方法 | 用途 |
|------|------|
| getZoneData | 依 datalist 內日期欄位做區間查詢 |
| searchDataInclude | datalist 包含指定 searchKey（多 key 需同時滿足） |
| searchDataAndDate | 日期區間 + searchKey（需 dateKey 對應表） |
| searchByKeyValue | key = value 精準搜尋 |
| searchIncludeByKeyValue | key like value 模糊搜尋 |

---

## 1. getZoneData — 日期區間查詢

**適用**：依 datalist 內某日期欄位篩選區間內記錄。

**URL**：`POST byjson/getZoneData/{databaseName}/{sheetName}`

**POST 參數**：

| 參數 | 型別 | 說明 |
|------|------|------|
| key | string | datalist 內日期欄位名稱（如 start_date、out_date） |
| start | string | 區間起日，YYYY-MM-DD |
| end | string | 區間迄日，YYYY-MM-DD |

**支援格式**：YYYY-MM-DD、YYYY/MM/DD

**範例**：取得 start_date 在 2026-02-01～2026-02-29 的記錄

```javascript
import api from '@/assets/js/api'
import { useStore } from '@/stores/useStore'

const store = useStore()
const databaseName = store.state.databaseName

const data = await api.options(
  `byjson/getZoneData/${databaseName}/resident_schedule`,
  { key: 'start_date', start: '2000-01-01', end: '2026-02-29' }
)
// 回傳 [{ snkey, datalist }, ...]
```

---

## 2. searchDataInclude — 包含關鍵字搜尋

**適用**：datalist 內包含指定 key 或值；多個 searchKey 時需**同時滿足**。

**URL**：`POST byjson/searchDataInclude/{databaseName}/{sheetName}`

**POST 參數**：

| 參數 | 型別 | 說明 |
|------|------|------|
| searchKey | array | 要搜尋的關鍵字陣列 |

**範例**：

```javascript
const data = await api.options(
  `byjson/searchDataInclude/${databaseName}/user`,
  { searchKey: ['user_snkey', 'schedule_type'] }
)
```

---

## 3. searchDataAndDate — 日期區間 + searchKey

**限制**：dateKey 對應表僅含 `export`(out_date)、`import`(in_date)、`twohand`(th_in_date)、`change`(ch_date)、`fix`(f_date)。**sheetName 需在上述對應內**才會套用日期條件。

**URL**：`POST byjson/searchDataAndDate/{databaseName}/{sheetName}`

**POST 參數**：

| 參數 | 型別 | 說明 |
|------|------|------|
| startDate | string | 區間起日 |
| endDate | string | 區間迄日 |
| searchKey | array | 可選，額外搜尋關鍵字 |

---

## 4. searchByKeyValue — 精準 key = value

**URL**：`POST byjson/searchByKeyValue/{databaseName}/{sheetName}`

**POST 參數**：

| 參數 | 型別 | 說明 |
|------|------|------|
| key | string | datalist 內欄位名稱 |
| value | string | 精準匹配值 |

**範例**：

```javascript
const data = await api.options(
  `byjson/searchByKeyValue/${databaseName}/resident_schedule`,
  { key: 'user_snkey', value: '1' }
)
```

---

## 5. searchIncludeByKeyValue — 模糊 key like value

**URL**：`POST byjson/searchIncludeByKeyValue/{databaseName}/{sheetName}`

**POST 參數**：與 searchByKeyValue 相同，改為 `LIKE '%value%'`。

---

## 前端呼叫 pattern

使用 `api.options(url, data)`，`url` 為相對於 baseURL 的路徑：

```javascript
import api from '@/assets/js/api'
import { useStore } from '@/stores/useStore'

const store = useStore()
const db = store.state.databaseName
const sheet = 'resident_schedule'

// getZoneData
const list = await api.options(
  `byjson/getZoneData/${db}/${sheet}`,
  { key: 'start_date', start: '2026-02-01', end: '2026-02-29' }
)

// searchByKeyValue
const byUser = await api.options(
  `byjson/searchByKeyValue/${db}/${sheet}`,
  { key: 'user_snkey', value: '1' }
)
```

---

## 注意事項

1. **getZoneData** 適合 datalist 含日期欄位的表（如 start_date、out_date）；回傳 `snkey` + `datalist`。
2. **searchDataAndDate** 的日期欄位由後端 dateKey 決定，未對應的 sheetName 不會套用日期條件。
3. datalist 為 JSON 字串，前端需 `JSON.parse(row.datalist)` 解析。

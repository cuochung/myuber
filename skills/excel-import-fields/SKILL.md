---
name: excel-import-fields
description: 匯入 Excel 並寫入伺服器資料庫時，若欄位名為中文須轉成英文。當實作或修改 Excel 匯入、建構到後端資料庫、欄位對應時使用。
---

# Excel 匯入欄位：中文轉英文

匯入 Excel 並建構到伺服器資料庫時，**欄位名稱若為中文，必須轉成英文** 再送給後端，以符合資料庫／API 欄位命名。

## 規則

1. **送給後端／資料庫的 key 一律用英文**  
   Excel 表頭可以是中文（方便使用者），但組裝成 `datalist` 或 API payload 時，物件的 **key 必須是英文**。

2. **建立欄位對照**  
   在匯入流程中維護「Excel 欄位名（中文）」→「資料庫／API 欄位名（英文）」的對照，讀取 Excel 時依對照轉成英文 key 再組裝資料。

3. **對照表建議放在同一檔案或常數**  
   可在該匯入元件內定義 `FIELD_MAP` 或 `columnMapping`，例如：
   - `機台編號` → `machineNumber` 或專案實際欄位名
   - `機台名稱` → `machineName`
   - `生產優先` → `priority` 或專案實際欄位名  
   實際 key 以專案後端／資料表為準。

## 流程

1. 讀取 Excel 表頭與列資料（表頭可能為中文）。
2. 依對照表將每一列的 key 從中文轉成英文，組成單筆資料物件。
3. 將多筆「英文 key」的物件陣列送給 API（如 `api.add`、`api.addMulti` 等）寫入資料庫。

## 範例概念

```javascript
// 欄位對照：Excel 表頭（中文） → 後端欄位（英文）
const FIELD_MAP = {
  '機台編號': 'machineNumber',
  '機台名稱': 'machineName',
  '週邊機台': 'adjacentMachines',
  '建立時間': 'createTime'
}

// 單筆列資料轉成後端格式
function rowToRecord(row) {
  const record = {}
  for (const [chineseKey, value] of Object.entries(row)) {
    const enKey = FIELD_MAP[chineseKey] ?? chineseKey
    record[enKey] = value
  }
  return record
}

// 匯入多筆時
const records = excelRows.map(row => rowToRecord(row))
await api.addMulti('machine', records)
```

未在 `FIELD_MAP` 中的欄位可保留原 key（若後端接受）或略過，依專案約定。

## 何時使用本 Skill

- 實作或修改「從 Excel 匯入並寫入資料庫」功能時。
- 討論或修改「Excel 欄位」與「後端／資料庫欄位」對應時。
- 後端回傳錯誤顯示欄位不存在或型別錯誤，需檢查 payload 的 key 是否為英文時。

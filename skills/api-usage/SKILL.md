---
name: api-usage
description: myuber 專案的 API 使用規範和方法。定義如何使用 api.js 模組進行資料庫操作、檔案上傳等。當需要進行資料庫查詢、新增、更新、刪除操作，或呼叫後端 API 時使用。
---

# myuber API 使用規範

本 skill 定義了 myuber 專案中 API 模組的使用方法和最佳實踐。

## API 模組路徑

**統一使用**: `src/assets/js/api.js`

所有的資料庫操作都必須透過此 API 模組進行，**不要直接使用 axios**。

## 引入方式

```javascript
import api from '@/assets/js/api'
```

## API 方法總覽

| 方法 | 用途 | 參數 |
|------|------|------|
| `api.get(database)` | 取得所有資料 | database: 資料表名稱 |
| `api.add(database, data)` | 新增單筆資料 | database: 資料表名稱<br>data: 資料物件 |
| `api.post(database, data)` | 編輯/更新資料 | database: 資料表名稱<br>data: 資料物件 |
| `api.delete(database, data)` | 刪除資料 | database: 資料表名稱<br>data: 資料物件（可選） |
| `api.options(url, data)` | 自定義 URL 呼叫 | url: 自定義路徑<br>data: 資料物件（可選） |
| `api.upload(database, fd)` | 上傳單個檔案 | database: 資料表名稱<br>fd: FormData 物件 |
| `api.uploadMulti(database, fd)` | 上傳多個檔案 | database: 資料表名稱<br>fd: FormData 物件 |
| `api.addMulti(database, data)` | 新增多筆資料 | database: 資料表名稱<br>data: 資料陣列 |
| `api.rustAddMulti(sheetName, data)` | Rust 伺服器新增多筆,用於單次1000筆以上寫入時才考慮使用 | sheetName: 表名稱<br>data: 資料陣列 |

## 使用範例

### 1. 取得資料 (GET)

```javascript
// 取得所有人員資料
const result = await api.get('personnel')
console.log(result) // 返回資料陣列
```

### 2. 新增單筆資料 (ADD)

```javascript
// 新增一筆人員資料
const newPersonnel = {
  name: '張三',
  department: '生產部',
  employeeId: 'E001'
}
const result = await api.add('personnel', newPersonnel)
```

### 3. 更新資料 (POST)

```javascript
// 更新人員資料（需包含 id）
const updateData = {
  id: 1,
  name: '李四',
  department: '品管部',
  employeeId: 'E001'
}
const result = await api.post('personnel', updateData)
```

### 4. 刪除資料 (DELETE)

```javascript
// 刪除指定 id 的資料
const deleteData = { id: 1 }
const result = await api.delete('personnel', deleteData)
```

### 5. 自定義 URL (OPTIONS)

當需要呼叫特殊的後端端點時使用：

```javascript
// 呼叫自定義路徑
const result = await api.options('custom/endpoint/path', {
  param1: 'value1',
  param2: 'value2'
})
```

### 6. 上傳單個檔案 (UPLOAD)

```javascript
// 建立 FormData
const formData = new FormData()
formData.append('file', fileObject)
formData.append('additionalData', 'value')

// 上傳檔案
const result = await api.upload('personnel', formData)
```

### 7. 上傳多個檔案 (UPLOAD MULTI)

```javascript
// 建立 FormData 並附加多個檔案
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('files', file3)

// 上傳多個檔案
const result = await api.uploadMulti('personnel', formData)
```

### 8. 新增多筆資料 (ADD MULTI)

```javascript
// 批次新增人員資料
const multiData = [
  { name: '張三', department: '生產部', employeeId: 'E001' },
  { name: '李四', department: '品管部', employeeId: 'E002' },
  { name: '王五', department: '倉儲部', employeeId: 'E003' }
]
const result = await api.addMulti('personnel', multiData)
```

### 9. Rust 伺服器批次新增 (RUST ADD MULTI)

用於高效能的大量資料匯入：

```javascript
// 使用 Rust 伺服器批次新增
const largeDataset = [
  { name: '張三', department: '生產部' },
  // ... 數千筆資料
]
const result = await api.rustAddMulti('personnel', largeDataset)
```

## 資料表名稱參考

專案使用的資料庫名稱為 `myuber`，已透過 Pinia store 統一管理。

**常用資料表名稱**：
- `personnel` - 人員資料
- `scheduling` - 排班資料
- `machine` - 機台資料
- `operator` - 操作員資料
- `productCode` - 產品代碼資料

**說明**：API 模組會自動組合完整路徑，例如：
- `api.get('personnel')` → `general/getAll/myuber/personnel`
- `api.add('scheduling', data)` → `general/add/myuber/scheduling`

## API 特性

### 1. 自動 Loading 效果

API 模組整合了 Pinia store，會自動處理 loading 狀態：
- 請求開始：`store.state.loading = true`
- 請求完成：`store.state.loading = false`（延遲 300ms）

### 2. 內建錯誤處理

API 模組包含完整的錯誤處理機制：
- **本地網路錯誤**：檢測 `navigator.onLine`，返回 "LOCALNetwork_ERROR"
- **伺服器連線錯誤**：檢測 `ERR_NETWORK`，顯示 "伺服器未正常連結"
- **404 錯誤**：記錄 "你要找的頁面不存在"
- **500 錯誤**：記錄 "程式發生問題"

### 3. 統一配置管理

API 配置透過 Pinia store 集中管理：
- `store.state.base_url` - API 基礎路徑
- `store.state.databaseName` - 資料庫名稱（預設：myuber）
- `store.state.rustBaseURL` - Rust 伺服器路徑
- `store.state.rustApiToken` - Rust API Token

### 4. 最小顯示時間

為確保使用者體驗流暢，loading 動畫至少顯示 300ms：
```javascript
setTimeout(() => {
  store.state.loading = false;
  resolve(response);
}, 300);
```

## 最佳實踐

### ✅ 正確做法

```javascript
// 1. 使用 try-catch 處理錯誤
try {
  const result = await api.get('personnel')
  if (result) {
    // 處理資料
  }
} catch (error) {
  console.error('載入資料失敗', error)
}

// 2. 更新資料時確保包含 id
const updateData = {
  id: existingData.id,
  ...newValues
}
await api.post('personnel', updateData)

// 3. 刪除前先確認
proxy.$swal({
  title: '確認要刪除嗎?',
  text: '此操作無法復原',
  icon: 'warning',
  showConfirmButton: true,
  showCancelButton: true
}).then(async (result) => {
  if (result.isConfirmed) {
    await api.delete('personnel', { id: itemId })
  }
})
```

### ❌ 錯誤做法

```javascript
// 1. 不要直接使用 axios（應使用 api 模組）
import axios from 'axios'
const result = await axios.get('/api/personnel') // ❌ 錯誤

// 2. 不要忘記錯誤處理
const result = await api.get('personnel') // ❌ 缺少 try-catch

// 3. 更新時不要遺漏 id
const updateData = { name: '新名字' } // ❌ 缺少 id
await api.post('personnel', updateData)
```

## 效能考量

### 選擇適當的方法

- **小量資料（< 100 筆）**: 使用 `api.addMulti()`
- **大量資料（> 1000 筆）**: 使用 `api.rustAddMulti()` 以獲得更好效能
- **即時資料**: 使用 `api.get()` 取得最新資料
- **檔案上傳**: 根據檔案數量選擇 `api.upload()` 或 `api.uploadMulti()`

## 除錯建議

當 API 呼叫失敗時，檢查：

1. **網路連線**: 確認 `navigator.onLine` 狀態
2. **後端服務**: 確認後端伺服器正常運行
3. **資料格式**: 確認傳送的資料格式正確
4. **資料表名稱**: 確認使用正確的資料表名稱
5. **Console 訊息**: 查看 console.log 的錯誤訊息

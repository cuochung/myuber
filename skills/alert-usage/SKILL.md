---
name: alert-usage
description: 專案的 SweetAlert 使用規範。包含確認對話框、成功訊息、錯誤提示、警告訊息等標準寫法。當需要顯示對話框、確認操作、顯示提示訊息、刪除確認時使用。
---

# SweetAlert 使用規範

本 skill 定義了 系統專案中 SweetAlert 的標準使用方式和最佳實踐。

## 引入方式

在 Vue 3 Composition API 中：

```javascript
import { getCurrentInstance } from 'vue'

// 在 setup() 中
const { proxy } = getCurrentInstance()

// 使用
proxy.$swal({ ... })
```

## 標準對話框類型

### 1. 確認刪除對話框

用於刪除資料前的確認，這是最常用的對話框類型。

```javascript
proxy.$swal({
    title: '確認要刪除嗎?',
    text: '此操作無法復原',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
}).then((result) => {
    if (result.isConfirmed) {
        // 執行刪除操作
        await api.delete('tableName', { id: itemId })
    }
})
```

**固定參數**：
- `toast: false` - 使用完整對話框
- `timer: null` - 不自動關閉
- `showConfirmButton: true` - 顯示確認按鈕
- `showCancelButton: true` - 顯示取消按鈕
- `position: 'center'` - 置中顯示

**可調整參數**：
- `title` - 根據刪除對象調整（如 "確認要刪除此人員嗎?"）
- `text` - 根據需要調整提示內容
- `icon` - 刪除操作固定使用 `'warning'`

### 2. 一般確認對話框

用於需要使用者確認的重要操作（非刪除）。

```javascript
proxy.$swal({
    title: '確認要執行此操作嗎?',
    text: '請確認您的選擇',
    icon: 'question',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: true,
    position: 'center'
}).then((result) => {
    if (result.isConfirmed) {
        // 執行操作
    }
})
```

**適用場景**：
- 提交表單前確認
- 匯出資料確認
- 重要設定變更確認
- 批次操作確認

### 3. 成功訊息

用於操作成功後的提示。

```javascript
proxy.$swal({
    title: '操作成功',
    text: '資料已成功儲存',
    icon: 'success',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: false,
    position: 'center'
})
```

**常用標題**：
- "新增成功"
- "更新成功"
- "儲存成功"
- "操作完成"

### 4. 錯誤訊息

用於操作失敗或錯誤的提示。

```javascript
proxy.$swal({
    title: '操作失敗',
    text: '資料儲存時發生錯誤，請稍後再試',
    icon: 'error',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: false,
    position: 'center'
})
```

**常用標題**：
- "操作失敗"
- "錯誤"
- "無法完成操作"
- "發生錯誤"

### 5. 警告訊息

用於提醒使用者注意事項。

```javascript
proxy.$swal({
    title: '注意',
    text: '此操作可能需要較長時間，請耐心等候',
    icon: 'warning',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: false,
    position: 'center'
})
```

**適用場景**：
- 重要提醒
- 操作前的注意事項
- 潛在風險提示

### 6. 資訊訊息

用於一般資訊提示。

```javascript
proxy.$swal({
    title: '提示',
    text: '請先選擇要操作的項目',
    icon: 'info',
    toast: false,
    timer: null,
    showConfirmButton: true,
    showCancelButton: false,
    position: 'center'
})
```

**適用場景**：
- 操作指引
- 功能說明
- 一般提示

## Icon 類型總覽

| Icon 值 | 用途 | 顏色 |
|---------|------|------|
| `'success'` | 成功訊息 | 綠色 ✓ |
| `'error'` | 錯誤訊息 | 紅色 ✗ |
| `'warning'` | 警告/刪除確認 | 橘色 ⚠ |
| `'info'` | 資訊提示 | 藍色 ℹ |
| `'question'` | 一般確認 | 灰色 ? |

## 完整使用範例

### 範例 1: 刪除人員資料

```javascript
const deletePerson = async (personId) => {
    const result = await proxy.$swal({
        title: '確認要刪除此人員嗎?',
        text: '此操作無法復原',
        icon: 'warning',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: true,
        position: 'center'
    })
    
    if (result.isConfirmed) {
        try {
            await api.delete('personnel', { id: personId })
            
            proxy.$swal({
                title: '刪除成功',
                text: '人員資料已刪除',
                icon: 'success',
                toast: false,
                timer: null,
                showConfirmButton: true,
                showCancelButton: false,
                position: 'center'
            })
            
            // 重新載入資料
            await loadData()
        } catch (error) {
            proxy.$swal({
                title: '刪除失敗',
                text: '刪除人員資料時發生錯誤',
                icon: 'error',
                toast: false,
                timer: null,
                showConfirmButton: true,
                showCancelButton: false,
                position: 'center'
            })
        }
    }
}
```

### 範例 2: 儲存表單資料

```javascript
const saveForm = async () => {
    // 驗證表單
    if (!validateForm()) {
        proxy.$swal({
            title: '請檢查輸入',
            text: '請確認所有必填欄位都已填寫',
            icon: 'warning',
            toast: false,
            timer: null,
            showConfirmButton: true,
            showCancelButton: false,
            position: 'center'
        })
        return
    }
    
    try {
        await api.post('personnel', formData.value)
        
        proxy.$swal({
            title: '儲存成功',
            text: '資料已成功更新',
            icon: 'success',
            toast: false,
            timer: null,
            showConfirmButton: true,
            showCancelButton: false,
            position: 'center'
        })
    } catch (error) {
        proxy.$swal({
            title: '儲存失敗',
            text: error.message || '儲存資料時發生錯誤',
            icon: 'error',
            toast: false,
            timer: null,
            showConfirmButton: true,
            showCancelButton: false,
            position: 'center'
        })
    }
}
```

### 範例 3: 批次操作確認

```javascript
const batchDelete = async (selectedIds) => {
    if (selectedIds.length === 0) {
        proxy.$swal({
            title: '請選擇項目',
            text: '請先勾選要刪除的項目',
            icon: 'info',
            toast: false,
            timer: null,
            showConfirmButton: true,
            showCancelButton: false,
            position: 'center'
        })
        return
    }
    
    const result = await proxy.$swal({
        title: `確認要刪除 ${selectedIds.length} 筆資料嗎?`,
        text: '此操作無法復原',
        icon: 'warning',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: true,
        position: 'center'
    })
    
    if (result.isConfirmed) {
        // 執行批次刪除
        for (const id of selectedIds) {
            await api.delete('personnel', { id })
        }
        
        proxy.$swal({
            title: '刪除完成',
            text: `已成功刪除 ${selectedIds.length} 筆資料`,
            icon: 'success',
            toast: false,
            timer: null,
            showConfirmButton: true,
            showCancelButton: false,
            position: 'center'
        })
    }
}
```

## 參數快速參考

### 必要固定參數（不要修改）

```javascript
{
    toast: false,          // 使用完整對話框
    timer: null,          // 不自動關閉
    position: 'center'    // 置中顯示
}
```

### 確認類對話框（有取消按鈕）

```javascript
{
    showConfirmButton: true,
    showCancelButton: true    // 顯示取消按鈕
}
```

### 通知類對話框（無取消按鈕）

```javascript
{
    showConfirmButton: true,
    showCancelButton: false   // 不顯示取消按鈕
}
```

## 最佳實踐

### ✅ 正確做法

```javascript
// 1. 刪除操作一定要有確認對話框
const deleteItem = async (id) => {
    const result = await proxy.$swal({
        title: '確認要刪除嗎?',
        text: '此操作無法復原',
        icon: 'warning',
        toast: false,
        timer: null,
        showConfirmButton: true,
        showCancelButton: true,
        position: 'center'
    })
    
    if (result.isConfirmed) {
        await api.delete('tableName', { id })
    }
}

// 2. 操作完成後顯示結果
try {
    await api.post('tableName', data)
    proxy.$swal({
        title: '儲存成功',
        icon: 'success',
        // ... 其他參數
    })
} catch (error) {
    proxy.$swal({
        title: '儲存失敗',
        icon: 'error',
        // ... 其他參數
    })
}

// 3. 使用適當的 icon 類型
proxy.$swal({
    title: '確認要刪除嗎?',
    icon: 'warning',  // 刪除用 warning
    // ...
})
```

### ❌ 錯誤做法

```javascript
// 1. 刪除前沒有確認（危險！）
const deleteItem = async (id) => {
    await api.delete('tableName', { id })  // ❌ 沒有確認對話框
}

// 2. 修改固定參數
proxy.$swal({
    title: '確認要刪除嗎?',
    toast: true,      // ❌ 不要修改
    timer: 3000,      // ❌ 不要修改
    position: 'top'   // ❌ 不要修改
})

// 3. 使用錯誤的 icon
proxy.$swal({
    title: '確認要刪除嗎?',
    icon: 'success',  // ❌ 刪除應該用 warning
})

// 4. 確認對話框沒有取消按鈕
proxy.$swal({
    title: '確認要刪除嗎?',
    showCancelButton: false  // ❌ 確認操作應該要有取消按鈕
})
```

## 使用檢查清單

建立對話框前，請檢查：

- [ ] 是否為刪除操作？→ 必須使用確認對話框（icon: 'warning'）
- [ ] 是否為重要操作？→ 必須有確認對話框（showCancelButton: true）
- [ ] 是否為操作結果？→ 使用通知對話框（showCancelButton: false）
- [ ] Icon 類型是否正確？（success/error/warning/info/question）
- [ ] 固定參數是否保持不變？（toast/timer/position）
- [ ] Title 和 Text 是否清楚明確？

## 常見場景對照表

| 場景 | Icon | showCancelButton | 範例 Title |
|------|------|------------------|------------|
| 刪除確認 | warning | true | "確認要刪除嗎?" |
| 重要操作確認 | question | true | "確認要執行此操作嗎?" |
| 操作成功 | success | false | "儲存成功" |
| 操作失敗 | error | false | "操作失敗" |
| 表單驗證錯誤 | warning | false | "請檢查輸入" |
| 一般提示 | info | false | "提示" |
| 未選擇項目 | info | false | "請選擇項目" |

# 派遣系統 Views 架構

- **login/**：入口頁，選擇顧客端或司機端。
- **main/**：主布局（Main.vue），提供 `<router-view>` 給子路由。
- **customer/**：顧客端（Index 下單、Wait 等配對、Track 追蹤＋地圖＋傳照片）。
- **driver/**：司機端（Index 接單＋新單卡片接受/拒絕、Run 執行中＋地圖＋導航＋上車/下車）。

路由：`/` → `/login`；顧客端 `/main/customer`、`/main/customer/wait`、`/main/customer/track`；司機端 `/main/driver`、`/main/driver/run`。

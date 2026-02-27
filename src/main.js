import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

import "@/assets/css/mytransition.css"
import "@/assets/css/mystyle.css"
import "@/assets/css/sweetalert.css"

// Plugins
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

import axios from 'axios'
// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// Sweetalert2 全局配置
const sweetalert2Options = {
    confirmButtonColor: "#3085d6", // 確認按鈕顏色
    cancelButtonColor: "#d33",  // 取消按鈕顏色
    confirmButtonText: '確認',     // 確認按鈕文字
    cancelButtonText: '取消',      // 取消按鈕文字
    reverseButtons: true,          // 反轉按鈕順序
    // allowOutsideClick: false,      // 點擊外部不關閉
    customClass: {
        confirmButton: 'white',
        cancelButton: 'white'
    },
    // Toast 樣式配置
    toast: true,
    position: 'bottom',           // 顯示在下方
    showConfirmButton: false,     // 不顯示確認按鈕
    timer: 3000,                  // 3秒後自動關閉
    timerProgressBar: true        // 顯示進度條
}

const vuetify = createVuetify({
    components,
    directives,
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(VueSweetalert2, sweetalert2Options)

app.mount('#app')

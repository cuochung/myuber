import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('company', () => {
  // let setBaseUrl = "https://www.pddtvgame.com" //線上專用
  let setBaseUrl = "http://localhost" //localhost測試用
  
  const state = {
    verMsg: "2026.02.07.1",
    databaseName: "myuber", //資料庫名
    base_url: `${setBaseUrl}/myuberapi`, //線上專用指定去讀圖片或其他東西的位置

    rustBaseURL: `${setBaseUrl}:3000`, // Rust 伺服器 baseURL
    rustApiToken: "your-internal-secret-key", // Rust 伺服器 API Token

    loading: false, //載入中

    //暫存用資料
    cData: {},  //廠商資料
    pData: {},  //使用者

    usingItems: [], //處理中頁面暫存資料
    customerItems: [], //會員資料

    //功能名稱,樣式,key值,引用圖片,授權,icon圖片設定,
    authKeys: [
      {
        label: "出席一覽", class: "ma-1 white--text", color: "teal", keyName: 'attendance',
        image: new URL('@/assets/img/template_calender_j.jpg', import.meta.url).href,
        route: "/main/AttendanceCalendar",
        authKey: "attendance_key",
        icon: 'mdi-calendar-month',
      },
      {
        label: "病歷管理&維護", class: "ma-1", color: "blue", keyName: 'user',
        image: new URL('@/assets/img/computer_hakui_doctor_woman.png', import.meta.url).href,
        route: "/main/User",
        authKey: "user_key",
        icon: 'mdi-badge-account-horizontal',
      },
      {
        label: "人員管理", class: "ma-1 white--text", color: "purple", keyName: 'personnel',
        image: new URL('@/assets/img/taiin_miokuri.png', import.meta.url).href,
        route: "/main/Personnel",
        authKey: "personnel_key",
        icon: 'mdi-account',
      },
      
      {
        label: "登出", class: "ma-1 white--text", color: "dark", keyName: 'exit',
        image: new URL('@/assets/img/text_exit.png', import.meta.url).href,
        route: "/login",
        authKey: "exit_key",
        icon: 'mdi-logout',
      },
    ],
  }

  //全域toast multi功能;基本上只把要toast的暫存在pinia裡,其他都由PDDToastMultiV2Pinia去控制顯示結果,
  const toasts = ref([])
  const showToastMulti = (newToast) => {
    console.log('newToast',newToast)
    let finalToast = {
      ...newToast,
      timeStamp: Date.now(), //設定時間,用在顯示動畫的key使用,也可以拿來計算動畫剩餘時間
      active: true, //動畫是否執行
      closeTime: newToast.closeTime ? newToast.closeTime : 5
    }
    toasts.value.push(finalToast)

    setTimeout(() => {
      closeShowToastMulti(finalToast.timeStamp)
    }, finalToast.closeTime * 1000)
  }
  //關閉toast內容 for multi ver.
  const closeShowToastMulti = (timeStamp) => {
    toasts.value.some((i, index) => {
      let str = JSON.stringify(i)
      if (str.includes(String(timeStamp)) && i.active) {
        toasts.value.splice(index, 1)
      }
    })
  }
  //全域toast multi功能 end

  return {
    state, //暫存用的都放這裡
    toasts, showToastMulti, closeShowToastMulti,  //multi toast用的到
    // handleImageError,
  }
})

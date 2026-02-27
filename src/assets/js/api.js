/*在js裡可以直接取用pinia
之後的databaseName;axios.defaults.baseURL都統一放在pinia的state裡
*/
import { createApp } from 'vue'
import { createPinia } from 'pinia'
createApp().use(createPinia())
import { useStore } from '@/stores/useStore'
const store = useStore();
//在js裡可以直接取用pinia end

// axios 設定
import axios from 'axios'
import qs from "qs";

//axios基本設定 -> 及使用 instance取代axios 實例
const instance = axios.create({
  baseURL: store.state.base_url, //統一使用 vuex 的 store 裡的base_url
  // headers: { 'Content-Type': 'application/json' },
  // timeout: 10000
});


//執行前及執行前動作導入;例:動畫 //這裡重新宣告一次store,不然改變動畫沒反應
instance.interceptors.request.use(function (config) {
  // Do something before request is sent
  const store = useStore()  
  store.state.loading = true;
  return config;
}, function (error) {
  // Do something with request error
  const store = useStore()
  store.state.loading = false;
  return Promise.reject(error);
});

//執行前及執行後動作導入;例:動畫 //這裡重新宣告一次store,不然改變動畫沒反應
// Add a response interceptor
instance.interceptors.response.use(function (response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  const store = useStore()
  // 確保至少顯示 300ms 的 loading 效果，使動畫更流暢
  return new Promise(resolve => {
    setTimeout(() => {
      store.state.loading = false;
      resolve(response);
    }, 300);
  });
}, function (error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  const store = useStore()
  // 確保錯誤時也有適當的 loading 效果
  // return new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     store.state.loading = false;
  //     reject(error);
  //   }, 300);
  // });

  // alert('errorMsg:' + error)
  console.log('api error',error)

  //本地網路不通時,回傳 "network error"
  if (!navigator.onLine) {
    console.log("網路出了點問題，請重新連線後重整網頁");
    // store.showToastMulti({
    //   type: 'error',
    //   message: '網路出了點問題，請重新連線後重整網頁!!',
    //   closeTime: 5,
    // })

    return Promise.reject("LOCALNetwork_ERROR");
  }

  //伺服器未正常啟動時
  if (error.code == 'ERR_NETWORK'){
    console.log('伺服器未正常連結', error)
    // alert('伺服器未正常連結');
    // store.showToastMulti({
    //   type: 'error',
    //   message: '伺服器未正常連結!!',
    //   closeTime: 5,
    // })

    return Promise.reject("ERR_NETWORK");
  }

  //判斷伺服器回應狀況
  if (error.response) {
    switch (error.response.status) {
      case 404:
        console.log("你要找的頁面不存在")
        // store.showToastMulti({
        //   type: 'error',
        //   message: '請求不存在!!',
        //   closeTime: 5,
        // })

        break
      case 500:
        console.log("程式發生問題")
        // store.showToastMulti({
        //   type: 'error',
        //   message: '程式發生問題!!',
        //   closeTime: 5,
        // })

        // go to 500 page
        break
      default:
        console.log(error.message)
    }
  } 

  return Promise.reject(error);
});

var api = {
  //get data
  async get(database) {
    // console.log('run get', database)
    try {
      const get = await instance.post(`general/getAll/${store.state.databaseName}/${database}`)
      return get.data;
    }catch (err){
      console.log('err',err)
    }
  },

  //add data
  async add(database, data) {
    // console.log('run add')
    try {
      const get = await instance.post(`general/add/${store.state.databaseName}/${database}`, qs.stringify(data))
      return get.data;
    } catch (err) {
      console.log('err', err)
    }
    
  },

  //post data (edit , update)
  async post(database, data) {
    // console.log('run post')
    try {
      const get = await instance.post(`general/edit/${store.state.databaseName}/${database}`, qs.stringify(data))
      return get.data;
    } catch (err) {
      console.log('err', err)
    }

  },

  //delete data
  async delete(database, data = null) {
    console.log('run delete')
    try {
      const get = await instance.post(`general/delv3/${store.state.databaseName}/${database}`, qs.stringify(data))
      console.log('get', get)  
      return get.data;
    } catch (err) {
      console.log('err', err)
    }

  },

  //特別處理 url自定義
  async options(url, data = null) {
    // console.log('run options')
    try {
      const get = await instance.post(`${url}`, qs.stringify(data))
      return get.data;
    } catch (err) {
      console.log('err', err)
    }
  },

  // 自訂 URL 且 body 為 FormData（例如派遣訂單傳照片）
  async postFormData(url, formData) {
    try {
      const res = await instance.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch (err) {
      console.log('err', err)
      throw err
    }
  },


  //上傳檔案,單檔
  async upload(database, fd = null) {
    console.log('run upload single')
    try {
      const get = await instance.post(`general/upload/${store.state.databaseName}/${database}`, fd)
      return get.data;
    } catch (err) {
      console.log('err', err)
    }

  },

  //上傳檔案,多檔
  async uploadMulti(database, fd = null) {
    console.log('run fileUploadMulti', `general/fileUploadMulti/${store.state.databaseName}/${database}`)

    try {
      const get = await instance.post(`general/fileUploadMulti/${store.state.databaseName}/${database}`, fd)
      return get.data;
    } catch (err) {
      console.log('err', err)
    }

  },

  //刪除檔案,多檔
  async delFileMulti(database, datas = null) {
    console.log('run delFileMulti', `general/delFileMulti/${database}`, datas)
    try {
      const get = await instance.post(`general/delFileMulti/${database}`, qs.stringify(datas))
      return get.data;
    } catch (err) {
      console.log('err', err)
      throw err
    }
  },

  //新增多筆資料
  //addMulti data
  async addMulti(database, data) {
    // console.log('run addMulti')
    try {
      const get = await instance.post(`general/addMulti/${store.state.databaseName}/${database}`, qs.stringify(data))
      return get.data;
    } catch (err) {
      console.log('err', err)
    }

  },
  //修改多筆資料
  async editMulti(database, data) {
    // console.log('run editMulti')
    try {
      const get = await instance.post(`general/editMulti/${store.state.databaseName}/${database}`, qs.stringify(data))
      return get.data;
    } catch (err) {
      console.log('err', err)
    }
  },
  //刪除多筆資料
  async deleteMulti(database, data) {
    // console.log('run deleteMulti')
    try {
      const get = await instance.post(`general/delMultiv3/${store.state.databaseName}/${database}`, qs.stringify(data))
      return get.data;
    } catch (err) {
      console.log('err', err)
    }
  },

  // Rust 伺服器新增多筆資料
  // rustAddMulti: 發送資料到 Rust 伺服器
  // async rustAddMulti(sheetName, data) {
  //   console.log('run rustAddMulti', sheetName)
  //   try {
  //     // 從 store 取得 Rust 伺服器的設定
  //     const rustBaseURL = store.state.rustBaseURL

  //     // 組裝 requestBody
  //     const requestBody = {
  //       apiToken: store.state.rustApiToken,
  //       databaseName: store.state.databaseName,
  //       sheetName: sheetName,
  //       data: data
  //     }

  //     // 建立完整的 URL
  //     const url = `${rustBaseURL}/ingest`

  //     // 使用 axios 直接發送請求（不使用 instance，因為 baseURL 不同）
  //     const response = await axios.post(url, requestBody, {
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     })
  //     return response.data
  //   } catch (err) {
  //     console.log('rustAddMulti err', err)
  //     throw err
  //   }
  // },
}

export default api;
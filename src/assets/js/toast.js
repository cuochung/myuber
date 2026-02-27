import { createVNode, render } from 'vue'
import MyToast from '@/components/MyComponents/MyToast.vue'

let toastInstance = null

export default {
  install: (app) => {
    // 創建一個容器元素
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 創建 Toast 組件實例
    const vnode = createVNode(MyToast)
    render(vnode, container)
    toastInstance = vnode.component

    // 添加全局方法
    app.config.globalProperties.$toast = {
      addToast: toastInstance.exposed.addToast
    }
  }
}
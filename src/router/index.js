import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: { name: 'login' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '派遣系統' },
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('@/views/main/Main.vue'),
    meta: { title: '派遣系統' },
    children: [
      {
        path: 'customer',
        name: 'customer-home',
        component: () => import('@/views/customer/Index.vue'),
        meta: { title: '顧客端' },
      },
      {
        path: 'customer/wait',
        name: 'customer-wait',
        component: () => import('@/views/customer/Wait.vue'),
        meta: { title: '等待接單' },
      },
      {
        path: 'customer/track',
        name: 'customer-track',
        component: () => import('@/views/customer/Track.vue'),
        meta: { title: '訂單追蹤' },
      },
      {
        path: 'driver',
        name: 'driver-home',
        component: () => import('@/views/driver/Index.vue'),
        meta: { title: '司機端' },
      },
      {
        path: 'driver/run',
        name: 'driver-run',
        component: () => import('@/views/driver/Run.vue'),
        meta: { title: '執行中訂單' },
      },
      {
        path: 'admin',
        name: 'admin-home',
        component: () => import('@/views/admin/Index.vue'),
        meta: { title: '後台' },
      },
      {
        path: 'admin/orders',
        name: 'admin-orders',
        component: () => import('@/views/admin/Orders.vue'),
        meta: { title: '訂單管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'login' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    window.document.title = to.meta.title
  } else {
    window.document.title = '派遣系統'
  }
  next()
})

export default router

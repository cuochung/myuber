<template>
  <v-container class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'customer-home' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        等待司機接單
      </v-card-title>
      <v-card-text>
        <p class="text-body-1 mb-2">訂單編號：<strong>{{ orderId }}</strong></p>
        <p class="text-body-2 text-medium-emphasis">狀態：{{ statusText }}</p>
        <v-progress-linear
          v-if="status === 'pending'"
          indeterminate
          color="primary"
          class="my-4"
        />
        <v-alert
          v-if="status === 'pending'"
          type="info"
          variant="tonal"
          class="mt-3"
        >
          正在為您尋找司機，請稍候…
        </v-alert>
        <v-alert
          v-else-if="status === 'matched'"
          type="success"
          variant="tonal"
          class="mt-3"
        >
          司機已接單，即將跳轉至追蹤頁面…
        </v-alert>
        <v-btn
          block
          variant="outlined"
          color="error"
          class="mt-4"
          :disabled="status !== 'pending'"
          @click="cancelAndBack"
        >
          取消並返回
        </v-btn>
        <v-btn
          block
          variant="tonal"
          color="grey"
          class="mt-2"
          size="small"
          @click="mockMatched"
        >
          開發用：模擬已配對
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDispatchStore } from '@/stores/useDispatchStore'
import { useDispatchApi } from '@/composables/useDispatchApi'

defineOptions({ name: 'CustomerWait' })

const route = useRoute()
const router = useRouter()
const dispatchStore = useDispatchStore()
const { getOrderStatus } = useDispatchApi()

const orderId = computed(() => route.query.orderId || dispatchStore.currentOrderId || '')
const status = ref('pending')
let pollTimer = null

const statusText = computed(() => {
  const map = { pending: '等待中', matched: '已配對', picked_up: '已上車', dropped_off: '已完成', cancelled: '已取消' }
  return map[status.value] || status.value
})

async function pollStatus() {
  if (!orderId.value) return
  try {
    const res = await getOrderStatus(orderId.value)
    status.value = res.status || 'pending'
    dispatchStore.setOrder({ ...res, orderId: orderId.value })
    if (status.value === 'matched' || status.value === 'picked_up' || status.value === 'dropped_off') {
      router.replace({ name: 'customer-track', query: { orderId: orderId.value } })
    }
  } catch (_) {}
}

function cancelAndBack() {
  dispatchStore.clearOrder()
  router.replace({ name: 'customer-home' })
}

function mockMatched() {
  status.value = 'matched'
  const current = dispatchStore.currentOrder?.value ?? dispatchStore.currentOrder ?? {}
  dispatchStore.setOrder({
    ...current,
    orderId: orderId.value,
    status: 'matched',
    driver: { name: '測試司機', phone: '0900000000' },
  })
  router.replace({ name: 'customer-track', query: { orderId: orderId.value } })
}

onMounted(() => {
  if (!orderId.value) {
    router.replace({ name: 'customer-home' })
    return
  }
  pollStatus()
  pollTimer = setInterval(pollStatus, 3000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(orderId, (id) => {
  if (!id) router.replace({ name: 'customer-home' })
})
</script>

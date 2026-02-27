<template>
  <v-container class="pa-4">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'login' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        司機端
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="driverIdInput"
          label="手機"
          placeholder="輸入手機號碼以開始接單"
          type="tel"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          :disabled="connected"
        />
        <v-btn
          v-if="!connected"
          block
          color="primary"
          :disabled="!driverIdInput.trim()"
          :loading="loading"
          @click="startListen"
        >
          開始接單
        </v-btn>
        <template v-else>
          <v-chip color="success" class="mb-2">已連線</v-chip>
          <p class="text-body-2 text-medium-emphasis">
            {{ pendingOrdersList.length > 0 ? `共 ${pendingOrdersList.length} 筆待處理訂單` : '等待新訂單…' }}
          </p>
          <v-btn block variant="outlined" color="grey" size="small" class="mt-2" @click="handleDisconnect">
            結束接單
          </v-btn>
        </template>
      </v-card-text>
    </v-card>

    <v-card
      v-for="order in pendingOrdersList"
      :key="order.orderId ?? order.order_id"
      class="mb-4"
    >
      <v-card-title :class="(order?.status ?? '') === 'pending' ? 'bg-primary text-white' : 'bg-grey-darken-1 text-white'">
        {{ (order?.status ?? '') === 'pending' ? '待接單' : statusLabel(order?.status) }}
      </v-card-title>
      <v-card-text>
        <p class="text-body-1"><strong>訂單編號：</strong>{{ order.orderId ?? order.order_id }}</p>
        <p class="text-body-2 mt-1"><strong>上車地點：</strong>{{ getPickupAddress(order) }}</p>
        <p v-if="getDistanceForOrder(order) != null" class="text-body-2">
          距離約 {{ getDistanceForOrder(order).toFixed(1) }} km，預估 {{ getEtaForOrder(order) }} 分鐘
        </p>
        <v-row class="mt-3">
          <template v-if="(order?.status ?? '') === 'pending'">
            <v-col cols="6">
              <v-btn block color="success" @click="acceptOrder(order)">接受</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn block variant="outlined" color="error" @click="rejectOrder(order)">拒絕</v-btn>
            </v-col>
          </template>
          <template v-else-if="isMyOrder(order)">
            <v-col cols="12">
              <v-btn block color="primary" @click="continueOrder(order)">繼續執行</v-btn>
            </v-col>
          </template>
          <template v-else>
            <v-col cols="12">
              <v-chip color="grey">已有人接</v-chip>
            </v-col>
          </template>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDispatchStore } from '@/stores/useDispatchStore'
import { useDispatchApi } from '@/composables/useDispatchApi'
import { useDriverSocket } from '@/composables/useDriverSocket'
import { haversineKm, etaMinutes } from '@/utils/geo'

defineOptions({ name: 'DriverHome' })

const router = useRouter()
const dispatchStore = useDispatchStore()
const { fetchUnfinishedOrders, driverAcceptOrder, driverRejectOrder, getOrderDetail } = useDispatchApi()

const driverIdInput = ref(dispatchStore.driverId ?? '')
const loading = ref(false)
const driverPosition = ref({ lat: null, lng: null })

const pendingOrdersList = computed(() => dispatchStore.pendingOrdersList)

const statusLabel = (status) => {
  const map = { pending: '等待中', matched: '已接單', picked_up: '已上車', dropped_off: '已完成', cancelled: '已取消' }
  return map[status] ?? status
}

function getPickupAddress(order) {
  if (!order) return '—'
  return order.pickupAddress || order.pickup?.address || (order.pickupLat != null ? `${order.pickupLat}, ${order.pickupLng}` : '—')
}

function getDistanceForOrder(order) {
  if (driverPosition.value.lat == null || !order) return null
  const pLat = order.pickupLat ?? order.pickup?.lat
  const pLng = order.pickupLng ?? order.pickup?.lng
  if (pLat == null || pLng == null) return null
  return haversineKm(driverPosition.value.lat, driverPosition.value.lng, pLat, pLng)
}

function getEtaForOrder(order) {
  const km = getDistanceForOrder(order)
  return km != null ? etaMinutes(km) : '—'
}

function isMyOrder(order) {
  const myId = dispatchStore.driverId ?? driverIdInput.value.trim()
  return order?.driver?.driverId === myId
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('不支援定位'))
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
  })
}

async function updateDriverPosition() {
  try {
    const pos = await getCurrentPosition()
    driverPosition.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch (_) {
    driverPosition.value = { lat: null, lng: null }
  }
}

const { connected, connect, disconnect } = useDriverSocket(
  () => driverIdInput.value.trim() || dispatchStore.driverId,
  (msg) => {
    dispatchStore.addPendingOrder({
      orderId: msg.orderId ?? msg.order_id,
      pickupAddress: msg.pickupAddress ?? msg.pickup?.address,
      pickupLat: msg.pickupLat ?? msg.pickup?.lat,
      pickupLng: msg.pickupLng ?? msg.pickup?.lng,
      pickup: msg.pickup,
      dropoff: msg.dropoff,
      status: 'pending',
      ...msg,
    })
  },
)

async function startListen() {
  const id = driverIdInput.value.trim()
  if (!id) return
  loading.value = true
  dispatchStore.setDriverId(id)
  try {
    const orders = await fetchUnfinishedOrders()
    dispatchStore.setPendingOrders(orders)
    await updateDriverPosition()
    connect()
  } finally {
    loading.value = false
  }
}

async function acceptOrder(order) {
  if (!order) return
  const orderId = order.orderId ?? order.order_id
  const driverId = dispatchStore.driverId ?? driverIdInput.value.trim()
  await driverAcceptOrder(orderId, driverId, '司機', driverId)
  dispatchStore.setOrder({
    orderId,
    status: 'matched',
    pickup: order.pickup || { address: order.pickupAddress, lat: order.pickupLat, lng: order.pickupLng },
    dropoff: order.dropoff,
    driver: { driverId, name: '司機', phone: driverId },
  })
  dispatchStore.removePendingOrder(orderId)
  router.push({ name: 'driver-run', query: { orderId } })
}

async function rejectOrder(order) {
  if (order) {
    await driverRejectOrder(order.orderId ?? order.order_id, dispatchStore.driverId ?? driverIdInput.value.trim())
    dispatchStore.removePendingOrder(order.orderId ?? order.order_id)
  }
}

async function continueOrder(order) {
  if (!order) return
  const orderId = order.orderId ?? order.order_id
  const detail = await getOrderDetail(orderId)
  dispatchStore.setOrder(detail)
  dispatchStore.removePendingOrder(orderId)
  router.push({ name: 'driver-run', query: { orderId } })
}

function handleDisconnect() {
  disconnect()
  dispatchStore.setPendingOrders([])
}

onMounted(() => {
  if (dispatchStore.driverId) driverIdInput.value = dispatchStore.driverId
})
</script>

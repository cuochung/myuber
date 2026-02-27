<template>
  <v-container class="pa-4 pb-8">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'driver-home' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        執行中訂單
      </v-card-title>
      <v-card-text v-if="order">
        <p class="text-body-2">訂單編號：<strong>{{ orderId }}</strong></p>
        <v-chip size="small" :color="statusColor" class="mb-2">{{ statusText }}</v-chip>
        <p class="text-body-2 mt-2"><strong>上車：</strong>{{ order.pickup?.address || '—' }}</p>
        <p class="text-body-2"><strong>下車：</strong>{{ order.dropoff?.address || '—' }}</p>
        <v-btn
          v-if="order.pickup?.lat != null"
          block
          variant="tonal"
          color="primary"
          class="mt-2"
          :href="navUrl"
          target="_blank"
          rel="noopener"
        >
          <v-icon start>mdi-navigation</v-icon>
          開啟導航
        </v-btn>
      </v-card-text>
    </v-card>

    <v-card class="mb-4 overflow-hidden">
      <v-card-title>地圖</v-card-title>
      <div ref="mapContainerRef" class="map-container" />
    </v-card>

    <v-card>
      <v-card-title>操作</v-card-title>
      <v-card-text>
        <v-btn
          block
          size="large"
          color="primary"
          class="mb-2"
          :disabled="order?.status !== 'matched'"
          @click="confirmPickup"
        >
          確認上車
        </v-btn>
        <v-btn
          block
          size="large"
          color="success"
          :disabled="order?.status !== 'picked_up'"
          :loading="dropoffLoading"
          @click="confirmDropoff"
        >
          確認下車
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useDispatchStore } from '@/stores/useDispatchStore'
import { useDispatchApi } from '@/composables/useDispatchApi'
import { useDriverSocket } from '@/composables/useDriverSocket'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

defineOptions({ name: 'DriverRun' })

const route = useRoute()
const router = useRouter()
const dispatchStore = useDispatchStore()
const { driverId } = storeToRefs(dispatchStore)
const { getOrderDetail, driverUpdateStatus } = useDispatchApi()

const orderId = computed(() => route.query.orderId || dispatchStore.currentOrderId || '')
const order = computed(() => dispatchStore.currentOrder)

const statusText = computed(() => {
  const map = { matched: '已接單', picked_up: '已上車', dropped_off: '已完成' }
  return map[order.value?.status] || order.value?.status || '—'
})

const statusColor = computed(() => {
  const s = order.value?.status
  if (s === 'dropped_off') return 'success'
  if (s === 'picked_up') return 'primary'
  return 'secondary'
})

const navUrl = computed(() => {
  const p = order.value?.pickup
  const lat = p?.lat ?? order.value?.pickupLat
  const lng = p?.lng ?? order.value?.pickupLng
  if (lat == null || lng == null) return '#'
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
})

const mapContainerRef = ref(null)
const dropoffLoading = ref(false)
const lastReportedLocation = ref({ lat: null, lng: null })
let map = null
let pickupMarker = null
let locationWatchId = null

const { connect: connectWs, disconnect: disconnectWs, sendLocation } = useDriverSocket(
  () => String(driverId.value ?? ''),
  () => {},
)

function initMap() {
  if (!mapContainerRef.value || map) return
  const pickup = order.value?.pickup || {}
  const lat = pickup.lat ?? order.value?.pickupLat ?? 25.04
  const lng = pickup.lng ?? order.value?.pickupLng ?? 121.55
  map = L.map(mapContainerRef.value).setView([lat, lng], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)
  pickupMarker = L.marker([lat, lng]).addTo(map).bindPopup('上車點')
}

function startLocationReporting() {
  if (!navigator.geolocation || !orderId.value) return
  locationWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      lastReportedLocation.value = { lat, lng }
      sendLocation(orderId.value, lat, lng)
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 10000 },
  )
}

function stopLocationReporting() {
  if (locationWatchId != null) {
    navigator.geolocation.clearWatch(locationWatchId)
    locationWatchId = null
  }
}

async function loadDetail() {
  if (!orderId.value) return
  try {
    const res = await getOrderDetail(orderId.value)
    dispatchStore.setOrder({ ...res, orderId: orderId.value })
  } catch (_) {}
}

async function confirmPickup() {
  await driverUpdateStatus(orderId.value, 'picked_up')
  const current = dispatchStore.currentOrder?.value ?? dispatchStore.currentOrder ?? {}
  dispatchStore.setOrder({ ...current, status: 'picked_up' })
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('不支援定位'))
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10000,
      timeout: 3000,
    })
  })
}

async function confirmDropoff() {
  dropoffLoading.value = true
  let lat = null
  let lng = null
  try {
    const pos = await getCurrentPosition()
    lat = pos.coords.latitude
    lng = pos.coords.longitude
  } catch (_) {
    const last = lastReportedLocation.value
    if (last.lat != null && last.lng != null) {
      lat = last.lat
      lng = last.lng
    }
  }
  const extra = {}
  if (lat != null && lng != null) {
    extra.dropoffLat = lat
    extra.dropoffLng = lng
    const addr = order.value?.dropoff?.address || order.value?.dropoffAddress
    extra.dropoffAddress = addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    extra.dropoff = { address: extra.dropoffAddress, lat, lng }
  }
  try {
    await driverUpdateStatus(orderId.value, 'dropped_off', extra)
  } finally {
    dropoffLoading.value = false
  }
  dispatchStore.clearOrder()
  stopLocationReporting()
  disconnectWs()
  router.replace({ name: 'driver-home' })
}

onMounted(async () => {
  if (!orderId.value) {
    router.replace({ name: 'driver-home' })
    return
  }
  await loadDetail()
  await nextTick()
  initMap()
  connectWs()
  startLocationReporting()
})

onUnmounted(() => {
  stopLocationReporting()
  disconnectWs()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-container {
  height: 280px;
  width: 100%;
}
</style>

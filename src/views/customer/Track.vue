<template>
  <v-container class="pa-4 pb-8">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'customer-home' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        訂單追蹤
      </v-card-title>
      <v-card-text v-if="order">
        <p class="text-body-2 mb-1">訂單編號：<strong>{{ orderId }}</strong></p>
        <v-chip size="small" color="success" class="mb-2">{{ statusText }}</v-chip>
        <v-divider class="my-2" />
        <template v-if="order.driver">
          <p class="text-subtitle-2">司機資訊</p>
          <p class="text-body-2">姓名：{{ order.driver.name || '—' }}</p>
          <p class="text-body-2">聯絡：{{ order.driver.phone || '—' }}</p>
        </template>
        <template v-else>
          <p class="text-body-2 text-medium-emphasis">司機資訊載入中…</p>
        </template>
      </v-card-text>
    </v-card>

    <v-card class="mb-4 overflow-hidden">
      <v-card-title>地圖</v-card-title>
      <div ref="mapContainerRef" class="map-container" />
    </v-card>

    <v-card>
      <v-card-title>傳照片給司機</v-card-title>
      <v-card-subtitle>可上傳街景或地標照片，方便司機找到您</v-card-subtitle>
      <v-card-text>
        <v-file-input
          v-model="photoFile"
          accept="image/*"
          label="選擇圖片"
          variant="outlined"
          density="comfortable"
          hide-details
          prepend-icon=""
          prepend-inner-icon="mdi-camera"
          class="mb-3"
          @update:model-value="onPhotoSelected"
        />
        <v-list v-if="photoList.length">
          <v-list-item
            v-for="(item, i) in photoList"
            :key="i"
            :subtitle="item.name"
            class="px-0"
          >
            <template #prepend>
              <v-img
                v-if="item.url"
                :src="item.url"
                width="48"
                height="48"
                cover
                class="rounded"
              />
              <v-icon v-else>mdi-image</v-icon>
            </template>
            <template #append>
              <v-progress-circular v-if="item.uploading" indeterminate size="24" />
              <v-icon v-else-if="item.error" color="error">mdi-alert-circle</v-icon>
              <v-icon v-else color="success">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useDispatchStore } from '@/stores/useDispatchStore'
import { useStore } from '@/stores/useStore'
import { useDispatchApi } from '@/composables/useDispatchApi'
import { useOrderSocket } from '@/composables/useOrderSocket'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

defineOptions({ name: 'CustomerTrack' })

const route = useRoute()
const router = useRouter()
const store = useStore()
const dispatchStore = useDispatchStore()
const { customerId } = storeToRefs(dispatchStore)
const { getOrderDetail, uploadOrderPhoto } = useDispatchApi()

const orderId = computed(() => route.query.orderId || dispatchStore.currentOrderId || '')
const order = computed(() => dispatchStore.currentOrder)
const statusText = computed(() => {
  const map = { matched: '已配對', picked_up: '已上車', dropped_off: '已完成' }
  return map[order.value?.status] || order.value?.status || '—'
})

const mapContainerRef = ref(null)
let map = null
let pickupMarker = null
let driverMarker = null

const photoFile = ref(null)
const photoList = ref([])

const { connect: connectWs, disconnect: disconnectWs } = useOrderSocket(
  orderId,
  () => String(customerId.value ?? ''),
  (msg) => {
    if (msg.type === 'driver_location' && msg.lat != null && msg.lng != null) {
      dispatchStore.setDriverLocation(msg.lat, msg.lng)
      if (driverMarker) {
        driverMarker.setLatLng([msg.lat, msg.lng])
        driverMarker.setOpacity(1)
      }
    }
  },
)

function initMap() {
  if (!mapContainerRef.value || map) return
  const pickup = order.value?.pickup || {}
  const lat = pickup.lat ?? 25.04
  const lng = pickup.lng ?? 121.55
  map = L.map(mapContainerRef.value).setView([lat, lng], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)

  pickupMarker = L.marker([lat, lng], { icon: defaultIcon() })
    .addTo(map)
    .bindPopup('上車點')

  const driverLoc = order.value?.driverLocation || order.value?.driver?.location
  if (driverLoc?.lat != null) {
    driverMarker = L.marker([driverLoc.lat, driverLoc.lng], { icon: driverIcon() })
      .addTo(map)
      .bindPopup('司機位置')
  } else {
    driverMarker = L.marker([lat, lng], { icon: driverIcon() })
      .addTo(map)
      .bindPopup('司機位置')
    driverMarker.setOpacity(0.3)
  }
}

function defaultIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: '<span style="background:#1976d2;width:12px;height:12px;border-radius:50%;display:inline-block;border:2px solid #fff;"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function driverIcon() {
  return L.divIcon({
    className: 'driver-marker',
    html: '<span style="background:#f57c00;width:14px;height:14px;border-radius:50%;display:inline-block;border:2px solid #fff;"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

async function loadDetail() {
  if (!orderId.value) return
  try {
    const res = await getOrderDetail(orderId.value)
    dispatchStore.setOrder({ ...res, orderId: orderId.value })
  } catch (_) {}
}

async function onPhotoSelected(files) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file || !orderId.value) return
  const item = { name: file.name, url: null, uploading: true, error: false }
  photoList.value.push(item)
  photoFile.value = null
  try {
    const res = await uploadOrderPhoto(orderId.value, file)
    const base = (store.state.base_url || '').replace(/\/$/, '')
    const picName = res?.newName || res?.picName || res?.url
    item.url = picName ? `${base}/../upload/order_photo/${picName}` : URL.createObjectURL(file)
    item.uploading = false
  } catch (e) {
    item.uploading = false
    item.error = true
  }
}

onMounted(async () => {
  if (!orderId.value) {
    router.replace({ name: 'customer-home' })
    return
  }
  await loadDetail()
  await nextTick()
  initMap()
  connectWs()
})

onUnmounted(() => {
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
:deep(.leaflet-marker-icon.custom-marker),
:deep(.leaflet-marker-icon.driver-marker) {
  background: transparent !important;
  border: none !important;
}
</style>

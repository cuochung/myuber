<template>
  <v-container class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'login' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        我要叫車
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-text-field
            v-model="form.phone"
            label="手機號碼"
            placeholder="用於識別與聯絡"
            type="tel"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            :rules="[v => !!v || '請輸入手機號碼']"
          />
          <v-card variant="outlined" class="mb-4 pa-3">
            <v-card-subtitle class="text-body-2 mb-2">上車資訊</v-card-subtitle>
            <v-text-field
              v-model="form.pickupAddress"
              label="上車地點"
              placeholder="輸入地址或地標"
              variant="outlined"
              density="comfortable"
              class="mb-2"
              :rules="[v => !!v || '請輸入上車地點']"
            />
            <v-row class="mb-2" dense>
              <v-col cols="6">
                <v-btn block variant="tonal" color="primary" :loading="gettingLocation" @click="useMyLocation">
                  <v-icon start>mdi-crosshairs-gps</v-icon>
                  使用目前位置
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  variant="outlined"
                  color="primary"
                  :loading="geocodingPickup"
                  :disabled="!form.pickupAddress.trim()"
                  @click="geocodeAddress('pickup')"
                >
                  <v-icon start>mdi-map-marker</v-icon>
                  依地址取得定位
                </v-btn>
              </v-col>
            </v-row>
            <v-card
              v-if="hasPickupCoords"
              variant="outlined"
            >
              <v-card-title class="text-body-2">上車地點地圖預覽</v-card-title>
              <div ref="pickupMapRef" class="map-preview" />
            </v-card>
          </v-card>

          <v-card variant="outlined" class="mb-4 pa-3">
            <v-card-subtitle class="text-body-2 mb-2">下車資訊</v-card-subtitle>
            <v-text-field
              v-model="form.dropoffAddress"
              label="下車地點（選填）"
              placeholder="輸入地址或地標"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />
            <v-btn
              block
              variant="outlined"
              color="primary"
              class="mb-2"
              :loading="geocodingDropoff"
              :disabled="!form.dropoffAddress.trim()"
              @click="geocodeAddress('dropoff')"
            >
              <v-icon start>mdi-map-marker</v-icon>
              依地址取得定位
            </v-btn>
            <v-card
              v-if="hasDropoffCoords"
              variant="outlined"
            >
              <v-card-title class="text-body-2">下車地點地圖預覽</v-card-title>
              <div ref="dropoffMapRef" class="map-preview" />
            </v-card>
          </v-card>
          <v-btn
            type="submit"
            block
            size="large"
            color="primary"
            :loading="submitting"
          >
            送出叫車
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/useStore'
import { useDispatchStore } from '@/stores/useDispatchStore'
import { useDispatchApi } from '@/composables/useDispatchApi'
import { useNotifyNewOrder } from '@/composables/useNotifyNewOrder'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

defineOptions({ name: 'CustomerHome' })

const router = useRouter()
const store = useStore()
const dispatchStore = useDispatchStore()
const { createOrder } = useDispatchApi()
const { notify: notifyNewOrder } = useNotifyNewOrder()

const formRef = ref(null)
const pickupMapRef = ref(null)
const dropoffMapRef = ref(null)
const submitting = ref(false)
const gettingLocation = ref(false)
const geocodingPickup = ref(false)
const geocodingDropoff = ref(false)

let pickupMap = null
let dropoffMap = null
let pickupMarker = null
let dropoffMarker = null

const hasPickupCoords = computed(() => form.pickupLat != null && form.pickupLng != null)
const hasDropoffCoords = computed(() => form.dropoffLat != null && form.dropoffLng != null)

const form = reactive({
  phone: '',
  pickupAddress: '',
  pickupLat: null,
  pickupLng: null,
  dropoffAddress: '',
  dropoffLat: null,
  dropoffLng: null,
})

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('此瀏覽器不支援地理定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    })
  })
}

async function useMyLocation() {
  gettingLocation.value = true
  try {
    const pos = await getCurrentPosition()
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude
    form.pickupLat = lat
    form.pickupLng = lng
    form.pickupAddress = form.pickupAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch (e) {
    const msg = e.code === 1 ? '請允許定位權限後再試' : e.code === 2 ? '無法取得位置，請確認已開啟定位服務' : e.code === 3 ? '定位逾時，請稍後再試' : (e.message || '無法取得目前位置，請開啟定位權限或手動輸入地址')
    alert(msg)
  } finally {
    gettingLocation.value = false
  }
}

/** 正規化地址以利 Geocoding：數字與文字之間加空格，例如 一街215號 → 一街 215 號 */
function normalizeAddressForGeocode(str) {
  if (!str || typeof str !== 'string') return str
  return str
    .trim()
    .replace(/(\D)(\d)/g, '$1 $2')
    .replace(/(\d)(\D)/g, '$1 $2')
    .replace(/\s+/g, ' ')
}

async function geocodeAddress(field) {
  const raw = field === 'pickup' ? form.pickupAddress?.trim() : form.dropoffAddress?.trim()
  if (!raw) {
    alert('請先輸入地址')
    return
  }
  const addr = normalizeAddressForGeocode(raw)
  const loading = field === 'pickup' ? geocodingPickup : geocodingDropoff
  loading.value = true
  try {
    const base = (store.state.base_url || '').replace(/\/$/, '')
    const res = await fetch(`${base}/geocode/search?q=${encodeURIComponent(addr)}`)
    const data = await res.json()
    if (data && data[0]) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      if (field === 'pickup') {
        form.pickupLat = lat
        form.pickupLng = lng
      } else {
        form.dropoffLat = lat
        form.dropoffLng = lng
      }
    } else {
      alert('找不到該地址，請嘗試更完整的地址（例如：台北市信義區、高雄火車站）')
    }
  } catch (e) {
    alert('地址解析失敗，請確認後端服務正常或稍後再試')
  } finally {
    loading.value = false
  }
}

function initPickupMap() {
  if (!pickupMapRef.value || pickupMap || !hasPickupCoords.value) return
  const lat = form.pickupLat ?? 25.033
  const lng = form.pickupLng ?? 121.565
  pickupMap = L.map(pickupMapRef.value).setView([lat, lng], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(pickupMap)
  updatePickupMarker()
}

function initDropoffMap() {
  if (!dropoffMapRef.value || dropoffMap || !hasDropoffCoords.value) return
  const lat = form.dropoffLat ?? 25.033
  const lng = form.dropoffLng ?? 121.565
  dropoffMap = L.map(dropoffMapRef.value).setView([lat, lng], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(dropoffMap)
  updateDropoffMarker()
}

function updatePickupMarker() {
  if (!pickupMap || !hasPickupCoords.value) return
  if (pickupMarker) {
    pickupMap.removeLayer(pickupMarker)
    pickupMarker = null
  }
  pickupMarker = L.marker([form.pickupLat, form.pickupLng])
    .addTo(pickupMap)
    .bindPopup('上車點')
  pickupMap.setView([form.pickupLat, form.pickupLng], 15)
}

function updateDropoffMarker() {
  if (!dropoffMap || !hasDropoffCoords.value) return
  if (dropoffMarker) {
    dropoffMap.removeLayer(dropoffMarker)
    dropoffMarker = null
  }
  dropoffMarker = L.marker([form.dropoffLat, form.dropoffLng])
    .addTo(dropoffMap)
    .bindPopup('下車點')
  dropoffMap.setView([form.dropoffLat, form.dropoffLng], 15)
}

watch(hasPickupCoords, (show) => {
  if (show) {
    setTimeout(() => initPickupMap(), 100)
  } else if (pickupMap) {
    pickupMap.remove()
    pickupMap = null
    pickupMarker = null
  }
}, { immediate: true })

watch(hasDropoffCoords, (show) => {
  if (show) {
    setTimeout(() => initDropoffMap(), 100)
  } else if (dropoffMap) {
    dropoffMap.remove()
    dropoffMap = null
    dropoffMarker = null
  }
}, { immediate: true })

watch(() => [form.pickupLat, form.pickupLng], () => {
  if (pickupMap) updatePickupMarker()
})

watch(() => [form.dropoffLat, form.dropoffLng], () => {
  if (dropoffMap) updateDropoffMarker()
})

onUnmounted(() => {
  if (pickupMap) {
    pickupMap.remove()
    pickupMap = null
  }
  if (dropoffMap) {
    dropoffMap.remove()
    dropoffMap = null
  }
})

async function onSubmit() {
  const { valid } = await formRef.value?.validate() ?? {}
  if (!valid) return
  submitting.value = true
  try {
    const res = await createOrder({
      phone: form.phone,
      pickupAddress: form.pickupAddress,
      pickupLat: form.pickupLat,
      pickupLng: form.pickupLng,
      dropoffAddress: form.dropoffAddress || undefined,
      dropoffLat: form.dropoffLat,
      dropoffLng: form.dropoffLng,
    })
    dispatchStore.setCustomerId(form.phone)
    dispatchStore.setOrder({
      orderId: res.orderId,
      status: res.status,
      pickup: {
        address: form.pickupAddress,
        lat: form.pickupLat,
        lng: form.pickupLng,
      },
      dropoff: form.dropoffAddress ? {
        address: form.dropoffAddress,
        lat: form.dropoffLat,
        lng: form.dropoffLng,
      } : null,
    })
    notifyNewOrder({
      orderId: res.orderId,
      phone: form.phone,
      pickupAddress: form.pickupAddress,
      pickupLat: form.pickupLat,
      pickupLng: form.pickupLng,
      pickup: { address: form.pickupAddress, lat: form.pickupLat, lng: form.pickupLng },
      dropoff: form.dropoffAddress ? { address: form.dropoffAddress, lat: form.dropoffLat, lng: form.dropoffLng } : null,
    })
    router.push({ name: 'customer-wait', query: { orderId: res.orderId } })
  } catch (e) {
    alert('送出失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.map-preview {
  height: 200px;
  width: 100%;
  border-radius: 0 0 4px 4px;
}
</style>

<template>
  <v-container class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'admin-home' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        訂單管理
      </v-card-title>
      <v-card-text>
        <v-btn color="primary" class="mb-4" :loading="loading" @click="loadOrders">
          <v-icon start>mdi-refresh</v-icon>
          重新載入
        </v-btn>
        <v-table>
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>狀態</th>
              <th>上車地點</th>
              <th>下車地點</th>
              <th>聯絡電話</th>
              <th>司機</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.orderId ?? order.order_id">
              <td>{{ order.orderId ?? order.order_id }}</td>
              <td>
                <v-chip :color="statusColor(order.status)" size="small">
                  {{ statusLabel(order.status) }}
                </v-chip>
              </td>
              <td class="text-body-2">{{ order.pickupAddress || '—' }}</td>
              <td class="text-body-2">{{ order.dropoffAddress || '—' }}</td>
              <td>{{ order.phone || '—' }}</td>
              <td>{{ order.driver?.name || order.driver?.driverId || '—' }}</td>
            </tr>
          </tbody>
        </v-table>
        <p v-if="!loading && orders.length === 0" class="text-body-2 text-medium-emphasis mt-4">尚無訂單</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDispatchApi } from '@/composables/useDispatchApi'

defineOptions({ name: 'AdminOrders' })

const { fetchAllOrders } = useDispatchApi()
const orders = ref([])
const loading = ref(false)

const statusLabel = (status) => {
  const map = { pending: '等待中', matched: '已接單', picked_up: '已上車', dropped_off: '已完成', cancelled: '已取消' }
  return map[status] ?? status ?? '—'
}

const statusColor = (status) => {
  const map = {
    pending: 'warning',
    matched: 'info',
    picked_up: 'primary',
    dropped_off: 'success',
    cancelled: 'grey',
  }
  return map[status] ?? 'grey'
}

async function loadOrders() {
  loading.value = true
  try {
    orders.value = await fetchAllOrders()
  } finally {
    loading.value = false
  }
}

onMounted(() => loadOrders())
</script>

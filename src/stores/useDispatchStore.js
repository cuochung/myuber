import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useDispatchStore = defineStore('dispatch', () => {
  const currentOrderId = ref(null)
  const currentOrder = ref(null) // { orderId, status, pickup, dropoff, driver?, driverLocation? }
  const customerId = ref(null)   // 顧客識別（可為手機號或臨時 id）
  const driverId = ref(null)     // 司機識別
  const newOrderOffer = ref(null) // 司機端：目前收到的新單（待接受/拒絕）
  const pendingOrdersList = ref([]) // 司機端：未完成訂單列表（pending + 已接單的 matched/picked_up）

  const isMatched = computed(() => {
    const s = currentOrder.value?.status
    return s === 'matched' || s === 'picked_up' || s === 'dropped_off'
  })

  function setOrder(order) {
    currentOrderId.value = order?.orderId ?? order?.order_id ?? null
    currentOrder.value = order ? { ...order } : null
  }

  function setDriverLocation(lat, lng) {
    if (!currentOrder.value) return
    currentOrder.value = {
      ...currentOrder.value,
      driverLocation: { lat: Number(lat), lng: Number(lng) },
    }
  }

  function setCustomerId(id) {
    customerId.value = id
  }

  function clearOrder() {
    currentOrderId.value = null
    currentOrder.value = null
  }

  function setDriverId(id) {
    driverId.value = id
  }

  function setNewOrderOffer(offer) {
    newOrderOffer.value = offer ? { ...offer } : null
  }

  function clearNewOrderOffer() {
    newOrderOffer.value = null
  }

  function setPendingOrders(orders) {
    pendingOrdersList.value = Array.isArray(orders) ? [...orders] : []
  }

  function addPendingOrder(order) {
    if (!order) return
    const id = order.orderId ?? order.order_id
    const exists = pendingOrdersList.value.some(o => (o.orderId ?? o.order_id) === id)
    if (!exists) {
      pendingOrdersList.value = [{ ...order }, ...pendingOrdersList.value]
    }
  }

  function removePendingOrder(orderId) {
    const id = orderId ?? (typeof orderId === 'object' ? orderId?.orderId ?? orderId?.order_id : null)
    if (id != null) {
      pendingOrdersList.value = pendingOrdersList.value.filter(o => (o.orderId ?? o.order_id) !== id)
    }
  }

  return {
    currentOrderId,
    currentOrder,
    customerId,
    driverId,
    newOrderOffer,
    pendingOrdersList,
    isMatched,
    setOrder,
    setDriverLocation,
    setCustomerId,
    setDriverId,
    setNewOrderOffer,
    clearNewOrderOffer,
    setPendingOrders,
    addPendingOrder,
    removePendingOrder,
    clearOrder,
  }
})

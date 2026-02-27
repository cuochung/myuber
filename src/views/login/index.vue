<template>
  <v-container fluid class="fill-height align-center justify-center pa-4">
    <v-card width="100%" max-width="400" class="pa-4">
      <v-card-title class="text-h5 text-center">派遣系統</v-card-title>
      <v-card-subtitle class="text-center">請選擇進入方式</v-card-subtitle>
      <v-card-text class="d-flex flex-column gap-3">
        <v-btn block size="large" color="primary" :to="{ name: 'customer-home' }">
          顧客端
        </v-btn>
        <v-btn block size="large" color="secondary" :to="{ name: 'driver-home' }">
          司機端
        </v-btn>
        <v-btn block size="large" variant="outlined" color="grey" :to="{ name: 'admin-home' }">
          後台
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
defineOptions({ name: 'Login' })
</script>

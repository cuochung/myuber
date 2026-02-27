<template>
  <v-container class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn icon variant="text" :to="{ name: 'login' }">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        後台
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">派遣系統管理後台</p>
        <v-list density="comfortable">
          <v-list-item
            :to="{ name: 'admin-orders' }"
            prepend-icon="mdi-format-list-bulleted"
            title="訂單管理"
            subtitle="檢視與管理所有訂單"
          />
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
defineOptions({ name: 'AdminHome' })
</script>

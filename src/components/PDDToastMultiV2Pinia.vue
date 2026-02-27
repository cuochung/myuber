<script setup>
// PDDToastMultiV2Pinia.vue
import { computed, ref } from 'vue'
import { useStore } from '@/stores/useStore'
const store = useStore()

//回傳 css 中專用的動畫執行時間
const selectTypeTime = computed(() => {
  if (store.toasts.length) {
    return (store.toasts[0].closeTime) + 's'
  } else {
    return ''
  }
})
//回傳各種狀態的 color
const returgColor = (type) => {
  if (type == 'primary') { return '#4070f4' }
  if (type == 'success') { return '#14A44D' }
  if (type == 'warning') { return '#E4A11B' }
  if (type == 'error') { return '#DC4C64' }
}
//回傳各種狀態的 Title
const returnTitle = (type) => {
  if (type == 'primary') { return '#提示訊息' }
  if (type == 'success') { return '成功訊息' }
  if (type == 'warning') { return '警告訊息' }
  if (type == 'error') { return '錯誤訊息' }
}

//2024.1.16 加入清除所有訊息功能
const clearAll = () => {
  store.toasts = []
}
</script>



<template>
  <div class="toast-wrapper">
    <div class="ToastZone">
      <TransitionGroup tag="ul" name="toast-fade" class="container">
        <div class="clearAll flex justify-between align-center" v-if="store.toasts.length" @click="clearAll()">
          clear all message
          <i class="fa-solid fa-xmark"></i>
        </div>

        <div v-for="toast in store.toasts" class="toast" :key="toast.timeStamp"
          :style="'border-left-color:' + returgColor(toast.type)" 
          @mouseover="toast.active = false">
          <div class="toastContent">
            <!-- <i class="fa-solid fa-check check" :style="'background-color:' + returgColor(toast.type)"></i> -->
            <i class="fa-solid fa-check check" :style="'background-color:' + returgColor(toast.type)" v-if="toast.type == 'primary'"></i>
            <i class="fa-solid fa-check check" :style="'background-color:' + returgColor(toast.type)" v-if="toast.type == 'success'"></i>
            <i class="fa-solid fa-exclamation check" :style="'background-color:' + returgColor(toast.type)" v-if="toast.type == 'warning'"></i>
            <i class="fa-solid fa-xmark check" :style="'background-color:' + returgColor(toast.type)" v-if="toast.type == 'error'"></i>

            <div class="message">
              <span class="text text-1">{{ returnTitle(toast.type) }}</span>
              <span class="text text-2" v-html="toast.message"></span>
            </div>
          </div>

          <div class="progress">
            <div :class="{ 'active': toast.active }" :style="'background-color:' + returgColor(toast.type)"></div>
          </div>

          <i class="fa-solid fa-xmark close" @click="toast.active = true;store.closeShowToastMulti(toast.timeStamp)"></i>

        </div>
      </TransitionGroup>
    </div>
    <!-- <button class="buttonStyle" @click="showToast()">Show Toast(Multi) V2</button> -->
  </div>
</template>



<style scoped>
.clearAll{
  color:white;
  background-color: black;
  padding:5px 10px;
  border-radius: 5px;
  border:1px white solid;
  cursor: pointer;
}
.ToastZone {
  z-index: 9999;
  position: fixed;
  bottom: 10px;
  right: 10px;
  max-height:98vh;
  overflow: auto;
}
.ToastZone::-webkit-scrollbar {
  width: 0rem;
  height: 0rem;
}

.ToastZone::-webkit-scrollbar-thumb {
  border-radius: 0rem;
  background-color: rgba(var(--setColor-2), 1);
  visibility: hidden;
}

.ToastZone:hover::-webkit-scrollbar-thumb {
  visibility: visible;
}


.container {
  position: relative;
  padding: 0;
}

.toast {
  background: #fff;
  border-radius: 5px;
  margin-top: 5px;
  padding: 5px 35px 5px 25px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  border-left: 6px solid;
  overflow: hidden;
  position: relative;
}

.toast .progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: #ddd;
}

.toast .progress .active {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  height: 100%;
  width: 100%;
  /* background-color: #4070f4; */
}

.progress .active {
  animation: progress linear forwards;
  animation-duration: v-bind(selectTypeTime);
}

/* .toast .progress:before {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background-color: #4070f4;
}

.progress.active:before {
  animation: progress linear forwards;
  animation-duration: v-bind(selectTypeTime);
} */

.toast .close {
  position: absolute;
  top: 10px;
  right: 15px;
  padding: 5px;
  cursor: pointer;
  opacity: 0.5;
}

.toast .close:hover {
  opacity: 1;
}

@keyframes progress {
  100% {
    right: 100%;
  }
}


.toastContent {
  display: flex;
  align-items: center;
}

.toastContent .check {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 35px;
  width: 35px;
  /* background-color: #4070f4; */
  color: #fff;
  border-radius: 50%
}

.toastContent .message {
  display: flex;
  flex-direction: column;
  margin: 0 20px;
}

.message .text {
  font-size: 20px;
  font-weight: 400;
  color: #666666;
}

.message .text.text-1 {
  font-weight: 600;
}

/* 動畫的部分 */
/* 1. declare transition */
.toast-fade-move,
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.5s
}

/* 2. declare enter from and leave to state */
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(150px, 0px);
}

/* 3. ensure leaving items are taken out of layout flow so that moving
      animations can be calculated correctly. */
/* .toast-fade-leave-active { */
  /* position: absolute; */
  /* position: fixed;
  bottom:50x; 
  right:-250px; */
  /* opacity: 0; */
/* } */
</style>
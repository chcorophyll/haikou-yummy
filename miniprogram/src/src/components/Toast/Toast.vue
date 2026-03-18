<template>
  <view v-if="visible" class="toast" :class="`toast--${type}`">
    <text class="toast__text">{{ message }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'info' | 'success' | 'error'>('info')

let timer: ReturnType<typeof setTimeout>

function show(msg: string, t: 'info' | 'success' | 'error' = 'info', duration = 2500) {
  message.value = msg
  type.value = t
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { visible.value = false }, duration)
}

defineExpose({ show })
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  top: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 24rpx 48rpx;
  border-radius: 9999rpx;
  border: 1rpx solid rgba(42, 42, 42, 0.6);
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20rpx);
  animation: slideDown 0.3s ease;

  &--error  { border-color: rgba(227,25,55,0.4); }
  &--success{ border-color: rgba(74,222,128,0.4); }

  &__text {
    font-size: 24rpx;
    font-weight: 700;
    color: #cccccc;
    letter-spacing: 3rpx;
    text-transform: uppercase;
    white-space: nowrap;
    .toast--error &  { color: #e31937; }
    .toast--success &{ color: #4ade80; }
  }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20rpx); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>

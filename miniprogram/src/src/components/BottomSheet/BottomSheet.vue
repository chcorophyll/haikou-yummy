<template>
  <view class="bottom-sheet" :class="{ 'bottom-sheet--show': visible }">
    <view class="bottom-sheet__mask" @tap="close"></view>
    <view class="bottom-sheet__content glass-panel" :style="{ bottom: safeAreaBottom + 'px' }">
      <view class="bottom-sheet__handle"></view>
      <slot></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const sysInfo = uni.getSystemInfoSync()
const safeAreaBottom = sysInfo.safeAreaInsets?.bottom || 0

function close() {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.bottom-sheet {
  position: fixed;
  inset: 0;
  z-index: 999;
  visibility: hidden;
  transition: visibility 0.3s;

  &--show {
    visibility: visible;
  }

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.3s;
    .bottom-sheet--show & { opacity: 1; }
  }

  &__content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(20rpx);
    border-top: 1rpx solid rgba(227, 25, 55, 0.3);
    border-top-left-radius: 32rpx;
    border-top-right-radius: 32rpx;
    padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.5);

    .bottom-sheet--show & {
      transform: translateY(0);
    }
  }

  &__handle {
    width: 80rpx;
    height: 8rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4rpx;
    margin: 0 auto 32rpx;
  }
}
</style>

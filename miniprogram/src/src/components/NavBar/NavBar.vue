<template>
  <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px', height: navBarHeight + 'px' }">
    <view class="navbar__inner" :style="{ height: menuButtonHeight + 'px', marginTop: (navBarHeight - statusBarHeight - menuButtonHeight) / 2 + 'px' }">
      <view v-if="back" class="navbar__back" @tap="goBack">
        <text class="navbar__back-icon">←</text>
      </view>
      <text class="navbar__title">{{ title }}</text>
    </view>
  </view>
  <!-- 占位符避免由于fixed导致内容被遮挡 -->
  <view :style="{ height: navBarHeight + 'px' }"></view>
</template>

<script setup lang="ts">
import { ref, provide, computed, onMounted } from 'vue'
import { useRestaurantStore } from '../../stores/restaurant'

const props = defineProps<{
  title?: string
  back?: boolean
}>()

const store = useRestaurantStore()
const navBarHeight = computed(() => store.navBarHeight)
const menuButtonHeight = computed(() => store.menuButtonHeight)
const sysInfo = uni.getSystemInfoSync()
const statusBarHeight = ref(sysInfo.statusBarHeight || 0)

// menuButtonHeight is still needed for layout calculations in the template

// Provide navBarHeight from the store for consistency
provide('navBarHeight', navBarHeight)

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #0a0a0a;
  z-index: 999;
  border-bottom: 1px solid rgba(42, 42, 42, 0.8);

  &__inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 32rpx;
  }

  &__back {
    position: absolute;
    left: 32rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    
    &:active {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &__back-icon {
    font-size: 32rpx;
    color: #fff;
    font-weight: bold;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 4rpx;
    text-transform: uppercase;
  }
}
</style>

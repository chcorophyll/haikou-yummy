<template>
  <view class="container">
    <NavBar title="发现美食" :back="false" />

    <view class="header" :style="{ paddingTop: navBarHeight + 'px' }">
      <view class="search-bar glass-panel">
        <text class="search-icon">🔍</text>
        <input
          v-model="store.searchQuery"
          class="search-input"
          placeholder="搜索海口的美食、店铺或地址..."
          placeholder-style="color: #666; font-size: 24rpx;"
        />
        <text v-if="store.searchQuery" class="clear-icon" @tap="store.searchQuery = ''">✖</text>
      </view>

      <view class="title-row">
        <text class="title">发现美食 ({{ store.filteredRestaurants.length }})</text>
      </view>
    </view>

    <scroll-view scroll-y class="list-scroll" :enable-back-to-top="true">
      <view class="scroll-spacer"></view>
      <view v-if="store.loading" class="empty-state">
        <text class="empty-text">正在加载海口美食...</text>
      </view>

      <view v-else-if="store.filteredRestaurants.length === 0" class="empty-state">
        <text class="empty-icon">🍽</text>
        <text class="empty-text">没有找到匹配的餐厅</text>
      </view>

      <view class="list">
        <RestaurantCard
          v-for="rest in store.filteredRestaurants"
          :key="rest._id"
          :restaurant="rest"
          :is-selected="store.selectedId === rest._id"
          :is-fav="store.isFavorite(rest._id)"
          class="card-item"
          @tap="onSelect(rest)"
          @toggle-favorite="store.toggleFavorite"
        />
      </view>
      <view class="scroll-spacer"></view>
    </scroll-view>

    <Toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRestaurantStore } from '../../stores/restaurant'
import type { Restaurant } from '../../types/restaurant'
import NavBar from '../../components/NavBar/NavBar.vue'
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard.vue'
import Toast from '../../components/Toast/Toast.vue'

const store = useRestaurantStore()
const toastRef = ref<any>(null)
const navBarHeight = computed(() => store.navBarHeight)
const navigating = ref(false)

onLoad(() => {
  if (store.restaurants.length === 0) {
    store.fetchAll().catch(() => {
      toastRef.value?.show('加载失败', 'error')
    })
  }
})

onShow(() => {
  store.searchQuery = ''
})

function onSelect(rest: Restaurant) {
  if (navigating.value) return
  navigating.value = true
  setTimeout(() => navigating.value = false, 1000)

  if (rest.is_verified === false) {
    toastRef.value?.show('此餐厅正在审阅中，暂时无法查看详情', 'info')
    return
  }
  // -- ARCHITECT FIX: Pre-emptive Sync to kill flickering --
  store.selectRestaurant(rest._id)
  uni.navigateTo({ url: `/pages/detail/detail?id=${rest._id}&name=${encodeURIComponent(rest.name)}` })
}
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #111111;
}

.header {
  padding: 24rpx 32rpx;
  background: #0a0a0a;
  border-bottom: 1rpx solid #2a2a2a;
  z-index: 100;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background: rgba(42, 42, 42, 0.4);
  border-radius: 40rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);

  .search-icon { 
    color: #666; 
    font-size: 32rpx; 
    margin-right: 16rpx;
    display: flex;
    align-items: center;
  }
  .search-input { 
    flex: 1; 
    height: 100%; 
    color: #fff; 
    font-size: 26rpx; 
  }
  .clear-icon { 
    color: #666; 
    padding: 10rpx; 
    font-size: 24rpx;
  }
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  color: #666;
  font-size: 22rpx;
  font-weight: bold;
  letter-spacing: 4rpx;
  text-transform: uppercase;
}

.list-scroll {
  height: 0; /* 关键：强制 flex 容器计算滚动高度 */
  flex: 1;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.scroll-spacer {
  height: 24rpx;
}

.list {
  padding: 0 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card-item {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-icon { font-size: 80rpx; color: rgba(102,102,102,0.3); margin-bottom: 24rpx; }
  .empty-text { color: #666; font-size: 26rpx; }
}
</style>

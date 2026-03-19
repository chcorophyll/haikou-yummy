<template>
  <view class="container">
    <NavBar title="我的收藏" :back="false" />

    <view class="header" :style="{ paddingTop: navBarHeight + 'px' }">
      <view class="search-bar glass-panel">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="在收藏中搜索..."
          placeholder-style="color: #666; font-size: 24rpx;"
        />
        <text v-if="searchQuery" class="clear-icon" @tap="searchQuery = ''">✖</text>
      </view>

      <view class="title-row">
        <text class="title">已收藏店铺 ({{ filteredFavorites.length }})</text>
        <text
          v-if="favoriteRestaurants.length > 0"
          class="clear-btn"
          @tap="clearAll"
        >
          清空全部
        </text>
      </view>
    </view>

    <scroll-view scroll-y class="list-scroll" :enable-back-to-top="true">
      <view class="scroll-spacer"></view>
      <view v-if="filteredFavorites.length === 0" class="empty-state">
        <view class="empty-icon-box">
          <text class="empty-icon">♥</text>
        </view>
        <text class="empty-text">还没有收藏任何店铺，在地图上点击“爱心”来收藏吧</text>
      </view>

      <view class="list">
        <RestaurantCard
          v-for="rest in filteredFavorites"
          :key="rest._id"
          :restaurant="rest"
          :is-selected="store.selectedId === rest._id"
          :is-fav="true"
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
import { computed, ref, inject } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRestaurantStore } from '../../stores/restaurant'
import type { Restaurant } from '../../types/restaurant'
import NavBar from '../../components/NavBar/NavBar.vue'
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard.vue'
import Toast from '../../components/Toast/Toast.vue'

const store = useRestaurantStore()
const toastRef = ref<any>(null)
const navBarHeight = computed(() => store.navBarHeight)
const searchQuery = ref('')
const navigating = ref(false)

onShow(() => {
  searchQuery.value = ''
})

const favoriteRestaurants = computed(() => {
  return store.restaurants.filter(r => store.favoriteIds.includes(r._id))
})

const filteredFavorites = computed(() => {
  if (!searchQuery.value) return favoriteRestaurants.value
  const q = searchQuery.value.toLowerCase()
  return favoriteRestaurants.value.filter(r => 
    r.name.toLowerCase().includes(q) || 
    (r.address && r.address.toLowerCase().includes(q))
  )
})

onLoad(() => {
  if (store.restaurants.length === 0) {
    store.fetchAll()
  }
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

function clearAll() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有收藏吗？',
    confirmColor: '#e31937',
    success: (res) => {
      if (res.confirm) {
        store.clearFavorites()
        toastRef.value?.show('已清空收藏', 'success')
      }
    }
  })
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

.title {
  color: #666;
  font-size: 22rpx;
  font-weight: bold;
  letter-spacing: 4rpx;
  text-transform: uppercase;
}

.clear-btn {
  color: #e31937;
  font-size: 20rpx;
  font-weight: bold;
  letter-spacing: 2rpx;
  text-transform: uppercase;
  padding: 8rpx 16rpx;
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
  padding: 160rpx 64rpx;
  text-align: center;

  .empty-icon-box {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: rgba(42, 42, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
  }
  
  .empty-icon {
    font-size: 60rpx;
    color: rgba(102, 102, 102, 0.5);
  }
  
  .empty-text {
    color: #666;
    font-size: 26rpx;
    line-height: 1.6;
  }
}
</style>

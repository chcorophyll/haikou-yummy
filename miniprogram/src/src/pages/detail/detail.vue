<template>
  <view class="container">
    <NavBar :title="navTitle" :back="true" />

    <scroll-view scroll-y class="content">
      <!-- 轮播图 -->
      <view class="banner" v-if="restaurant">
        <swiper class="swiper" circular autoplay :interval="3000" indicator-dots indicator-active-color="#e31937">
          <swiper-item v-if="!restaurant.images || restaurant.images.length === 0">
            <image src="https://placehold.co/800x600/222/555?text=Haikou+Yummy" mode="aspectFill" class="banner-img" />
          </swiper-item>
          <swiper-item v-for="(img, idx) in restaurant.images" :key="idx">
            <image :src="img" mode="aspectFill" class="banner-img" @tap="previewImage(img, restaurant.images)" />
          </swiper-item>
        </swiper>
        <view class="banner-overlay"></view>
      </view>

      <!-- 主要信息 -->
      <view class="info-card glass-panel" v-if="restaurant">
        <view class="header-row">
          <text class="name">{{ restaurant.name }}</text>
          <view class="rating-badge" v-if="restaurant.rating">{{ restaurant.rating }}</view>
        </view>

        <view class="tags-row" v-if="restaurant.category && restaurant.category.length > 0">
          <text class="cat-tag" v-for="cat in restaurant.category" :key="cat">{{ cat }}</text>
        </view>

        <view class="divider"></view>

        <!-- 地址与电话 -->
        <view class="contact-section">
          <view class="item-row" @tap="openLocation">
            <view class="icon-box"><text class="icon">📍</text></view>
            <view class="item-content">
              <text class="item-title">餐厅地址</text>
              <text class="item-desc">{{ restaurant.address || '暂无详细地址' }}</text>
            </view>
            <text class="arrow">›</text>
          </view>

          <view class="item-row" @tap="callPhone">
            <view class="icon-box"><text class="icon">📞</text></view>
            <view class="item-content">
              <text class="item-title">联系电话</text>
              <text class="item-desc highlight">{{ restaurant.telephone || '暂无号码' }}</text>
            </view>
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
      
      <view v-if="!restaurant && store.loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 适配 iPhone 底部安全区 -->
      <view class="safe-area-bottom-spacer"></view>
    </scroll-view>

    <!-- 固定底栏 -->
    <view class="fixed-bottom glass-panel">
      <template v-if="restaurant">
        <view class="action-btn fav-btn" @tap="store.toggleFavorite(restaurant._id)">
          <text class="btn-icon" :class="{ 'text-red': store.isFavorite(restaurant._id) }">
            {{ store.isFavorite(restaurant._id) ? '♥' : '♡' }}
          </text>
          <text class="btn-text">收藏</text>
        </view>
        <view class="action-btn nav-btn" @tap="openLocation">
          <text class="btn-icon">🗺️</text>
          <text class="btn-text">路线导航</text>
        </view>
      </template>
    </view>
    
    <view class="safe-area-bottom bg-black"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRestaurantStore } from '../../stores/restaurant'
import NavBar from '../../components/NavBar/NavBar.vue'

const store = useRestaurantStore()
const currentId = ref<string | null>(null)
const urlName = ref('')

// --- CRITICAL FIX FOR DOUBLE REFRESH ---
// Use store data IMMEDIATELY during setup to ensure zero-flicker on first render.
// Since the previous page calls store.selectRestaurant(id) BEFORE navigation,
// store.selectedId is already pointing to the correct record.
const initialId = store.selectedId
const initialData = initialId ? store.restaurants.find(r => r._id === initialId) : null
const restaurant = ref<any>(initialData)

const navTitle = computed(() => {
  return restaurant.value?.name || urlName.value || '餐厅详情'
})

onLoad((options) => {
  if (options && options.id) {
    currentId.value = options.id
    if (options.name) {
      urlName.value = decodeURIComponent(options.name)
    }
    
    // 再次确认并同步 store (防止直接通过 URL 进入的情况)
    if (store.selectedId !== options.id) {
      store.selectRestaurant(options.id)
    }
    
    // 如果 setup 没有拿到数据，或者数据不对，则在此更新
    if (!restaurant.value || restaurant.value._id !== options.id) {
      const found = store.restaurants.find(r => r._id === options.id)
      if (found) {
        restaurant.value = found
      }
    }
    
    // 仅在确实没有数据时才触发全局抓取
    if (!restaurant.value || store.restaurants.length === 0) {
      store.fetchAll().then(() => {
        if (!restaurant.value) {
          restaurant.value = store.restaurants.find(r => r._id === options.id) || null
        }
      })
    }
  }
})

function previewImage(cur: string, imgs: string[]) {
  uni.previewImage({ current: cur, urls: imgs })
}

function callPhone() {
  const tel = restaurant.value?.telephone
  if (tel) {
    uni.makePhoneCall({ phoneNumber: tel })
  }
}

function openLocation() {
  const rest = restaurant.value
  if (rest && rest.location) {
    uni.openLocation({
      latitude: rest.location.coordinates[1],
      longitude: rest.location.coordinates[0],
      name: rest.name,
      address: rest.address
    })
  }
}
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #111111;
}

.content {
  flex: 1;
  width: 100%;
}

.banner {
  position: relative;
  width: 100%;
  height: 500rpx;

  .swiper {
    width: 100%;
    height: 100%;
  }

  .banner-img {
    width: 100%;
    height: 100%;
  }

  .banner-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 160rpx;
    background: linear-gradient(to top, #111111, transparent);
  }
}

.info-card {
  margin: -60rpx 32rpx 32rpx;
  position: relative;
  z-index: 2;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.name {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  flex: 1;
  margin-right: 24rpx;
  line-height: 1.4;
}

.rating-badge {
  background: #e31937;
  color: #fff;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: bold;
  box-shadow: 0 0 16rpx rgba(227, 25, 55, 0.5);
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.cat-tag {
  color: #a3a3a3;
  background: #2a2a2a;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.divider {
  height: 1rpx;
  background: rgba(255, 255, 255, 0.05);
  margin: 32rpx 0;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.item-row {
  display: flex;
  align-items: center;
  &:active { opacity: 0.7; }
}

.icon-box {
  width: 72rpx;
  height: 72rpx;
  background: #1f1f1f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;

  .icon { font-size: 32rpx; }
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-title {
  color: #666;
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 2rpx;
  font-weight: bold;
}

.item-desc {
  color: #ccc;
  font-size: 28rpx;
  &.highlight { color: #e31937; font-family: monospace; }
}

.arrow {
  color: #666;
  font-size: 36rpx;
  margin-left: 16rpx;
}

.fixed-bottom {
  display: flex;
  height: 120rpx;
  border-top: 1rpx solid rgba(42, 42, 42, 0.5);
  border-radius: 0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  &:active { opacity: 0.7; background: rgba(255,255,255,0.05); }

  .btn-icon { font-size: 36rpx; color: #fff; }
  .btn-text { font-size: 28rpx; font-weight: bold; color: #fff; }
}

.fav-btn {
  border-right: 1rpx solid rgba(255, 255, 255, 0.05);
  .text-red { color: #e31937; }
}

.nav-btn {
  background: rgba(227, 25, 55, 0.1);
  color: #e31937;
  .btn-text { color: #e31937; }
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: #666;
  font-size: 28rpx;
}

.safe-area-bottom-spacer {
  height: 120rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style>

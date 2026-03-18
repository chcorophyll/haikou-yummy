<template>
  <view class="container">
    <NavBar title="地图" :back="false" />

    <!-- 顶部搜索浮层 (再下移 15px，总计 +55px 安全间距) -->
    <view class="search-bar" :style="{ top: (navBarHeight + 55) + 'px' }">
      <view class="search-bar__inner glass-panel">
        <text class="search-bar__icon">🔍</text>
        <input
          class="search-bar__input"
          v-model="store.searchQuery"
          placeholder="搜索海口的美食、店铺或地址..."
          placeholder-style="color: #666; font-size: 24rpx;"
        />
        <text
          v-if="store.searchQuery"
          class="search-bar__clear"
          @tap="clearSearch"
        >
          ✖
        </text>
      </view>

      <!-- 快捷标签 -->
      <scroll-view scroll-x class="tags-scroll" :show-scrollbar="false">
        <view class="tags">
          <view
            class="tag"
            :class="{ 'tag--active': store.activeCategory === null }"
            @tap="store.activeCategory = null"
          >
            ALL
          </view>
          <view
            class="tag"
            v-for="cat in store.topCategories"
            :key="cat"
            :class="{ 'tag--active': store.activeCategory === cat }"
            @tap="toggleCategory(cat)"
          >
            {{ cat }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 地图 -->
    <map
      id="mainMap"
      class="map"
      :latitude="centerLat"
      :longitude="centerLng"
      :markers="mapMarkers"
      :show-location="true"
      @markertap="onMarkerTap"
      @tap="onMapTap"
    ></map>

    <!-- 浮动添加按钮 -->
    <view class="fab-btn" @tap="goSubmit">
      <text class="fab-icon">+</text>
    </view>

    <!-- 底部详情弹出 -->
    <BottomSheet v-model="showBottomSheet">
      <view class="sheet-content" v-if="selectedRestaurant">
        <view class="sheet-header">
          <text class="sheet-title">{{ selectedRestaurant.name }}</text>
          <view
            class="sheet-fav"
            :class="{ 'sheet-fav--active': store.isFavorite(selectedRestaurant._id) }"
            @tap="store.toggleFavorite(selectedRestaurant._id)"
          >
            {{ store.isFavorite(selectedRestaurant._id) ? '♥' : '♡' }}
          </view>
        </view>

        <view class="sheet-info">
          <view class="sheet-row">
            <text class="sheet-label">地址</text>
            <text class="sheet-text">{{ selectedRestaurant.address || '海口市' }}</text>
          </view>
          <view class="sheet-row">
            <text class="sheet-label">电话</text>
            <text class="sheet-tel" @tap="callPhone(selectedRestaurant.telephone)">
              {{ selectedRestaurant.telephone || '暂无电话' }}
            </text>
          </view>
        </view>

        <view class="sheet-actions">
          <button class="btn-nav" @tap="goDetail(selectedRestaurant._id)">
            查看详情
          </button>
          <button class="btn-primary" @tap="navigate(selectedRestaurant)">
            出发导航
          </button>
        </view>
      </view>
    </BottomSheet>

    <Toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRestaurantStore } from '../../stores/restaurant'
import type { Restaurant } from '../../types/restaurant'
import NavBar from '../../components/NavBar/NavBar.vue'
import BottomSheet from '../../components/BottomSheet/BottomSheet.vue'
import Toast from '../../components/Toast/Toast.vue'

const store = useRestaurantStore()
const toastRef = ref<any>(null)
const showBottomSheet = ref(false)

// 使用 Store 中的全局高度，解决父组件无法 inject 子组件 provide 的问题
const navBarHeight = computed(() => store.navBarHeight)

const centerLng = ref(110.3294)
const centerLat = ref(20.0174)

onLoad(() => {
  if (store.restaurants.length === 0) {
    store.fetchAll().then(() => {
      setTimeout(() => {
        autoFitMap()
      }, 500)
    }).catch(() => {
      toastRef.value?.show('网络请求失败，请检查后端', 'error')
    })
  } else {
    setTimeout(() => {
      autoFitMap()
    }, 500)
  }
})

onShow(() => {
  // Sync unselected state when map shown
  if (!store.selectedId) {
    showBottomSheet.value = false
  }
  
  // 仅在已有数据时尝试
  if (store.restaurants.length > 0) {
    setTimeout(() => {
      autoFitMap()
    }, 500)
  }
})

function autoFitMap() {
  const mapContext = uni.createMapContext('mainMap')
  const points = store.filteredRestaurants.map(r => ({
    latitude: r.location.coordinates[1],
    longitude: r.location.coordinates[0]
  }))
  
  if (points.length > 0) {
    mapContext.includePoints({
      points: points,
      padding: [240, 60, 60, 60] // 再次增加顶部 padding，配合下移后的搜索框
    })
  }
}

// 监听选中项，自动打开抽屉
watch(() => store.selectedId, (id) => {
  if (id) {
    showBottomSheet.value = true
    const rest = store.restaurants.find(r => r._id === id)
    if (rest) {
      centerLng.value = rest.location.coordinates[0]
      centerLat.value = rest.location.coordinates[1]
    }
  } else {
    showBottomSheet.value = false
  }
})

// 监听 bottomSheet 关闭事件，同步取消选中状态
watch(showBottomSheet, (val) => {
  if (!val && store.selectedId) {
    store.selectRestaurant(null)
  }
})

function clearSearch() {
  store.searchQuery = ''
}

function toggleCategory(cat: string) {
  store.activeCategory = store.activeCategory === cat ? null : cat
}

function onMarkerTap(e: any) {
  const markerId = e.markerId as number
  const rest = store.filteredRestaurants[markerId]
  if (rest) {
    if (rest.is_verified === false) {
      toastRef.value?.show('此餐厅正在审阅中，暂时无法查看详情', 'info')
    } else {
      store.selectRestaurant(rest._id)
    }
  }
}

function onMapTap() {
  store.selectRestaurant(null)
}

const mapMarkers = computed(() => {
  return store.filteredRestaurants.map((rest, index) => {
    const isSelected = store.selectedId === rest._id
    const isVerified = rest.is_verified !== false
    return {
      id: index, // 小程序 markers 必须绑定 number ID
      latitude: rest.location.coordinates[1],
      longitude: rest.location.coordinates[0],
      title: rest.name,
      iconPath: isSelected ? '/static/marker-selected.png' : (isVerified ? '/static/marker-verified.png' : '/static/marker-unverified.png'),
      width: isSelected ? 30 : 20,
      height: isSelected ? 30 : 20,
      zIndex: isSelected ? 110 : 100,
      callout: isVerified ? undefined : {
        content: '审核中',
        color: '#666666',
        fontSize: 10,
        borderRadius: 4,
        bgColor: '#111111',
        padding: 4,
        display: 'BYCLICK'
      }
    }
  })
})

const selectedRestaurant = computed(() => store.selectedRestaurant)

function callPhone(tel?: string) {
  if (tel) {
    uni.makePhoneCall({ phoneNumber: tel })
  }
}

function goDetail(id: string) {
  const rest = store.restaurants.find(r => r._id === id)
  const nameParam = rest ? `&name=${encodeURIComponent(rest.name)}` : ''
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}${nameParam}` })
}

function navigate(rest: Restaurant) {
  uni.openLocation({
    latitude: Number(rest.location.coordinates[1]),
    longitude: Number(rest.location.coordinates[0]),
    name: rest.name,
    address: rest.address
  })
}

function goSubmit() {
  uni.navigateTo({ url: '/pages/submit/submit' })
}

const allPoints = computed(() => {
  return store.filteredRestaurants.map(rest => ({
    latitude: rest.location.coordinates[1],
    longitude: rest.location.coordinates[0]
  }))
})
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

.map {
  flex: 1;
  width: 100%;
}

.search-bar {
  position: absolute;
  top: 180rpx; // 落在自定义 Navbar 下方
  left: 32rpx;
  right: 32rpx;
  z-index: 10;

  &__inner {
    display: flex;
    align-items: center;
    padding: 0 24rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: #0a0a0a; // 设为不透明黑色，彻底杜绝透视重叠感
    border: 1rpx solid #333;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.5);
  }

  &__icon {
    font-size: 32rpx;
    color: #666;
    margin-right: 16rpx;
  }

  &__input {
    flex: 1;
    height: 100%;
    color: #fff;
    font-size: 26rpx;
  }

  &__clear {
    color: #666;
    padding: 10rpx;
  }
}

.tags-scroll {
  width: 100%;
  margin-top: 16rpx;
  white-space: nowrap;
}

.tags {
  display: flex;
  padding-bottom: 8rpx;
}

.tag {
  display: inline-block;
  padding: 8rpx 24rpx;
  border-radius: 32rpx;
  font-size: 20rpx;
  font-weight: bold;
  letter-spacing: 2rpx;
  text-transform: uppercase;
  margin-right: 16rpx;
  border: 1rpx solid #2a2a2a;
  background: rgba(10, 10, 10, 0.6);
  color: #666;

  &--active {
    background: #e31937;
    border-color: #e31937;
    color: #fff;
    box-shadow: 0 0 10rpx rgba(227, 25, 55, 0.4);
  }
}

/* BottomSheet 内容样式 */
.sheet-content {
  display: flex;
  flex-direction: column;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #2a2a2a;
  padding-bottom: 16rpx;
  margin-bottom: 16rpx;
}

.sheet-title {
  color: #e31937;
  font-size: 36rpx;
  font-weight: bold;
  flex: 1;
  margin-right: 24rpx;
}

.sheet-fav {
  font-size: 36rpx;
  color: #666;
  padding: 8rpx;
  border-radius: 50%;
  &--active {
    color: #e31937;
    background: rgba(227,25,55,0.2);
  }
}

.sheet-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.sheet-row {
  display: flex;
  align-items: flex-start;
}

.sheet-label {
  font-size: 20rpx;
  color: #666;
  font-weight: bold;
  text-transform: uppercase;
  width: 80rpx;
  margin-top: 6rpx;
}

.sheet-text {
  flex: 1;
  font-size: 26rpx;
  color: #ccc;
}

.sheet-tel {
  flex: 1;
  font-size: 28rpx;
  color: #e31937;
  font-family: monospace;
}

.sheet-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
}

.btn-nav {
  flex: 1;
  background: #2a2a2a;
  color: #fff;
  font-size: 26rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  &:active { background: #333; }
}

.btn-primary {
  flex: 1;
  background: #e31937;
  color: #fff;
  font-size: 26rpx;
  font-weight: bold;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  box-shadow: 0 0 20rpx rgba(227,25,55,0.4);
  &:active { opacity: 0.8; }
}

.fab-btn {
  position: absolute;
  right: 32rpx;
  bottom: 60rpx;
  width: 96rpx;
  height: 96rpx;
  background: #e31937;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(227, 25, 55, 0.4);
  z-index: 100;
  &:active { transform: scale(0.9); opacity: 0.9; }
}

.fab-icon {
  color: #fff;
  font-size: 56rpx;
  font-weight: 300;
  margin-top: -4rpx;
}
</style>

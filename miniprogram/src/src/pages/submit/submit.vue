<template>
  <view class="container">
    <NavBar title="发布推荐" :back="true" />
    
    <scroll-view scroll-y class="form-scroll">
      <view class="form-wrapper">
        <!-- Tesla Style Header: Minimalist & Pure -->
        <view class="tesla-header">
          <text class="title">发现美味</text>
          <text class="subtitle">SHARE YOUR FAVORITE LOCATIONS IN HAIKOU</text>
        </view>

        <!-- Minimalist Form: No Borders, High Contrast -->
        <view class="tesla-form">
          <view class="form-group">
            <text class="label">餐厅名称</text>
            <input 
              class="tesla-input" 
              v-model="formData.name" 
              placeholder="请输入店铺全称..." 
              placeholder-class="placeholder"
            />
          </view>

          <view class="form-group">
            <text class="label">推荐理由</text>
            <textarea 
              class="tesla-textarea" 
              v-model="formData.reason" 
              placeholder="请描述您的推荐理由，例如必点菜品..." 
              placeholder-class="placeholder"
            />
          </view>

          <view class="form-group">
            <text class="label">地理位置</text>
            <view class="location-picker" @tap="chooseLocation">
              <text class="loc-text">{{ formData.address || '在地图上选择位置' }}</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>

        <!-- Tesla Red Submit Button -->
        <view class="btn-area">
          <button
            class="tesla-btn"
            :class="{ 'btn--disabled': !isValid || submitting }"
            :disabled="!isValid || submitting"
            @tap="onSubmit"
          >
            <text v-if="submitting" class="loading-icon spin">⏳</text>
            <text class="btn-text">{{ submitting ? '正在提交...' : '立即发布' }}</text>
          </button>
        </view>
        
        <view class="footer-note">
          <text>提交后需经管理员审核方可公开展示</text>
        </view>
      </view>
      
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRestaurantStore } from '../../stores/restaurant'
import NavBar from '../../components/NavBar/NavBar.vue'
import { restaurantApi } from '../../api/restaurant'

const store = useRestaurantStore()
const submitting = ref(false)

const formData = reactive({
  name: '',
  reason: '',
  address: '',
  location: null as any
})

const isValid = computed(() => {
  return formData.name.trim() && formData.reason.trim() && formData.address
})

function chooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      formData.address = res.address || res.name
      formData.location = {
        type: 'Point',
        coordinates: [res.longitude, res.latitude]
      }
    }
  })
}

async function onSubmit() {
  if (!isValid.value || submitting.value) return
  
  submitting.value = true
  try {
    await restaurantApi.submit({
      name: formData.name,
      address: formData.address,
      reason: formData.reason,
      location: formData.location
    })
    
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err) {
    uni.showToast({ title: '提交失败', icon: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000000;
  color: #ffffff;
}

.form-scroll {
  flex: 1;
  width: 100%;
  height: 100%; // ARCHITECT FIX: Lock height for centering
}

.form-wrapper {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center; // Vertical Centering
  padding: 60rpx 64rpx 100rpx;
  box-sizing: border-box;
}

.tesla-header {
  margin-bottom: 80rpx;
  text-align: center;

  .title {
    font-size: 64rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
    display: block;
    margin-bottom: 12rpx;
    color: #ffffff;
  }

  .subtitle {
    font-size: 18rpx;
    color: #555;
    letter-spacing: 2rpx;
    font-weight: 500;
  }
}

.tesla-form {
  display: flex;
  flex-direction: column;
  gap: 80rpx;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .label {
    font-size: 20rpx;
    font-weight: 700;
    text-transform: uppercase;
    color: #444;
    letter-spacing: 5rpx;
  }
}

.tesla-input, .tesla-textarea {
  background: transparent;
  border-bottom: 2rpx solid #222;
  padding: 20rpx 0;
  font-size: 32rpx;
  color: #fff;
  transition: all 0.3s ease;

  &:focus {
    border-bottom-color: #e31937;
  }
}

.tesla-textarea {
  height: 160rpx;
  width: 100%;
}

.location-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid #222;
  padding: 20rpx 0;

  &:active {
    opacity: 0.6;
  }

  .loc-text { 
    font-size: 28rpx; 
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  .arrow { color: #333; font-size: 36rpx; }
}

.btn-area {
  margin: 120rpx 0 60rpx;
}

.tesla-btn {
  background: #e31937;
  color: #fff;
  height: 100rpx;
  border-radius: 4rpx; // Sharp borders for Tesla minimalist feel
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  font-weight: 700;
  font-size: 28rpx;
  letter-spacing: 4rpx;
  border: none;
  transition: all 0.3s;

  &.btn--disabled {
    background: #111;
    color: #333;
  }

  &::after { display: none; }

  &:active:not(.btn--disabled) {
    background: #c2152f;
  }
}

.footer-note {
  text-align: center;
  margin-top: 40rpx;
  text {
    font-size: 20rpx;
    color: #444;
    letter-spacing: 1rpx;
    font-weight: 400;
  }
}

.spin {
  animation: rotate 1.2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}

.placeholder {
  color: #1a1a1a;
}
</style>

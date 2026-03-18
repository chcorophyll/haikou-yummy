<template>
  <view class="container">
    <!-- NavBar 必须在最外层以保持稳定 -->
    <NavBar title="推荐宝藏店" :back="true" />
    
    <scroll-view scroll-y class="form-container">
      <!-- Tesla Style Header -->
      <view class="tesla-header">
        <text class="title">分享您的美食发现</text>
        <text class="subtitle">让更多人发现海口值得去的角落</text>
      </view>

      <!-- Glassmorphism Card -->
      <view class="glass-card">
        <view class="form-group">
          <text class="label">餐厅名称</text>
          <input 
            class="tesla-input" 
            v-model="formData.name" 
            placeholder="请输入餐厅名称" 
            placeholder-class="placeholder"
          />
        </view>

        <view class="form-group">
          <text class="label">推荐理由</text>
          <textarea 
            class="tesla-textarea" 
            v-model="formData.reason" 
            placeholder="说说为什么推荐这家店？推荐菜品是什么？" 
            placeholder-class="placeholder"
          />
        </view>

        <view class="form-group">
          <text class="label">位置信息</text>
          <view class="location-picker" @tap="chooseLocation">
            <view class="loc-left">
              <text class="icon">📍</text>
              <text class="loc-text">{{ formData.address || '点击选择餐厅位置' }}</text>
            </view>
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
          <text class="btn-text">{{ submitting ? '提交中...' : '提交' }}</text>
        </button>
      </view>
      
      <!-- Footer Spacer -->
      <view class="footer-note">
        <text>您的推荐在审核通过后将正式上线地图</text>
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
    
    uni.showToast({ title: '提交成功，感谢分享', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err) {
    uni.showToast({ title: '提交失败，请重试', icon: 'error' })
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
  background: #000000; /* Tesla Deep Black */
  color: #ffffff;
}

.form-container {
  flex: 1;
  padding: 0 48rpx;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
}

.tesla-header {
  padding: 80rpx 0 60rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .title {
    font-size: 64rpx;
    font-weight: 600;
    letter-spacing: -3rpx;
  }

  .subtitle {
    font-size: 28rpx;
    color: #666;
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(40px);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 48rpx;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  gap: 56rpx;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .label {
    font-size: 22rpx;
    font-weight: 700;
    text-transform: uppercase;
    color: #444;
    letter-spacing: 3rpx;
  }
}

.tesla-input, .tesla-textarea {
  background: rgba(255, 255, 255, 0.02);
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  color: #fff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    border-color: #e31937;
    background: rgba(227, 25, 55, 0.03);
    box-shadow: 0 0 20rpx rgba(227, 25, 55, 0.1);
  }
}

.tesla-textarea {
  height: 240rpx;
  width: auto;
}

.location-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
  padding: 28rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);

  .loc-left {
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;
  }

  .icon { font-size: 32rpx; margin-right: 20rpx; }
  .loc-text { 
    font-size: 28rpx; 
    color: #bbb;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .arrow { color: #333; font-size: 36rpx; }
}

.btn-area {
  margin: 100rpx 0 40rpx;
}

.tesla-btn {
  background: #e31937;
  color: #fff;
  height: 110rpx;
  border-radius: 55rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  font-weight: 700;
  font-size: 34rpx;
  border: none;
  box-shadow: 0 15rpx 40rpx rgba(227, 25, 55, 0.35);
  transition: all 0.3s;

  &.btn--disabled {
    background: #1a1a1a;
    color: #444;
    box-shadow: none;
  }

  &::after { display: none; }

  &:active:not(.btn--disabled) {
    transform: translateY(2rpx);
    opacity: 0.9;
    box-shadow: 0 5rpx 20rpx rgba(227, 25, 55, 0.2);
  }
}

.footer-note {
  text-align: center;
  padding-bottom: 60rpx;
  text {
    font-size: 22rpx;
    color: #444;
  }
}

.loading-icon {
  font-size: 36rpx;
}

.spin {
  animation: rotate 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}

.placeholder {
  color: #222;
}
</style>

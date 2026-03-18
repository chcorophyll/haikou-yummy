<template>
  <view
    class="card"
    :class="{ 'card--selected': isSelected }"
    @tap="$emit('tap', restaurant)"
  >
    <!-- 封面图 -->
    <view class="card__image">
      <image
        :src="restaurant.images?.[0] || 'https://placehold.co/200x200/222/555?text=Yummy'"
        mode="aspectFill"
        class="card__img"
      />
      <view class="card__image-overlay" />
      <text class="card__badge">{{ restaurant.rating || 'New' }}</text>
    </view>

    <!-- 内容区 -->
    <view class="card__body">
      <view class="card__top">
        <view class="card__info">
          <text class="card__name" :class="{ 'card__name--active': isSelected }">
            {{ restaurant.name }}
          </text>
          <text class="card__address">{{ restaurant.address || '海口市' }}</text>
        </view>
        <!-- 收藏按钮 -->
        <view
          class="card__fav"
          :class="{ 'card__fav--active': isFav }"
          @tap.stop="$emit('toggle-favorite', restaurant._id)"
        >
          <text class="card__fav-icon">{{ isFav ? '♥' : '♡' }}</text>
        </view>
      </view>

      <view class="card__footer">
        <text class="card__tel-label">TEL</text>
        <text class="card__tel">{{ restaurant.telephone || '暂无电话' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Restaurant } from '../../types/restaurant'

defineProps<{
  restaurant: Restaurant
  isSelected?: boolean
  isFav?: boolean
}>()
defineEmits<{
  (e: 'tap', r: Restaurant): void
  (e: 'toggle-favorite', id: string): void
}>()
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  background: #161616;
  border-radius: 24rpx;
  overflow: hidden;
  border: 1rpx solid #2a2a2a;
  transition: border-color 0.3s;
  active-opacity: 0.7;

  &--selected {
    border-color: #e31937;
    box-shadow: 0 0 20rpx rgba(227, 25, 55, 0.4);
  }

  &__image {
    width: 220rpx;
    flex-shrink: 0;
    position: relative;
    min-height: 160rpx;
  }
  &__img {
    width: 100%;
    height: 100%;
  }
  &__image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    z-index: 1;
  }
  &__badge {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
    z-index: 2;
    font-size: 20rpx;
    font-weight: 700;
    color: #fff;
    background: rgba(227,25,55,0.9);
    padding: 4rpx 10rpx;
    border-radius: 8rpx;
    text-transform: uppercase;
    letter-spacing: 2rpx;
  }

  &__body {
    flex: 1;
    padding: 20rpx 24rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }
  &__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8rpx;
  }
  &__info {
    flex: 1;
    min-width: 0;
  }
  &__name {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: #ffffff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s;
    &--active { color: #e31937; }
  }
  &__address {
    display: block;
    font-size: 22rpx;
    color: #666;
    margin-top: 6rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__fav {
    padding: 12rpx;
    border-radius: 9999rpx;
    transition: background 0.3s;
    &--active { background: rgba(227,25,55,0.2); }
  }
  &__fav-icon {
    font-size: 32rpx;
    color: #666;
    .card__fav--active & { color: #e31937; }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid rgba(255,255,255,0.05);
  }
  &__tel-label {
    font-size: 18rpx;
    color: #666;
    font-weight: 700;
    letter-spacing: 2rpx;
  }
  &__tel {
    font-size: 24rpx;
    color: #cccccc;
    font-family: monospace;
  }
}
</style>

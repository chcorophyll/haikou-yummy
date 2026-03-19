import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Restaurant } from '../types/restaurant'
import { restaurantApi } from '../api/restaurant'

const STORAGE_KEY = 'haikou_yummy_favorites'

export const useRestaurantStore = defineStore('restaurant', () => {
  const restaurants = ref<Restaurant[]>([])
  const loading = ref(false)
  const selectedId = ref<string | null>(null)
  const searchQuery = ref('')
  const activeCategory = ref<string | null>(null)
  
  // --- 系统信息与导航栏高度 ---
  const sysInfo = uni.getSystemInfoSync()
  const statusBarHeight = sysInfo.statusBarHeight || 0
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null
  
  const navBarHeight = ref<number>(88) // 默认值
  const menuButtonHeight = ref<number>(32) // 默认值

  if (menuButtonInfo) {
    navBarHeight.value = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height + statusBarHeight
    menuButtonHeight.value = menuButtonInfo.height
  } else {
    navBarHeight.value = statusBarHeight + 44
  }

  const favoriteIds = ref<string[]>(
    JSON.parse(uni.getStorageSync(STORAGE_KEY) || '[]')
  )

  // --- Computed ---
  const filteredRestaurants = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return restaurants.value.filter(r => {
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.category?.some(c => c.toLowerCase().includes(q))
      const matchCategory =
        !activeCategory.value || r.category?.includes(activeCategory.value)
      return matchSearch && matchCategory
    })
  })

  const verifiedRestaurants = computed(() =>
    filteredRestaurants.value.filter(r => r.is_verified !== false)
  )

  const topCategories = computed(() => {
    const counts: Record<string, number> = {}
    verifiedRestaurants.value.forEach(r => {
      r.category?.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat)
  })

  const selectedRestaurant = computed(() =>
    restaurants.value.find(r => r._id === selectedId.value) ?? null
  )

  // --- Actions ---
  async function fetchAll() {
    loading.value = true
    try {
      restaurants.value = await restaurantApi.list()
    } finally {
      loading.value = false
    }
  }

  function selectRestaurant(id: string | null) {
    selectedId.value = id
  }

  function toggleFavorite(id: string) {
    const idx = favoriteIds.value.indexOf(id)
    if (idx >= 0) {
      favoriteIds.value.splice(idx, 1)
    } else {
      favoriteIds.value.push(id)
    }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(favoriteIds.value))
  }

  function isFavorite(id: string) {
    return favoriteIds.value.includes(id)
  }

  function clearFavorites() {
    favoriteIds.value = []
    uni.setStorageSync(STORAGE_KEY, '[]')
  }

  return {
    restaurants,
    loading,
    selectedId,
    searchQuery,
    activeCategory,
    navBarHeight,
    menuButtonHeight,
    favoriteIds,
    filteredRestaurants,
    verifiedRestaurants,
    topCategories,
    selectedRestaurant,
    fetchAll,
    selectRestaurant,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  }
})

// 与 Web 端共用同一套 FastAPI 后端
// 在调试模式下，建议使用本机 IP 地址，确保微信开发者工具可以访问到。
const BASE_URL = 'http://192.168.1.240:8000'

function request<T>(options: UniApp.RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${options.url}`))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

import type { Restaurant } from '../types/restaurant'

export const restaurantApi = {
  /** 获取全部餐厅列表 */
  list(): Promise<Restaurant[]> {
    return request<Restaurant[]>({ url: '/api/v1/restaurants', method: 'GET' })
  },

  /** 附近餐厅（按距离） */
  nearby(lng: number, lat: number, radius = 3000): Promise<Restaurant[]> {
    return request<Restaurant[]>({
      url: `/api/v1/restaurants/nearby?lng=${lng}&lat=${lat}&radius=${radius}`,
      method: 'GET',
    })
  },

  /** 单个餐厅详情 */
  detail(id: string): Promise<Restaurant> {
    return request<Restaurant>({ url: `/api/v1/restaurants/${id}`, method: 'GET' })
  },

  /** 提交新店（待审核） */
  submit(data: Partial<Restaurant>): Promise<Restaurant> {
    return request<Restaurant>({
      url: '/api/v1/restaurants',
      method: 'POST',
      data: { ...data, is_verified: false },
    })
  },
}

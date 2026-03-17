import axios from 'axios';
import { Restaurant } from '../types/restaurant';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const restaurantService = {
  /**
   * 获取所有餐厅列表
   */
  async listRestaurants(limit: number = 100, skip: number = 0): Promise<Restaurant[]> {
    const response = await apiClient.get<Restaurant[]>('/restaurants/', {
      params: { limit, skip },
    });
    return response.data;
  },

  /**
   * 搜索附近的餐厅
   */
  async getNearbyRestaurants(
    longitude: number,
    latitude: number,
    maxDistance: number = 5000
  ): Promise<Restaurant[]> {
    const response = await apiClient.get<Restaurant[]>('/restaurants/nearby/', {
      params: {
        longitude,
        latitude,
        max_distance: maxDistance,
      },
    });
    return response.data;
  },

  /**
   * 获取餐厅详情
   */
  async getRestaurant(id: string): Promise<Restaurant> {
    const response = await apiClient.get<Restaurant>(`/restaurants/${id}`);
    return response.data;
  },
};

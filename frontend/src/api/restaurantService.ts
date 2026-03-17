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
  async listRestaurants(limit: number = 100, skip: number = 0, search?: string): Promise<Restaurant[]> {
    const response = await apiClient.get<Restaurant[]>('/restaurants/', {
      params: { limit, skip, q: search },
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

  /**
   * 更新餐厅信息
   */
  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await apiClient.put<Restaurant>(`/restaurants/${id}`, data);
    return response.data;
  },

  /**
   * 快速审核餐厅
   */
  async verifyRestaurant(id: string, verified: boolean): Promise<Restaurant> {
    const response = await apiClient.patch<Restaurant>(`/restaurants/${id}/verify`, null, {
      params: { verified }
    });
    return response.data;
  },

  /**
   * 删除餐厅
   */
  async deleteRestaurant(id: string): Promise<void> {
    await apiClient.delete(`/restaurants/${id}`);
  },

  /**
   * 新增餐厅
   */
  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await apiClient.post<Restaurant>('/restaurants/', data);
    return response.data;
  },
};

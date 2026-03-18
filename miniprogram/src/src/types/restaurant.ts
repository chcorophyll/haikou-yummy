// 与后端 FastAPI 返回结构保持一致
export interface Restaurant {
  _id: string
  name: string
  address?: string
  telephone?: string
  category?: string[]
  rating?: string | number
  images?: string[]
  is_verified?: boolean
  location: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
}

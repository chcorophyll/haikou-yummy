export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Restaurant {
  _id: string;
  name: string;
  category: string[];
  location: GeoJSONPoint;
  address?: string;
  images: string[];
  price_per_person?: number;
  opening_hours?: string;
  rating?: number;
  source: string;
  is_verified: boolean;
}

export interface RestaurantCreate extends Omit<Restaurant, '_id'> {}

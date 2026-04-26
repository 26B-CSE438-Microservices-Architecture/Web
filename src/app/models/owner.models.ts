export type RestaurantStatus = 'OPEN' | 'CLOSED';

export interface OwnerInfo {
  id?: string;
  restaurantId?: string;
  name: string;
  restaurantName: string;
  openClosedStatus: RestaurantStatus;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  description: string;
  cuisineType: string;
  addressText: string;
  latitude: number;
  longitude: number;
  logoUrl: string;
  minOrderAmount: number;
  deliveryFee: number;
  isActive: boolean;
  status: string;
  openingTime: string;
  closingTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRestaurantProfileDto {
  name: string;
  description: string;
  cuisineType: string;
  addressText: string;
  latitude: number;
  longitude: number;
  logoUrl: string;
  minOrderAmount: number;
  deliveryFee: number;
  openingTime: string;
  closingTime: string;
}

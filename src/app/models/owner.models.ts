export type RestaurantStatus = 'OPEN' | 'CLOSED' | 'BUSY';

export interface OwnerInfo {
  id?: string;
  restaurantId?: string;
  name: string;
  email?: string;
  phone?: string | null;
  role?: string;
  active?: boolean;
  createdAt?: string;
  restaurantName: string;
  openClosedStatus: RestaurantStatus;
  restaurantSetupRequired?: boolean;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  description: string;
  addressText: string;
  logoUrl: string;
  minOrderAmount: number;
  deliveryFee: number;
  status: string;
  openingTime: string;
  closingTime: string;
}

export interface UpdateRestaurantProfileDto {
  name: string;
  description: string;
  addressText: string;
  logoUrl: string;
  minOrderAmount: number;
  deliveryFee: number;
}

export type RestaurantStatus = 'OPEN' | 'CLOSED';

export interface OwnerInfo {
  id?: string;
  restaurantId?: string;
  name: string;
  restaurantName: string;
  openClosedStatus: RestaurantStatus;
}

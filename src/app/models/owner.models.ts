export type RestaurantStatus = 'OPEN' | 'CLOSED';

export interface OwnerInfo {
  name: string;
  restaurantName: string;
  openClosedStatus: RestaurantStatus;
}

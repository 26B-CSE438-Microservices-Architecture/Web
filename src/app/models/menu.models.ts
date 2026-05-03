export interface RestaurantSummary {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  minOrderAmount: number;
  deliveryFee: number;
  status: string;
  distanceKm?: number;
}

export interface CreateCategoryDto {
  name: string;
  displayOrder: number;
}

export interface UpdateCategoryDto {
  name: string;
  displayOrder: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export interface UpdateProductDto {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId?: string;
}

export interface UpdateStockDto {
  isAvailable: boolean;
}

export interface ProductDto {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string;
}

export interface CategoryDto {
  id: string;
  restaurantId: string;
  name: string;
  displayOrder: number;
  products: ProductDto[];
}

export interface MenuDto {
  restaurantId: string;
  restaurantName: string;
  categories: CategoryDto[];
}

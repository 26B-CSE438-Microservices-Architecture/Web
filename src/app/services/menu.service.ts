import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import {
  CategoryDto,
  CreateCategoryDto,
  CreateProductDto,
  MenuDto,
  ProductDto,
  RestaurantSummary,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateStockDto
} from '../models/menu.models';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly http = inject(HttpClient);

  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly vendorsApiUrl = `${this.apiBaseUrl}/vendors`;

  // Mock mode: false — data comes from the backend API
  private readonly useMockData = false;

  private readonly mockRestaurant: RestaurantSummary = {
    id: 'mock-restaurant-1',
    name: 'Mock Bistro',
    description: 'Local mock data only',
    logoUrl: '',
    minOrderAmount: 15,
    deliveryFee: 3.5,
    status: 'Open',
    distanceKm: 2.1
  };

  private mockMenu: MenuDto = {
    restaurantId: 'mock-restaurant-1',
    restaurantName: 'Mock Bistro',
    categories: [
      {
        id: 'cat-1',
        restaurantId: 'mock-restaurant-1',
        name: 'Mains',
        displayOrder: 1,
        products: [
          {
            id: 'prod-1',
            categoryId: 'cat-1',
            name: 'Cheeseburger',
            description: 'Cheddar, lettuce, tomato',
            price: 9.5,
            isAvailable: true,
            imageUrl: 'https://picsum.photos/200?1'
          },
          {
            id: 'prod-2',
            categoryId: 'cat-1',
            name: 'Grilled Chicken',
            description: 'Herb rub and lemon',
            price: 11.25,
            isAvailable: true,
            imageUrl: 'https://picsum.photos/200?2'
          }
        ]
      },
      {
        id: 'cat-2',
        restaurantId: 'mock-restaurant-1',
        name: 'Drinks',
        displayOrder: 2,
        products: [
          {
            id: 'prod-3',
            categoryId: 'cat-2',
            name: 'Iced Tea',
            description: 'Fresh brewed',
            price: 3.5,
            isAvailable: true,
            imageUrl: ''
          }
        ]
      }
    ]
  };

  getRestaurants(): Observable<RestaurantSummary[]> {
    if (this.useMockData) {
      return of([this.mockRestaurant]);
    }

    return this.http.get<unknown>(this.vendorsApiUrl).pipe(
      map(response => this.normalizeRestaurantList(response))
    );
  }

  getRestaurantMenu(restaurantId: string, restaurantName = ''): Observable<MenuDto> {
    if (this.useMockData) {
      if (restaurantId !== this.mockMenu.restaurantId) {
        return of({ ...this.mockMenu, restaurantId, restaurantName: 'Mock Bistro' });
      }
      return of(this.cloneMenu(this.mockMenu));
    }

    return this.http.get<unknown>(`${this.vendorsApiUrl}/${restaurantId}/menu`).pipe(
      map(response => this.normalizeMenuResponse(response, restaurantId, restaurantName))
    );
  }

  createCategory(restaurantId: string, payload: CreateCategoryDto): Observable<CategoryDto> {
    if (this.useMockData) {
      const newCategory: CategoryDto = {
        id: this.createId('cat'),
        restaurantId,
        name: payload.name,
        displayOrder: payload.displayOrder,
        products: []
      };

      this.mockMenu = {
        ...this.mockMenu,
        restaurantId,
        categories: [...this.mockMenu.categories, newCategory]
      };

      return of(newCategory);
    }

    return this.http.post<CategoryDto>(
      `${this.vendorsApiUrl}/${restaurantId}/categories`,
      payload
    );
  }

  updateCategory(categoryId: string, payload: UpdateCategoryDto): Observable<CategoryDto> {
    if (this.useMockData) {
      let updatedCategory: CategoryDto | null = null;

      this.mockMenu = {
        ...this.mockMenu,
        categories: this.mockMenu.categories.map((category) => {
          if (category.id !== categoryId) {
            return category;
          }

          updatedCategory = {
            ...category,
            name: payload.name,
            displayOrder: payload.displayOrder
          };

          return updatedCategory;
        })
      };

      return of(updatedCategory ?? this.createCategoryFallback(categoryId, payload));
    }

    return this.http.put<CategoryDto>(`${this.apiBaseUrl}/categories/${categoryId}`, payload);
  }

  deleteCategory(categoryId: string): Observable<void> {
    if (this.useMockData) {
      this.mockMenu = {
        ...this.mockMenu,
        categories: this.mockMenu.categories.filter((category) => category.id !== categoryId)
      };
      return of(undefined);
    }

    return this.http.delete<void>(`${this.apiBaseUrl}/categories/${categoryId}`);
  }

  createProduct(categoryId: string, payload: CreateProductDto): Observable<ProductDto> {
    if (this.useMockData) {
      const newProduct: ProductDto = {
        id: this.createId('prod'),
        categoryId,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        isAvailable: true,
        imageUrl: payload.imageUrl
      };

      this.mockMenu = {
        ...this.mockMenu,
        categories: this.mockMenu.categories.map((category) => {
          if (category.id !== categoryId) {
            return category;
          }

          return {
            ...category,
            products: [...category.products, newProduct]
          };
        })
      };

      return of(newProduct);
    }

    const { name, description, price, imageUrl } = payload;
    return this.http.post<ProductDto>(`${this.apiBaseUrl}/categories/${categoryId}/products`, {
      name,
      description,
      price,
      imageUrl
    });
  }

  updateProduct(productId: string, payload: UpdateProductDto): Observable<ProductDto> {
    if (this.useMockData) {
      let updatedProduct: ProductDto | null = null;
      let sourceCategoryId: string | null = null;
      const targetCategoryId = payload.categoryId ?? null;

      this.mockMenu = {
        ...this.mockMenu,
        categories: this.mockMenu.categories.map((category) => {
          const products = category.products.filter((product) => {
            if (product.id !== productId) {
              return true;
            }

            sourceCategoryId = category.id;
            const nextCategoryId = payload.categoryId ?? product.categoryId;
            const nextProduct: ProductDto = {
              ...product,
              name: payload.name,
              description: payload.description,
              price: payload.price,
              imageUrl: payload.imageUrl,
              categoryId: nextCategoryId
            };

            updatedProduct = nextProduct;

            if (payload.categoryId && payload.categoryId !== category.id) {
              return false;
            }

            return true;
          });

          return {
            ...category,
            products
          };
        })
      };

      if (updatedProduct && targetCategoryId && targetCategoryId !== sourceCategoryId) {
        const productToMove = updatedProduct;
        const targetCategoryExists = this.mockMenu.categories.some(
          (category) => category.id === targetCategoryId
        );

        if (targetCategoryExists) {
          this.mockMenu = {
            ...this.mockMenu,
            categories: this.mockMenu.categories.map((category) => {
              if (category.id !== targetCategoryId) {
                return category;
              }

              return {
                ...category,
                products: [...category.products, productToMove]
              };
            })
          };
        } else if (sourceCategoryId) {
          this.mockMenu = {
            ...this.mockMenu,
            categories: this.mockMenu.categories.map((category) => {
              if (category.id !== sourceCategoryId) {
                return category;
              }

              return {
                ...category,
                products: [...category.products, productToMove]
              };
            })
          };
        }
      }

      return of(updatedProduct ?? this.createProductFallback(productId, payload));
    }

    const { name, description, price, imageUrl } = payload;
    return this.http.put<ProductDto>(`${this.apiBaseUrl}/products/${productId}`, {
      name,
      description,
      price,
      imageUrl
    });
  }

  toggleProductStock(productId: string, payload: UpdateStockDto): Observable<ProductDto> {
    if (this.useMockData) {
      let updatedProduct: ProductDto | null = null;

      this.mockMenu = {
        ...this.mockMenu,
        categories: this.mockMenu.categories.map((category) => {
          const products = category.products.map((product) => {
            if (product.id !== productId) {
              return product;
            }

            const nextProduct: ProductDto = {
              ...product,
              isAvailable: payload.isAvailable
            };

            updatedProduct = nextProduct;

            return nextProduct;
          });

          return {
            ...category,
            products
          };
        })
      };

      return of(updatedProduct ?? this.createStockFallback(productId, payload));
    }

    return this.http.patch<ProductDto>(`${this.apiBaseUrl}/products/${productId}/stock`, payload);
  }

  deleteProduct(productId: string): Observable<void> {
    if (this.useMockData) {
      this.mockMenu = {
        ...this.mockMenu,
        categories: this.mockMenu.categories.map((category) => ({
          ...category,
          products: category.products.filter((product) => product.id !== productId)
        }))
      };
      return of(undefined);
    }

    return this.http.delete<void>(`${this.apiBaseUrl}/products/${productId}`);
  }

  private normalizeRestaurantList(response: unknown): RestaurantSummary[] {
    const record = this.asRecord(response);
    const data = Array.isArray(record['data']) ? record['data'] : [];

    return data.map((item) => this.normalizeRestaurantSummary(item));
  }

  private normalizeRestaurantSummary(value: unknown): RestaurantSummary {
    const item = this.asRecord(value);

    return {
      id: this.readString(item, 'id'),
      name: this.readString(item, 'name'),
      description: this.readString(item, 'description'),
      logoUrl: this.readString(item, 'logoUrl', 'logo_url', 'imageUrl', 'image_url'),
      minOrderAmount: this.readNumber(item, 'minOrderAmount', 'min_order_amount'),
      deliveryFee: this.readNumber(item, 'deliveryFee', 'delivery_fee'),
      status: this.readString(item, 'status'),
      distanceKm: this.readOptionalNumber(item, 'distanceKm', 'distance_km')
    };
  }

  private normalizeMenuResponse(
    response: unknown,
    restaurantId: string,
    restaurantName: string
  ): MenuDto {
    const menuRecord = this.asRecord(response);
    const rawCategories = Array.isArray(response)
      ? response
      : Array.isArray(menuRecord['categories'])
        ? (menuRecord['categories'] as unknown[])
        : [];

    return {
      restaurantId: this.readString(menuRecord, 'restaurantId', 'restaurant_id') || restaurantId,
      restaurantName: this.readString(menuRecord, 'restaurantName', 'restaurant_name') || restaurantName,
      categories: rawCategories.map((category, index) =>
        this.normalizeCategory(category, restaurantId, index)
      )
    };
  }

  private normalizeCategory(value: unknown, restaurantId: string, index: number): CategoryDto {
    const category = this.asRecord(value);
    const categoryId = this.readString(category, 'id');
    const rawProducts = Array.isArray(category['products']) ? category['products'] : [];

    return {
      id: categoryId,
      restaurantId: this.readString(category, 'restaurantId', 'restaurant_id') || restaurantId,
      name: this.readString(category, 'name', 'title'),
      displayOrder: this.readNumber(category, 'displayOrder', 'display_order', 'sortOrder', 'sort_order') || index,
      products: rawProducts.map((product) => this.normalizeProduct(product, categoryId))
    };
  }

  private normalizeProduct(value: unknown, categoryId: string): ProductDto {
    const product = this.asRecord(value);

    return {
      id: this.readString(product, 'id'),
      categoryId: this.readString(product, 'categoryId', 'category_id') || categoryId,
      name: this.readString(product, 'name'),
      description: this.readString(product, 'description'),
      price: this.readNumber(product, 'price'),
      isAvailable: this.readBoolean(product, 'isAvailable', 'is_available'),
      imageUrl: this.readString(product, 'imageUrl', 'image_url')
    };
  }

  private readString(record: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return '';
  }

  private readNumber(record: Record<string, unknown>, ...keys: string[]): number {
    const value = this.readOptionalNumber(record, ...keys);
    return value ?? 0;
  }

  private readOptionalNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return undefined;
  }

  private readBoolean(record: Record<string, unknown>, ...keys: string[]): boolean {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') {
        return value;
      }
    }

    return false;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private cloneMenu(menu: MenuDto): MenuDto {
    return {
      ...menu,
      categories: menu.categories.map((category) => ({
        ...category,
        products: category.products.map((product) => ({ ...product }))
      }))
    };
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private createCategoryFallback(categoryId: string, payload: UpdateCategoryDto): CategoryDto {
    return {
      id: categoryId,
      restaurantId: this.mockMenu.restaurantId,
      name: payload.name,
      displayOrder: payload.displayOrder,
      products: []
    };
  }

  private createProductFallback(productId: string, payload: UpdateProductDto): ProductDto {
    return {
      id: productId,
      categoryId: payload.categoryId ?? '',
      name: payload.name,
      description: payload.description,
      price: payload.price,
      isAvailable: true,
      imageUrl: payload.imageUrl
    };
  }

  private createStockFallback(productId: string, payload: UpdateStockDto): ProductDto {
    return {
      id: productId,
      categoryId: '',
      name: 'Unknown',
      description: '',
      price: 0,
      isAvailable: payload.isAvailable,
      imageUrl: ''
    };
  }
}

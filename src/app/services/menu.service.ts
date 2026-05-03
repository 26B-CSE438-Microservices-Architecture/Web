import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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

  private readonly apiBaseUrl = `${environment.apiBaseUrl}/vendors`;

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
            imageUrl: 'https://picsum.photos/200?1',
            stockCount: 18
          },
          {
            id: 'prod-2',
            categoryId: 'cat-1',
            name: 'Grilled Chicken',
            description: 'Herb rub and lemon',
            price: 11.25,
            isAvailable: true,
            imageUrl: 'https://picsum.photos/200?2',
            stockCount: 12
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
            imageUrl: '',
            stockCount: 40
          }
        ]
      }
    ]
  };

  getRestaurants(): Observable<RestaurantSummary[]> {
    if (this.useMockData) {
      return of([this.mockRestaurant]);
    }

    return this.http.get<RestaurantSummary[]>(this.apiBaseUrl);
  }

  getRestaurantMenu(restaurantId: string): Observable<MenuDto> {
    if (this.useMockData) {
      if (restaurantId !== this.mockMenu.restaurantId) {
        return of({ ...this.mockMenu, restaurantId, restaurantName: 'Mock Bistro' });
      }
      return of(this.cloneMenu(this.mockMenu));
    }

    return this.http.get<MenuDto>(`${this.apiBaseUrl}/${restaurantId}/menu`);
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
      `${this.apiBaseUrl}/${restaurantId}/categories`,
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
        imageUrl: payload.imageUrl,
        stockCount: payload.stockCount ?? 0
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
              categoryId: nextCategoryId,
              stockCount: payload.stockCount ?? product.stockCount ?? 0
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
      imageUrl: payload.imageUrl,
      stockCount: payload.stockCount ?? 0
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

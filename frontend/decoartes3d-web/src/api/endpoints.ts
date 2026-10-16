import type {
  AuthResponse,
  Category,
  CategoryWriteRequest,
  CreateOrderRequest,
  LoginRequest,
  Material,
  MaterialWriteRequest,
  Order,
  OrderStatus,
  OrderSummary,
  PagedResult,
  ProductDetail,
  ProductQuery,
  ProductSummary,
  ProductWriteRequest,
  RegisterRequest,
} from '../types/api'
import { api, toQueryString } from './client'

export const authApi = {
  login: (request: LoginRequest) => api.post<AuthResponse>('/api/auth/login', request),
  register: (request: RegisterRequest) => api.post<AuthResponse>('/api/auth/register', request),
}

export const productsApi = {
  list: (query: ProductQuery) => api.get<PagedResult<ProductSummary>>(`/api/products${toQueryString({ ...query })}`),
  featured: (count = 8) => api.get<ProductSummary[]>(`/api/products/featured${toQueryString({ count })}`),
  byId: (id: number) => api.get<ProductDetail>(`/api/products/${id}`),
  bySlug: (slug: string) => api.get<ProductDetail>(`/api/products/slug/${encodeURIComponent(slug)}`),
  create: (request: ProductWriteRequest) => api.post<ProductDetail>('/api/products', request),
  update: (id: number, request: ProductWriteRequest) => api.put<ProductDetail>(`/api/products/${id}`, request),
  remove: (id: number) => api.delete(`/api/products/${id}`),
}

export const categoriesApi = {
  active: () => api.get<Category[]>('/api/categories'),
  all: () => api.get<Category[]>('/api/categories/all'),
  create: (request: CategoryWriteRequest) => api.post<Category>('/api/categories', request),
  update: (id: number, request: CategoryWriteRequest) => api.put<Category>(`/api/categories/${id}`, request),
  remove: (id: number) => api.delete(`/api/categories/${id}`),
}

export const materialsApi = {
  active: () => api.get<Material[]>('/api/materials'),
  all: () => api.get<Material[]>('/api/materials/all'),
  create: (request: MaterialWriteRequest) => api.post<Material>('/api/materials', request),
  update: (id: number, request: MaterialWriteRequest) => api.put<Material>(`/api/materials/${id}`, request),
  remove: (id: number) => api.delete(`/api/materials/${id}`),
}

export interface OrderListQuery {
  pageNumber?: number
  pageSize?: number
  status?: OrderStatus
  userId?: number
}

export const ordersApi = {
  create: (request: CreateOrderRequest) => api.post<Order>('/api/orders', request),
  list: (query: OrderListQuery) => api.get<PagedResult<OrderSummary>>(`/api/orders${toQueryString({ ...query })}`),
  mine: () => api.get<OrderSummary[]>('/api/orders/mine'),
  byId: (id: number) => api.get<Order>(`/api/orders/${id}`),
  track: (orderNumber: string, email: string) =>
    api.get<Order>(`/api/orders/track${toQueryString({ orderNumber, email })}`),
  updateStatus: (id: number, status: OrderStatus) => api.patch<Order>(`/api/orders/${id}/status`, { status }),
  cancel: (id: number) => api.post<void>(`/api/orders/${id}/cancel`),
}

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { categoriesApi, materialsApi, ordersApi, productsApi, type OrderListQuery } from '../api/endpoints'
import type { ProductQuery } from '../types/api'

// Claves centralizadas: las mutaciones invalidan por prefijo (['products'], ['admin', ...]).
export const queryKeys = {
  products: (query: ProductQuery) => ['products', 'list', query] as const,
  featured: ['products', 'featured'] as const,
  product: (slug: string) => ['products', 'slug', slug] as const,
  productById: (id: number) => ['admin', 'products', id] as const,
  categories: ['categories', 'active'] as const,
  allCategories: ['admin', 'categories'] as const,
  materials: ['materials', 'active'] as const,
  allMaterials: ['admin', 'materials'] as const,
  myOrders: ['orders', 'mine'] as const,
  order: (id: number) => ['orders', id] as const,
  adminOrders: (query: OrderListQuery) => ['admin', 'orders', query] as const,
}

export const useProducts = (query: ProductQuery) =>
  useQuery({ queryKey: queryKeys.products(query), queryFn: () => productsApi.list(query), placeholderData: keepPreviousData })

export const useFeaturedProducts = (count = 8) =>
  useQuery({ queryKey: [...queryKeys.featured, count], queryFn: () => productsApi.featured(count) })

export const useProduct = (slug: string) =>
  useQuery({ queryKey: queryKeys.product(slug), queryFn: () => productsApi.bySlug(slug), enabled: slug.length > 0 })

export const useCategories = () =>
  useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.active, staleTime: 5 * 60_000 })

export const useMaterials = () =>
  useQuery({ queryKey: queryKeys.materials, queryFn: materialsApi.active, staleTime: 5 * 60_000 })

export const useMyOrders = () => useQuery({ queryKey: queryKeys.myOrders, queryFn: ordersApi.mine })

export const useOrder = (id: number) =>
  useQuery({ queryKey: queryKeys.order(id), queryFn: () => ordersApi.byId(id), enabled: Number.isFinite(id) && id > 0 })

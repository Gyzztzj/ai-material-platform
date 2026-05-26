import axiosInstance from './axios.instance'
import type { PaginatedResult } from '../../lib/shared-types'

export interface Template {
  id: number
  userId: number
  name: string
  prompt: string
  category: string
  params?: Record<string, unknown>
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateDto {
  name: string
  prompt: string
  category: string
  params?: Record<string, unknown>
  isPublic?: boolean
}

export interface UpdateTemplateDto {
  name?: string
  prompt?: string
  category?: string
  params?: Record<string, unknown>
  isPublic?: boolean
}

export const templateApi = {
  getAll: async (options?: {
    category?: string
    isPublic?: boolean
    search?: string
    page?: number
    limit?: number
  }) => {
    return axiosInstance.get<PaginatedResult<Template>>('/template', {
      params: options,
    })
  },

  getById: async (id: number) => {
    return axiosInstance.get<Template>(`/template/${id}`)
  },

  create: async (data: CreateTemplateDto) => {
    return axiosInstance.post<Template>('/template', data)
  },

  update: async (id: number, data: UpdateTemplateDto) => {
    return axiosInstance.put<Template>(`/template/${id}`, data)
  },

  delete: async (id: number) => {
    return axiosInstance.delete<{ message: string }>(`/template/${id}`)
  },

  copy: async (id: number) => {
    return axiosInstance.post<Template>(`/template/${id}/copy`)
  },
}

import axiosInstance from "./axios.instance";

export interface Material {
  id: number;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const materialApi = {
  getAll: async () => {
    return axiosInstance.get<PaginatedResult<Material>>("/material");
  },

  getById: async (id: number) => {
    return axiosInstance.get<Material>(`/material/${id}`);
  },

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance.post<Material>("/material/upload", formData);
  },

  update: async (id: number, data: Partial<{ name: string; category: string }>) => {
    return axiosInstance.put<Material>(`/material/${id}`, data);
  },

  delete: async (id: number) => {
    return axiosInstance.delete<{ message: string }>(`/material/${id}`);
  },
};

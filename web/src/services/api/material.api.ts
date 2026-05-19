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

export interface PreprocessConfig {
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  noiseReduction?: boolean;
  brightness?: number;
  contrast?: number;
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

  preprocess: async (id: number, config: PreprocessConfig) => {
    return axiosInstance.post<Material>(`/material/${id}/preprocess`, config);
  },

  batchPreprocess: async (materialIds: number[], config: PreprocessConfig) => {
    return axiosInstance.post<{ success: Material[]; failed: number[] }>("/material/batch-preprocess", {
      materialIds,
      preprocess: config,
    });
  },
};

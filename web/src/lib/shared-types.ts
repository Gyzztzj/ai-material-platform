export interface SizeOption {
  value: string;
  label: string;
  aspectRatio: string;
}

export interface AIModel {
  modelId: string;
  name: string;
  provider: string;
  model: string;
  cost: number;
  quality: number;
  enabled: boolean;
  supportedSizes?: SizeOption[];
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
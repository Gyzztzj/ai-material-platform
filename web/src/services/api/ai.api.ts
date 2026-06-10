import axiosInstance from './axios.instance'

export const aiApi = {
  generateImage: async (
    prompt: string,
    size: string = '1024x1024',
    modelId?: string,
  ) => {
    return axiosInstance.post('/ai/generate', { prompt, size, modelId })
  },

  getModels: async (taskType?: string) => {
    const params = taskType ? { taskType } : {}
    return axiosInstance.get('/ai/models', { params })
  },

  optimizePrompt: async (prompt: string, style?: string) => {
    return axiosInstance.post('/ai/optimize-prompt', { prompt, style })
  },

  removeBackground: async (imageUrl: string) => {
    return axiosInstance.post('/ai/remove-bg', { imageUrl })
  },

  editImage: async (
    imageUrl: string,
    prompt: string,
    options?: {
      task?: string
      mask?: string
      modelId?: string
      scale?: number
    },
  ) => {
    return axiosInstance.post('/ai/image-edit', {
      imageUrl,
      prompt,
      ...options,
    })
  },

  getTask: async (taskId: string) => {
    return axiosInstance.get(`/ai/tasks/${taskId}`)
  },

  batchRemoveBg: async (tasks: Array<{ imageUrl: string }>) => {
    return axiosInstance.post('/ai/batch/remove-bg', { tasks })
  },

  batchGenerate: async (tasks: Array<{ prompt: string; size?: string }>) => {
    return axiosInstance.post('/ai/batch/generate', { tasks })
  },

  getPresets: async (params?: {
    search?: string
    page?: number
    limit?: number
  }) => {
    return axiosInstance.get('/ai/presets', { params })
  },

  getPreset: async (id: number) => {
    return axiosInstance.get(`/ai/presets/${id}`)
  },

  createPreset: async (data: {
    name: string
    prompt: string
    modelId?: string
    size?: string
    style?: string
  }) => {
    return axiosInstance.post('/ai/presets', data)
  },

  updatePreset: async (
    id: number,
    data: {
      name?: string
      prompt?: string
      modelId?: string
      size?: string
      style?: string
    },
  ) => {
    return axiosInstance.put(`/ai/presets/${id}`, data)
  },

  deletePreset: async (id: number) => {
    return axiosInstance.delete(`/ai/presets/${id}`)
  },

  checkHealth: async () => {
    return axiosInstance.get('/health')
  },
}

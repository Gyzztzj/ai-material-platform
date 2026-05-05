import axiosInstance from "./axios.instance";

export const aiApi = {
  generateImage: async (prompt: string, size: string = "1024x1024", modelId?: string) => {
    return axiosInstance.post("/ai/generate", { prompt, size, modelId });
  },

  getModels: async (taskType?: string) => {
    const params = taskType ? { taskType } : {};
    return axiosInstance.get("/ai/models", { params });
  },

  optimizePrompt: async (prompt: string, style?: string) => {
    return axiosInstance.post("/ai/optimize-prompt", { prompt, style });
  },

  removeBackground: async (imageUrl: string) => {
    return axiosInstance.post("/ai/remove-bg", { imageUrl });
  },

  editImage: async (imageUrl: string, prompt: string, mask?: string) => {
    return axiosInstance.post("/ai/edit", { imageUrl, prompt, mask });
  },

  getTask: async (taskId: string) => {
    return axiosInstance.get(`/ai/tasks/${taskId}`);
  },

  batchRemoveBg: async (tasks: Array<{ imageUrl: string }>) => {
    return axiosInstance.post("/ai/batch/remove-bg", { tasks });
  },

  batchGenerate: async (
    tasks: Array<{ prompt: string; size?: string }>
  ) => {
    return axiosInstance.post("/ai/batch/generate", { tasks });
  },

  checkHealth: async () => {
    return axiosInstance.get("/health");
  },
};

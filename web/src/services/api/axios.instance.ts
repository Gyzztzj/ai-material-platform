import axios, { type AxiosError } from "axios";
import { toast } from "../../components/ui/Toast";

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api",
});

const authEndpoints = ["/user/login", "/user/register"];
let authFailedCount = 0;

// 429 重试配置
const MAX_RETRY_COUNT = 3;
const RETRY_BASE_DELAY_MS = 1000;

interface RetryConfig {
  __retryCount?: number;
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log(
    "请求拦截器 - URL:",
    config.url,
    "Params:",
    config.params,
    "Token:",
    token ? `存在 (长度: ${token.length})` : "不存在",
  );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      "响应成功 - URL:",
      response.config.url,
      "原始响应:",
      response.data,
    );
    // 后端包装了 { code: 200, data: xxx, message: 'success' }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      // 解包响应，让外部直接访问 data
      response.data = response.data.data;
    }
    console.log("处理后的响应数据:", response.data);
    authFailedCount = 0; // 成功时重置失败计数
    return response;
  },
  async (error: AxiosError & { config: RetryConfig & { __retryCount?: number } }) => {
    const config = error.config;
    const message =
      (error.response?.data as Record<string, unknown> | undefined)?.message as string | undefined
      || "请求失败";
    const url = config?.url || "";
    const status = error.response?.status;

    console.log("响应失败 - URL:", url, "Status:", status, "Error:", message);

    // 429 限流 → 指数退避重试
    if (status === 429 && config && !config.__retryCount) {
      config.__retryCount = 0;
    }

    if (status === 429 && config && (config.__retryCount ?? 0) < MAX_RETRY_COUNT) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, config.__retryCount - 1);
      console.log(
        `429 限流，第 ${config.__retryCount}/${MAX_RETRY_COUNT} 次重试，等待 ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return axiosInstance(config);
    }

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      url.includes(endpoint),
    );

    if (error.response?.status === 401 && !isAuthEndpoint) {
      authFailedCount++;
      console.error("认证失败，失败次数:", authFailedCount);
      console.error("  - 暂时禁用自动跳转，用于调试");
      toast("认证失败，请检查登录状态", "error");
    } else if (!isAuthEndpoint) {
      toast(message, "error");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

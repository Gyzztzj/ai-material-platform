import axios from "axios";
import { toast } from "../../components/ui/Toast";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

const authEndpoints = ["/user/login", "/user/register"];
let authFailedCount = 0;

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log(
    "请求拦截器 - URL:",
    config.url,
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
  (error) => {
    const message = error.response?.data?.message || "请求失败";
    const url = error.config?.url || "";
    const status = error.response?.status;

    console.log("响应失败 - URL:", url, "Status:", status, "Error:", message);

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      url.includes(endpoint),
    );

    if (error.response?.status === 401 && !isAuthEndpoint) {
      authFailedCount++;
      console.error("认证失败，失败次数:", authFailedCount);
      console.error("  - 暂时禁用自动跳转，用于调试");
      toast("认证失败，请检查登录状态", "error");

      // 连续失败多次才清除状态跳转，避免临时问题导致强制退出
      // if (authFailedCount >= 2) {
      //   console.error("多次认证失败，清除登录状态");
      //   localStorage.removeItem("token");
      //   localStorage.removeItem("user");
      //   window.location.href = "/login";
      //   toast("请先登录", "error");
      // }
    } else if (!isAuthEndpoint) {
      toast(message, "error");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

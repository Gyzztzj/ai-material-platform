import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';
import {
  NetworkException,
  ApiException,
  ValidationException,
} from '../exceptions';

const logger = new Logger('AIUtils');

export interface AIErrorResponse {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export class AIError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'AIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AIUtils {
  /**
   * 发送AI API请求的通用封装
   * @param config Axios请求配置
   * @param timeoutMs 超时时间（毫秒）
   * @returns Promise<T>
   */
  static async request<T = unknown>(
    config: AxiosRequestConfig,
    timeoutMs: number = 60000,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        ...config,
        timeout: timeoutMs,
      });
      return response.data;
    } catch (error) {
      this.logError(config, error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * 记录错误信息
   * @param config 请求配置
   * @param error 错误对象
   */
  private static logError(config: AxiosRequestConfig, error: unknown): void {
    const logData = {
      url: config.url,
      method: config.method,
      requestData: config.data,
      requestParams: config.params,
    };

    if (axios.isAxiosError(error)) {
      logger.error(
        JSON.stringify({
          ...logData,
          responseData: error.response?.data,
          responseStatus: error.response?.status,
          errorMessage: error.message,
        }),
      );
    } else {
      logger.error(
        JSON.stringify({
          ...logData,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  /**
   * 处理API错误
   * @param error 错误对象
   * @returns HttpException
   */
  static handleAPIError(error: unknown): any {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const data = error.response.data as Record<string, unknown>;
        const status = error.response.status;

        if (status === 400) {
          return new ValidationException(
            (data?.message as string) || '请求参数错误，请检查输入',
            data,
          );
        }

        const message =
          (data?.message as string) ||
          `AI服务请求失败: ${error.response.statusText}`;
        return new ApiException(message, status, data);
      } else if (error.request) {
        const errorMsg = error instanceof Error ? error.message : '网络错误';
        return new NetworkException('无法连接到AI服务，请稍后重试', {
          cause: errorMsg,
        });
      } else {
        const errorMsg =
          error instanceof Error ? error.message : '请求配置错误';
        return new ValidationException(`请求配置错误: ${errorMsg}`, {
          cause: errorMsg,
        });
      }
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    return new ApiException(errMsg || '未知错误');
  }

  /**
   * 轮询查询任务结果
   * @param taskId 任务ID
   * @param checkFunction 检查任务状态的函数
   * @param maxRetries 最大重试次数
   * @param retryIntervalMs 重试间隔（毫秒）
   * @param onProgress 更新进度的回调函数
   * @returns Promise<T>
   */
  static async pollTaskResult<T>(
    taskId: string,
    checkFunction: (taskId: string) => Promise<{
      status: 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'PROCESSING';
      result?: T;
      message?: string;
    }>,
    maxRetries: number = 60,
    retryIntervalMs: number = 5000,
    onProgress?: (progress: number) => Promise<void>,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const taskResult = await checkFunction(taskId);

        if (taskResult.status === 'SUCCEEDED') {
          if (taskResult.result !== undefined) {
            return taskResult.result;
          }
          throw new ApiException('任务成功但未返回结果');
        } else if (taskResult.status === 'FAILED') {
          throw new ApiException(taskResult.message || '任务执行失败');
        } else if (taskResult.status === 'CANCELED') {
          throw new ApiException('任务被取消');
        }

        if (onProgress) {
          const progress = Math.min(40 + Math.floor((i + 1) * 0.5), 60);
          await onProgress(progress);
        }

        await AIUtils.sleep(retryIntervalMs);
      } catch (error) {
        if (
          error instanceof ApiException ||
          error instanceof NetworkException ||
          error instanceof ValidationException
        ) {
          throw error;
        }
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await AIUtils.sleep(retryIntervalMs);
          continue;
        }
        throw AIUtils.handleAPIError(error);
      }
    }

    throw new ApiException('任务执行超时');
  }

  /**
   * 等待指定毫秒数
   * @param ms 等待毫秒数
   * @returns Promise<void>
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 带重试机制的请求
   * @param requestFn 请求函数
   * @param maxRetries 最大重试次数
   * @param retryDelayMs 重试延迟（毫秒）
   * @returns Promise<T>
   */
  static async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    retryDelayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < maxRetries - 1) {
          await AIUtils.sleep(retryDelayMs * (i + 1));
        }
      }
    }

    if (
      lastError &&
      (lastError instanceof ApiException ||
        lastError instanceof NetworkException ||
        lastError instanceof ValidationException)
    ) {
      throw lastError;
    }

    throw new ApiException(lastError?.message || '请求重试失败');
  }
}

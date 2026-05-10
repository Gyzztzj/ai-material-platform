import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiTask } from '../entities/ai-task.entity';
import { UserService } from 'src/user/user.service';
import { ModelSchedulerService } from '../model-scheduler.service';
import { AiModelService } from '../services/ai-model.service';
import { AIUtils } from '../../common/utils/ai.utils';
import { FileUtils } from '../../common/utils/file.utils';
import { TaskType } from '../entities/ai-model.entity';
import { Material } from 'src/material/entities/material.entity';
import { MaterialService } from 'src/material/material.service';

/**
 * 转换尺寸格式
 * @param size 输入的尺寸字符串
 * @param targetSeparator 目标分隔符 ('x' 或 '*')
 * @returns 转换后的尺寸字符串
 */
function convertSizeFormat(
  size: string | undefined,
  targetSeparator: 'x' | '*',
): string {
  if (!size) {
    return targetSeparator === 'x' ? '1024x1024' : '1024*1024';
  }

  // 替换所有可能的分隔符为目标分隔符
  return size.replace(/[xX*]/g, targetSeparator);
}

interface GenerateJobData {
  taskId: number;
  userId: number;
  generateImageDto: any;
}

@Processor('ai-queue')
@Injectable()
export class GenerateProcessor {
  private readonly logger = new Logger(GenerateProcessor.name);
  private readonly uploadDir = FileUtils.getUploadDir();

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
    private userService: UserService,
    private modelSchedulerService: ModelSchedulerService,
    private aiModelService: AiModelService,
    private materialService: MaterialService,
  ) {
    FileUtils.ensureDir(this.uploadDir);
  }

  @Process('generate')
  async handleGenerate(job: Job<GenerateJobData>) {
    const { taskId, userId, generateImageDto } = job.data;
    this.logger.log(`开始处理任务 ${taskId}，用户 ${userId}`);

    try {
      this.logger.log(`更新任务 ${taskId} 状态为 processing...`);
      await this.aiTaskRepository.update(taskId, {
        status: 'processing',
        progress: 20,
      });

      this.logger.log(`选择 AI 模型...`);
      let model;
      if (generateImageDto.modelId) {
        model = await this.modelSchedulerService.selectModelById(
          generateImageDto.modelId,
          TaskType.GENERATE,
        );
        if (!model) {
          this.logger.warn(
            `指定的模型 ${generateImageDto.modelId} 不存在或不可用，使用自动选择`,
          );
          model = await this.modelSchedulerService.selectBestModel(
            TaskType.GENERATE,
          );
        } else {
          this.logger.log(
            `使用用户指定的模型: ${model.name} (${model.provider})`,
          );
        }
      } else {
        model = await this.modelSchedulerService.selectBestModel(
          TaskType.GENERATE,
        );
        this.logger.log(`选中模型: ${model.name} (${model.provider})`);
      }

      if (model.provider === 'doubao') {
        const apiKey = this.configService.get('DOUBAI_API_KEY');
        if (!apiKey) {
          this.logger.error('豆包 API Key 未配置');
        }
      } else if (model.provider === 'tongyi') {
        const apiKey = this.configService.get('TONGYI_API_KEY');
        if (!apiKey) {
          this.logger.error('通义万相 API Key 未配置');
        }
      }

      let response;
      if (model.provider === 'doubao') {
        const apiKey = this.configService.get('DOUBAI_API_KEY');
        const baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

        const convertedSize = convertSizeFormat(generateImageDto.size, 'x');
        this.logger.log(`向豆包API发送请求，尺寸: ${convertedSize}`);
        response = await AIUtils.request(
          {
            method: 'POST',
            url: `${baseUrl}/images/generations`,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            data: {
              model: model.model,
              prompt: generateImageDto.prompt,
              size: convertedSize,
              n: generateImageDto.n || 1,
              response_format: 'url',
            },
          },
          120000,
        );
        this.logger.log(
          `豆包API响应成功: ${JSON.stringify(response).substring(0, 200)}...`,
        );
      } else if (model.provider === 'tongyi') {
        const apiKey = this.configService.get('TONGYI_API_KEY');

        // 构建请求头，通义模型全部默认使用异步
        const headers: any = {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        };

        this.logger.log(`向通义API发送异步请求...`);

        const convertedSize = convertSizeFormat(generateImageDto.size, '*');
        this.logger.log(`使用尺寸: ${convertedSize}`);

        // 所有通义模型都使用新的 API 格式
        const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
        response = await AIUtils.request(
          {
            method: 'POST',
            url: `${baseUrl}/services/aigc/image-generation/generation`,
            headers,
            data: {
              model: model.model,
              input: {
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: generateImageDto.prompt,
                      },
                    ],
                  },
                ],
              },
              parameters: {
                size: convertedSize,
                n: generateImageDto.n || 1,
              },
            },
          },
          120000,
        );
        this.logger.log(
          `通义API响应成功: ${JSON.stringify(response).substring(0, 200)}...`,
        );
      }

      await this.aiModelService.recordSuccess(model.modelId);

      let imageUrls: string[] = [];
      if (model.provider === 'tongyi') {
        this.logger.log(`通义API响应: ${JSON.stringify(response)}`);

        // 通义模型全部使用异步模式，先获取task_id再轮询
        if (response?.output?.task_id) {
          this.logger.log(`收到task_id，开始轮询任务...`);
          const apiKey = this.configService.get('TONGYI_API_KEY');
          imageUrls = await this.pollTaskResult(
            response.output.task_id,
            apiKey,
            taskId,
          );
        } else {
          this.logger.error(
            `异步模式下未收到task_id！响应: ${JSON.stringify(response)}`,
          );
          throw new Error('通义API异步模式响应异常，未返回task_id');
        }
      } else if (model.provider === 'doubao' && response?.data) {
        this.logger.log(`解析豆包API响应结果...`);
        imageUrls = response.data.map((item: any) => item.url);
      }

      this.logger.log(
        `提取到 ${imageUrls.length} 张图片URL: ${JSON.stringify(imageUrls)}`,
      );

      if (imageUrls.length === 0) {
        this.logger.error(
          `未能从API响应中提取到图片URL！完整响应: ${JSON.stringify(response)}`,
        );
        throw new Error('无法从API响应中提取图片URL，请检查API返回格式');
      }

      await this.aiTaskRepository.update(taskId, { progress: 80 });

      const savedUrls: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        this.logger.log(`下载并保存第 ${i + 1} 张图片...`);
        const imageBuffer = await FileUtils.downloadFromUrl(imageUrls[i]);
        const filename = `${taskId}_${i}.png`;
        const savedUrl = FileUtils.saveToUploads(
          filename,
          imageBuffer,
          this.uploadDir,
        );
        savedUrls.push(savedUrl);
      }

      this.logger.log(
        `任务 ${taskId} 处理完成！开始保存到素材库，共 ${savedUrls.length} 张图片`,
      );
      this.logger.log(`保存的图片URLs: ${JSON.stringify(savedUrls)}`);

      // 将生成的图片添加到素材库
      for (let i = 0; i < savedUrls.length; i++) {
        try {
          this.logger.log(`正在保存第 ${i + 1} 张图片到素材库...`);
          const material: Material = await this.materialService.create(userId, {
            name: `AI生成_${Date.now()}_${i + 1}.png`,
            url: savedUrls[i],
            type: 'generate',
            size: 0, // 后续可以优化获取实际文件大小
          });
          this.logger.log(
            `图片 ${i + 1} 已添加到素材库，素材ID: ${material.id}`,
          );
        } catch (err) {
          this.logger.error(`添加图片到素材库失败 (第 ${i + 1} 张):`, err);
          this.logger.error(`错误详情:`, err.stack || err);
        }
      }

      await this.aiTaskRepository.update(taskId, {
        status: 'completed',
        progress: 100,
        result: { images: savedUrls },
      });
    } catch (error) {
      this.logger.error('生成图片失败:', error);

      let model;
      try {
        model = await this.modelSchedulerService.selectBestModel(
          TaskType.GENERATE,
        );
        if (model) {
          await this.aiModelService.recordFailure(model.modelId);
        }
      } catch {
        // 忽略错误
      }

      try {
        const nextModel = await this.modelSchedulerService.selectBestModel(
          TaskType.GENERATE,
        );
        if (model && nextModel.modelId !== model.modelId) {
          this.logger.log(`尝试使用备用模型: ${nextModel.name}`);
          await this.handleGenerate(job);
          return;
        }
      } catch {
        this.logger.error('所有模型都不可用，返还积分');
        await this.userService.addCredits(userId, 1);
        await this.aiTaskRepository.update(taskId, {
          status: 'failed',
          error: '所有AI模型都不可用，请稍后再试',
        });
        return;
      }

      await this.userService.addCredits(userId, 1);
      await this.aiTaskRepository.update(taskId, {
        status: 'failed',
        error: error.message || '生成图片失败',
      });
    }
  }

  private async pollTaskResult(
    taskIdFromDashscope: string,
    apiKey: string,
    localTaskId: number,
  ): Promise<string[]> {
    this.logger.log(`开始轮询任务 ${taskIdFromDashscope}`);
    return AIUtils.pollTaskResult<string[]>(
      taskIdFromDashscope,
      async (taskId) => {
        const response = await axios.get(
          `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 30000,
          },
        );

        this.logger.log(
          `任务 ${taskId} 完整响应: ${JSON.stringify(response.data)}`,
        );
        const taskStatus = response.data.output.task_status;
        this.logger.log(`任务 ${taskId} 状态: ${taskStatus}`);

        if (taskStatus === 'SUCCEEDED') {
          let imageUrls: string[] = [];

          // 优先尝试wan2.7格式: output.choices[].message.content[].image
          if (
            response.data.output.choices &&
            Array.isArray(response.data.output.choices) &&
            response.data.output.choices.length > 0
          ) {
            this.logger.log(`解析wan2.7格式 (choices)...`);
            for (const choice of response.data.output.choices) {
              if (
                choice?.message?.content &&
                Array.isArray(choice.message.content)
              ) {
                for (const content of choice.message.content) {
                  if (content?.type === 'image' && content?.image) {
                    imageUrls.push(content.image);
                  }
                }
              }
            }
          }

          // 如果wan2.7格式没有找到，尝试旧版格式: output.results[].url
          if (
            imageUrls.length === 0 &&
            response.data.output.results &&
            Array.isArray(response.data.output.results) &&
            response.data.output.results.length > 0
          ) {
            this.logger.log(`解析wan2.6格式 (results)...`);
            imageUrls = response.data.output.results.map(
              (result: any) => result.url,
            );
          }

          if (imageUrls.length > 0) {
            this.logger.log(
              `任务 ${taskId} 成功，获取到 ${imageUrls.length} 张图片: ${JSON.stringify(imageUrls)}`,
            );
            return { status: 'SUCCEEDED', result: imageUrls };
          }

          this.logger.error(
            `任务成功但未返回图片！完整output: ${JSON.stringify(response.data.output)}`,
          );
          throw new Error('任务成功但未返回图片，请检查通义API响应格式');
        } else if (taskStatus === 'FAILED') {
          const errorMsg =
            response.data.output.message ||
            response.data.output.error_message ||
            '任务执行失败';
          this.logger.error(`任务 ${taskId} 失败: ${errorMsg}`);
          return {
            status: 'FAILED',
            message: errorMsg,
          };
        } else if (taskStatus === 'CANCELED') {
          return { status: 'CANCELED' };
        }

        return { status: 'PROCESSING' };
      },
      60,
      5000,
      async (progress) => {
        this.logger.log(`任务 ${localTaskId} 进度: ${progress}%`);
        await this.aiTaskRepository.update(localTaskId, { progress });
      },
    );
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
    );
  }
}

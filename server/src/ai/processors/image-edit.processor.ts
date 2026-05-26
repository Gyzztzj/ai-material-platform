import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { AiTask } from '../entities/ai-task.entity';
import { UserService } from 'src/user/user.service';
import { FileUtils } from '../../common/utils/file.utils';
import { MaterialService } from 'src/material/material.service';
import { AiModelService } from '../services/ai-model.service';
import { AIUtils } from '../../common/utils/ai.utils';

interface ImageEditJobData {
  taskId: number;
  userId: number;
  params: any;
}

@Processor('ai-queue')
@Injectable()
export class ImageEditProcessor {
  private readonly logger = new Logger(ImageEditProcessor.name);
  private readonly uploadDir = FileUtils.getUploadDir();

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
    private userService: UserService,
    private materialService: MaterialService,
    private aiModelService: AiModelService,
  ) {
    FileUtils.ensureDir(this.uploadDir);
  }

  @Process('image-edit')
  async handleImageEdit(job: Job<ImageEditJobData>) {
    const { taskId, userId, params: imageEditDto } = job.data;

    try {
      await this.aiTaskRepository.update(taskId, {
        status: 'processing',
        progress: 20,
      });

      this.logger.log(`开始处理图片编辑任务: ${JSON.stringify(imageEditDto)}`);

      // 获取模型
      const model = await this.aiModelService.findByModelId(
        imageEditDto.modelId || 'qwen-image-edit',
      );
      if (!model) {
        throw new Error('图片编辑模型不存在');
      }

      this.logger.log(`使用模型: ${model.name} (${model.model})`);

      const apiKey = this.configService.get('TONGYI_API_KEY');
      const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';

      // 读取本地图片并转换为 base64（阿里云无法访问 localhost）
      const imagePath = path.join(
        this.uploadDir,
        imageEditDto.imageUrl.replace('/uploads/', ''),
      );
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      const imageMimeType = imageEditDto.imageUrl.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';
      const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;

      this.logger.log(`输入图片已转换为 base64 (${imageBuffer.length} bytes)`);

      // 构建 prompt
      let prompt = '';
      switch (imageEditDto.task) {
        case 'background_replace':
          prompt = `将图片中的背景替换为：${imageEditDto.prompt || '美丽的自然风光'}`;
          break;
        case 'outpainting':
          prompt = `智能扩图，向外扩展图片内容，保持原图片风格一致`;
          break;
        case 'style_transfer':
          prompt = `将图片风格转换为：${imageEditDto.prompt || '油画风格'}`;
          break;
        default:
          prompt = imageEditDto.prompt || '优化这张图片';
      }

      this.logger.log(`生成的 prompt: ${prompt}`);

      // 构建请求头（同步模式，移除异步头）
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      // 发送同步请求
      const response = await AIUtils.request(
        {
          method: 'POST',
          url: `${baseUrl}/services/aigc/multimodal-generation/generation`,
          headers,
          data: {
            model: model.model,
            input: {
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    { type: 'image', image: imageDataUrl },
                  ],
                },
              ],
            },
            parameters: {
              n: 1,
            },
          },
        },
        120000,
      );

      this.logger.log(`通义API响应: ${JSON.stringify(response)}`);

      await this.aiTaskRepository.update(taskId, { progress: 70 });

      // 从同步响应中直接提取图片 URL
      const imageUrls: string[] = [];
      const anyResponse = response as any;

      // 尝试从同步响应格式中提取图片
      if (
        anyResponse?.output?.choices &&
        Array.isArray(anyResponse.output.choices)
      ) {
        for (const choice of anyResponse.output.choices) {
          if (
            choice.message?.content &&
            Array.isArray(choice.message.content)
          ) {
            for (const contentItem of choice.message.content) {
              if (contentItem.image) {
                imageUrls.push(contentItem.image);
              }
            }
          }
        }
      }

      // 如果没有找到，尝试其他可能的格式
      if (
        imageUrls.length === 0 &&
        anyResponse?.output?.results &&
        Array.isArray(anyResponse.output.results)
      ) {
        for (const result of anyResponse.output.results) {
          if (result.url) {
            imageUrls.push(result.url);
          }
        }
      }

      if (
        imageUrls.length === 0 &&
        anyResponse?.output?.images &&
        Array.isArray(anyResponse.output.images)
      ) {
        for (const img of anyResponse.output.images) {
          if (img.url) {
            imageUrls.push(img.url);
          }
        }
      }

      if (imageUrls.length === 0) {
        this.logger.error(
          `同步模式下未找到图片URL！响应: ${JSON.stringify(response)}`,
        );
        throw new Error('通义API同步模式响应异常，未返回图片URL');
      }

      this.logger.log(
        `提取到 ${imageUrls.length} 张图片URL: ${JSON.stringify(imageUrls)}`,
      );

      if (imageUrls.length === 0) {
        throw new Error('没有从 API 响应中提取到图片URL');
      }

      // 处理并保存结果
      const savedUrls: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        this.logger.log(`下载并保存第 ${i + 1} 张图片...`);
        const imageBuffer = await FileUtils.downloadFromUrl(imageUrls[i]);
        const filename = `${taskId}_edited_${i}.webp`;
        const processedUrl = FileUtils.saveToUploads(
          filename,
          imageBuffer,
          this.uploadDir,
        );
        savedUrls.push(processedUrl);
      }

      // 添加到素材库
      for (let i = 0; i < savedUrls.length; i++) {
        try {
          this.logger.log(`正在保存第 ${i + 1} 张图片到素材库...`);
          await this.materialService.create(userId, {
            name: `图片编辑_${Date.now()}_${i}.webp`,
            url: savedUrls[i],
            type: 'image-edit',
            size: 0,
          });
          this.logger.log(`图片 ${i + 1} 已添加到素材库`);
        } catch (err) {
          this.logger.error('添加编辑结果到素材库失败:', err);
        }
      }

      this.logger.log(
        `任务 ${taskId} 处理完成！开始保存结果: ${JSON.stringify(savedUrls)}`,
      );

      await this.aiTaskRepository.update(taskId, {
        status: 'completed',
        progress: 100,
        result: {
          original: imageEditDto.imageUrl,
          processed: savedUrls,
        },
      });
    } catch (error) {
      this.logger.error('图片编辑失败:', error);
      await this.userService.addCredits(userId, 1);
      await this.aiTaskRepository.update(taskId, {
        status: 'failed',
        error: error.message || '图片编辑失败',
      });
    }
  }

  private async pollTaskResult(
    taskId: string,
    apiKey: string,
    localTaskId: number,
  ): Promise<string[]> {
    const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
    const maxRetries = 60; // 最多等待60次，每2秒一次
    let retries = 0;

    while (retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries++;

      try {
        this.logger.log(`轮询任务结果 (${retries}/${maxRetries})...`);

        const response = await axios.get(`${baseUrl}/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        });

        const data = response.data;
        this.logger.log(`任务 ${taskId} 轮询响应: ${JSON.stringify(data)}`);

        if (data?.output?.task_status === 'SUCCEEDED') {
          this.logger.log('任务成功！');

          const imageUrls: string[] = [];

          // 尝试从不同格式解析
          if (data?.output?.choices && Array.isArray(data.output.choices)) {
            for (const choice of data.output.choices) {
              if (
                choice.message?.content &&
                Array.isArray(choice.message.content)
              ) {
                for (const contentItem of choice.message.content) {
                  if (contentItem.image) {
                    imageUrls.push(contentItem.image);
                  }
                }
              }
            }
          }

          // 如果没有找到，尝试旧格式
          if (
            imageUrls.length === 0 &&
            data?.output?.results &&
            Array.isArray(data.output.results)
          ) {
            for (const result of data.output.results) {
              if (result.url) {
                imageUrls.push(result.url);
              }
            }
          }

          // 如果还是没有找到，尝试 data.output 下的图片
          if (
            imageUrls.length === 0 &&
            data?.output?.images &&
            Array.isArray(data.output.images)
          ) {
            for (const img of data.output.images) {
              if (img.url) {
                imageUrls.push(img.url);
              }
            }
          }

          if (imageUrls.length > 0) {
            this.logger.log(`成功提取到图片: ${JSON.stringify(imageUrls)}`);
            return imageUrls;
          } else {
            this.logger.error(
              `无法从成功响应中提取图片: ${JSON.stringify(data)}`,
            );
            throw new Error('任务成功但无法提取图片URL');
          }
        } else if (data?.output?.task_status === 'FAILED') {
          this.logger.error(`任务失败: ${JSON.stringify(data)}`);
          throw new Error(
            data?.output?.code || data?.output?.message || '图片编辑任务失败',
          );
        } else {
          // 还在处理中，继续等待
          const progress = Math.min(
            70 + Math.floor((retries / maxRetries) * 25),
            95,
          );
          await this.aiTaskRepository.update(localTaskId, {
            progress,
          });
          this.logger.log(`任务还在处理中，当前进度: ${progress}%`);
        }
      } catch (error) {
        this.logger.error(
          `轮询任务失败 (${retries}/${maxRetries}):`,
          error.message,
        );
        // 如果是网络错误可以重试，其他错误直接抛出
        if (error.code !== 'ECONNABORTED' && retries >= maxRetries) {
          throw error;
        }
      }
    }

    throw new Error('图片编辑任务超时');
  }
}

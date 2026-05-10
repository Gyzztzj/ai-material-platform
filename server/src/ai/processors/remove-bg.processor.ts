import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiTask } from '../entities/ai-task.entity';
import { UserService } from 'src/user/user.service';
import { FileUtils } from '../../common/utils/file.utils';
import { MaterialService } from 'src/material/material.service';

interface RemoveBgJobData {
  taskId: number;
  userId: number;
  removeBgDto: any;
}

@Processor('ai-queue')
@Injectable()
export class RemoveBgProcessor {
  private readonly uploadDir = FileUtils.getUploadDir();

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
    private userService: UserService,
    private materialService: MaterialService,
  ) {
    FileUtils.ensureDir(this.uploadDir);
  }

  @Process('remove-bg')
  async handleRemoveBg(job: Job<RemoveBgJobData>) {
    const { taskId, userId, removeBgDto } = job.data;

    try {
      await this.aiTaskRepository.update(taskId, {
        status: 'processing',
        progress: 20,
      });

      const imageBuffer = await FileUtils.getImageBuffer(
        removeBgDto.imageUrl,
        this.uploadDir,
      );

      await this.aiTaskRepository.update(taskId, { progress: 50 });

      let resultBuffer: Buffer;
      const removeBgApiKey = this.configService.get('REMOVE_BG_API_KEY');
      if (removeBgApiKey) {
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('image_file', imageBuffer, {
          filename: 'input.jpg',
        });

        const response = await axios.post(
          'https://api.remove.bg/v1.0/removebg',
          formData,
          {
            headers: {
              'X-Api-Key': removeBgApiKey,
            },
            responseType: 'arraybuffer',
            timeout: 60000,
          },
        );
        resultBuffer = Buffer.from(response.data);
      } else {
        await this.userService.addCredits(userId, 1);
        throw new Error(
          '请在环境变量中配置 REMOVE_BG_API_KEY。' +
            '\n你可以从 https://www.remove.bg/api 获取免费API Key。' +
            '\n或者集成其他AI抠图服务（如豆包、阿里云视觉等）',
        );
      }

      await this.aiTaskRepository.update(taskId, { progress: 80 });

      const filename = `${taskId}_bg_removed.png`;
      const processedUrl = FileUtils.saveToUploads(
        filename,
        resultBuffer,
        this.uploadDir,
      );

      // 添加到素材库
      try {
        await this.materialService.create(userId, {
          name: `抠图_${Date.now()}.png`,
          url: processedUrl,
          type: 'remove-bg',
          size: 0,
        });
      } catch (err) {
        console.error('添加抠图结果到素材库失败:', err);
      }

      await this.aiTaskRepository.update(taskId, {
        status: 'completed',
        progress: 100,
        result: {
          original: removeBgDto.imageUrl,
          processed: processedUrl,
        } as any,
      });
    } catch (error) {
      console.error('抠图失败:', error);
      await this.aiTaskRepository.update(taskId, {
        status: 'failed',
        error: error.message || '抠图失败',
      });
    }
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AiController } from './ai.controller';
import { AiModelController } from './controllers/ai-model.controller';
import { PresetController } from './controllers/preset.controller';
import { AiTask } from './entities/ai-task.entity';
import { AiModel } from './entities/ai-model.entity';
import { GeneratePreset } from './entities/generate-preset.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { MaterialModule } from '../material/material.module';
import { ModelSchedulerService } from './model-scheduler.service';
import { GenerateService } from './services/generate.service';
import { RemoveBgService } from './services/remove-bg.service';
import { ImageEditService } from './services/image-edit.service';
import { TaskService } from './services/task.service';
import { AiModelService } from './services/ai-model.service';
import { PresetService } from './services/preset.service';
import { TaskCleanupService } from './services/task-cleanup.service';
import { GenerateProcessor } from './processors/generate.processor';
import { RemoveBgProcessor } from './processors/remove-bg.processor';
import { ImageEditProcessor } from './processors/image-edit.processor';
import { SeedService } from '../database/seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiTask, AiModel, GeneratePreset]),
    UserModule,
    AuthModule,
    MaterialModule,
    BullModule.registerQueue({
      name: 'ai-queue',
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      },
      limiter: {
        max: 20,
        duration: 1000,
      },
    }),
  ],
  controllers: [AiController, AiModelController, PresetController],
  providers: [
    ModelSchedulerService,
    GenerateService,
    RemoveBgService,
    ImageEditService,
    TaskService,
    AiModelService,
    PresetService,
    TaskCleanupService,
    GenerateProcessor,
    RemoveBgProcessor,
    ImageEditProcessor,
    SeedService,
  ],
  exports: [AiModelService],
})
export class AiModule {}

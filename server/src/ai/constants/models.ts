import { CallMode } from '../entities/ai-model.entity';

interface SizeOption {
  value: string;
  label: string;
  aspectRatio: string;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  cost: number;
  quality: number;
  enabled: boolean;
  callMode: CallMode;
  sizeSeparator: 'x' | '*';
  supportedSizes: SizeOption[];
}

export const AI_MODELS: { [key: string]: ModelConfig[] } = {
  generate: [
    {
      id: 'tongyi-wanx',
      name: '通义万相',
      provider: 'tongyi',
      model: 'wan2.7-image-pro',
      cost: 1,
      quality: 95,
      enabled: true,
      callMode: CallMode.ASYNC,
      sizeSeparator: '*',
      supportedSizes: [
        {
          value: '1024*1024',
          label: '1024×1024（正方形）',
          aspectRatio: '1:1',
        },
        { value: '1024*1792', label: '1024×1792（竖版）', aspectRatio: '9:16' },
        { value: '1792*1024', label: '1792×1024（横版）', aspectRatio: '16:9' },
        {
          value: '2048*2048',
          label: '2048×2048（2K正方形）',
          aspectRatio: '1:1',
        },
        {
          value: '4096*4096',
          label: '4096×4096（4K正方形）',
          aspectRatio: '1:1',
        },
      ],
    },
    {
      id: 'tongyi-wanx-26',
      name: '通义万相2.6',
      provider: 'tongyi',
      model: 'wan2.6-t2i',
      cost: 1,
      quality: 92,
      enabled: true,
      callMode: CallMode.BOTH,
      sizeSeparator: '*',
      supportedSizes: [
        {
          value: '1024*1024',
          label: '1024×1024（正方形）',
          aspectRatio: '1:1',
        },
        { value: '1024*1792', label: '1024×1792（竖版）', aspectRatio: '9:16' },
        { value: '1792*1024', label: '1792×1024（横版）', aspectRatio: '16:9' },
        {
          value: '1440*1440',
          label: '1440×1440（2K正方形）',
          aspectRatio: '1:1',
        },
      ],
    },
    {
      id: 'doubao-seedream',
      name: '豆包Seedream',
      provider: 'doubao',
      model: 'doubao-seedream-4-5-251128',
      cost: 1,
      quality: 90,
      enabled: true,
      callMode: CallMode.SYNC,
      sizeSeparator: 'x',
      supportedSizes: [
        {
          value: '1024x1024',
          label: '1024×1024（正方形）',
          aspectRatio: '1:1',
        },
        { value: '1440x2560', label: '1440×2560（竖版）', aspectRatio: '9:16' },
        { value: '2560x1440', label: '2560×1440（横版）', aspectRatio: '16:9' },
        {
          value: '2048x2048',
          label: '2048×2048（2K正方形）',
          aspectRatio: '1:1',
        },
        {
          value: '4096x4096',
          label: '4096×4096（4K正方形）',
          aspectRatio: '1:1',
        },
        { value: '2304x1728', label: '2304×1728（4:3）', aspectRatio: '4:3' },
        { value: '1728x2304', label: '1728×2304（3:4）', aspectRatio: '3:4' },
      ],
    },
  ],
  'remove-bg': [
    {
      id: 'tongyi-remove-bg',
      name: '通义抠图',
      provider: 'tongyi',
      model: 'wanx-image-editing-v1',
      cost: 1,
      quality: 90,
      enabled: true,
      callMode: CallMode.ASYNC,
      sizeSeparator: '*',
      supportedSizes: [],
    },
  ],
  'image-edit': [
    {
      id: 'tongyi-edit',
      name: '通义图片编辑',
      provider: 'tongyi',
      model: 'wanx-image-editing-v1',
      cost: 1,
      quality: 90,
      enabled: true,
      callMode: CallMode.ASYNC,
      sizeSeparator: '*',
      supportedSizes: [],
    },
  ],
};

export const MODEL_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  DOWN: 'down',
};

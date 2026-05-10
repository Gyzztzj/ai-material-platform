import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Body,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MaterialService } from './material.service';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('material')
@UseGuards(JwtAuthGuard)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = file.originalname.split('.').pop();
          const filename = `${uuidv4()}.${ext}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('只支持图片文件'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user,
  ) {
    const material = await this.materialService.create(user.id, {
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      type: 'image',
    });
    return material;
  }

  @Get()
  findAll(
    @CurrentUser() user,
    @Query('category') category?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.materialService.findAll(user.id, category, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.materialService.findOne(+id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialService.update(+id, user.id, updateMaterialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.materialService.remove(+id, user.id);
  }
}

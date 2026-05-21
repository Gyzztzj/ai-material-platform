import {
  Controller,
  Post,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Body,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TemplateService } from './template.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('template')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  create(@CurrentUser() user, @Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.create(user.id, createTemplateDto);
  }

  @Get()
  findAll(
    @CurrentUser() user,
    @Query('category') category?: string,
    @Query('isPublic') isPublic?: string,
    @Query('search') search?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.templateService.findAll(
      user.id,
      {
        category,
        isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
        search,
      },
      paginationDto,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.templateService.findOne(+id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templateService.update(+id, user.id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.templateService.remove(+id, user.id);
  }

  @Post(':id/copy')
  copyTemplate(@Param('id') id: string, @CurrentUser() user) {
    return this.templateService.copyTemplate(+id, user.id);
  }
}

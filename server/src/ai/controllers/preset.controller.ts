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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { PresetService } from '../services/preset.service';
import { CreatePresetDto, UpdatePresetDto } from '../dto/generate-preset.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('ai/presets')
@UseGuards(JwtAuthGuard)
export class PresetController {
  constructor(private readonly presetService: PresetService) {}

  @Post()
  create(@CurrentUser() user, @Body() createPresetDto: CreatePresetDto) {
    return this.presetService.create(user.id, createPresetDto);
  }

  @Get()
  findAll(
    @CurrentUser() user,
    @Query('search') search?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.presetService.findAll(user.id, { search }, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.presetService.findOne(+id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body() updatePresetDto: UpdatePresetDto,
  ) {
    return this.presetService.update(+id, user.id, updatePresetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.presetService.remove(+id, user.id);
  }
}

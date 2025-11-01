import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { QueryAuthorDto } from './dto/query-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorService: AuthorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAuthorDto: CreateAuthorDto) {
    return await this.authorService.create(createAuthorDto);
  }
  @Get()
  findAll(@Query() queryDto: QueryAuthorDto) {
    return this.authorService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthoDto: UpdateAuthorDto) {
    return this.authorService.update(id,updateAuthoDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.authorService.delete(id);
  }
}

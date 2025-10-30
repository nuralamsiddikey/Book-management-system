import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';


export class QueryBookDto extends PaginationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsMongoId()
  authorId?: string;
}
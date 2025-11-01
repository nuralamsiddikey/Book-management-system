import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { Model, Types } from 'mongoose';
import { CreateAuthorDto } from './dto/create-author.dto';
import { QueryAuthorDto } from './dto/query-author.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { paginate } from 'src/common/paginate';
import { buildFilterFromQuery } from 'src/common/query-builder';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDocument> {
    const author = new this.authorModel(createAuthorDto);
    return await author.save();
  }

  async findAll(
    queryDto: QueryAuthorDto,
  ): Promise<PaginatedResponse<AuthorDocument>> {
    const { page = 1, limit = 10} = queryDto;

    const filter = buildFilterFromQuery(queryDto);

    return paginate(this.authorModel, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
    });
  }

  async findOne(id: string): Promise<AuthorDocument> {
    this.validateObjectId(id);

    const author = await this.authorModel.findById(id).exec();
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
    return author;
  }

  async update(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
  ): Promise<AuthorDocument> {
    this.validateObjectId(id);

    const author = await this.authorModel
      .findByIdAndUpdate(id, updateAuthorDto, { new: true })
      .exec();

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async delete(id: string): Promise<void> {
    this.validateObjectId(id);
    const result = await this.authorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
  }
}

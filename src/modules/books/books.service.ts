import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { AuthorsService } from '../authors/authors.service';
import { paginate } from 'src/common/paginate';
import { buildFilterFromQuery } from 'src/common/query-builder';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    private readonly authorsService: AuthorsService,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<BookDocument> {
    await this.authorsService.findOne(createBookDto.authorId);

    const exists = await this.bookModel.findOne({
      $or: [{ title: createBookDto.title }, { isbn: createBookDto.isbn }],
    });

    if (exists) {
      throw new ConflictException(
        'Book with this title or ISBN already exists',
      );
    }

    const book = new this.bookModel({
      ...createBookDto,
      author: createBookDto.authorId,
    });
    return book.save();
  }

  async findAll(
    queryDto: QueryBookDto,
  ): Promise<PaginatedResponse<BookDocument>> {
    const { page = 1, limit = 10 } = queryDto;

    const filter = buildFilterFromQuery(queryDto);

    return paginate(this.bookModel, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: 'author',
    });
  }

  async findOne(id: string): Promise<BookDocument> {
    this.validateObjectId(id);

    const book = await this.bookModel.findById(id).populate('author').exec();

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
  ): Promise<BookDocument> {
    this.validateObjectId(id);

    const book = await this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .populate('author')
      .exec();

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async delete(id: string): Promise<BookDocument> {
    this.validateObjectId(id);

    const result = await this.bookModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return result;
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
  }
}

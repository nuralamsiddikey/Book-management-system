import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { Model } from 'mongoose';
import { CreateAuthorDto } from './dto/create-author.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
  ) {}

 async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDocument> {
    try {
      const author = new this.authorModel(createAuthorDto);
      return await author.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Author with this information already exists');
      }
      throw error;
    }
  }

  async findAll(){}
  async findOne(){}
  async update(){}
  async delete(){}

}

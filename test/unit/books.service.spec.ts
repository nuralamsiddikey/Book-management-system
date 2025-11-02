import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BooksService } from '../../src/modules/books/books.service';
import { Book } from '../../src/modules/books/schemas/book.schema';
import { AuthorsService } from '../../src/modules/authors/authors.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('BooksService', () => {
  let service: BooksService;
  let model: Model<Book>;
  let authorsService: AuthorsService;

  const mockBook = {
    _id: '507f1f77bcf86cd799439012',
    title: 'The Great Novel',
    isbn: '978-3-16-148410-0',
    publishedDate: new Date('2020-01-01'),
    genre: 'Fiction',
    author: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockBookModel = {
    new: jest.fn().mockResolvedValue(mockBook),
    constructor: jest.fn().mockResolvedValue(mockBook),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  const mockAuthorsService = {
    findOne: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getModelToken(Book.name),
          useValue: mockBookModel,
        },
        {
          provide: AuthorsService,
          useValue: mockAuthorsService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    model = module.get<Model<Book>>(getModelToken(Book.name));
    authorsService = module.get<AuthorsService>(AuthorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createBookDto = {
        title: 'The Great Novel',
        isbn: '978-3-16-148410-0',
        publishedDate: '2020-01-01',
        genre: 'Fiction',
        authorId: '507f1f77bcf86cd799439011',
      };

      mockBookModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockBook),
        }),
      });

      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockBook as any));

      const result = await service.create(createBookDto);
      expect(authorsService.findOne).toHaveBeenCalledWith(
        createBookDto.authorId,
      );
      expect(result).toEqual(mockBook);
    });

    it('should throw ConflictException for duplicate ISBN', async () => {
      const createBookDto = {
        title: 'The Great Novel',
        isbn: '978-3-16-148410-0',
        publishedDate: '2020-01-01',
        genre: 'Fiction',
        authorId: '507f1f77bcf86cd799439011',
      };

      const duplicateError = { code: 11000 };
      jest.spyOn(model, 'create').mockRejectedValueOnce(duplicateError);

      await expect(service.create(createBookDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated books', async () => {
      const queryDto = { page: 1, limit: 10 };
      const books = [mockBook];

      mockBookModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(books),
      });

      mockBookModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(queryDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });

    it('should filter books by authorId', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
        authorId: '507f1f77bcf86cd799439011',
      };

      mockBookModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockBook]),
      });

      mockBookModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(queryDto);
      expect(mockBookModel.find).toHaveBeenCalledWith({
        author: '507f1f77bcf86cd799439011',
      });
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      mockBookModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockBook),
        }),
      });

      const result = await service.findOne('507f1f77bcf86cd799439012');
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException if book not found', async () => {
      mockBookModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('507f1f77bcf86cd799439012')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      const updateDto = { genre: 'Science Fiction' };
      const updatedBook = { ...mockBook, ...updateDto };

      mockBookModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedBook),
        }),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439012',
        updateDto,
      );
      expect(result.genre).toBe('Science Fiction');
    });

    it('should throw NotFoundException if book not found', async () => {
      mockBookModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.update('507f1f77bcf86cd799439012', { genre: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a book', async () => {
      mockBookModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBook),
      });

      await expect(
        service.delete('507f1f77bcf86cd799439012'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if book not found', async () => {
      mockBookModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('507f1f77bcf86cd799439012')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

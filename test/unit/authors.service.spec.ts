import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthorsService } from '../../src/modules/authors/authors.service';
import { Author } from '../../src/modules/authors/schemas/author.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let model: Model<Author>;

  const mockAuthor = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'A great author',
    birthDate: new Date('1980-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockAuthorModel = {
    new: jest.fn().mockResolvedValue(mockAuthor),
    constructor: jest.fn().mockResolvedValue(mockAuthor),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getModelToken(Author.name),
          useValue: mockAuthorModel,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    model = module.get<Model<Author>>(getModelToken(Author.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new author', async () => {
      const createAuthorDto = {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'A great author',
        birthDate: '1980-01-01',
      };

      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockAuthor as any));

      const result = await service.create(createAuthorDto);
      expect(result).toEqual(mockAuthor);
    });
  });

  describe('findAll', () => {
    it('should return paginated authors', async () => {
      const queryDto = { page: 1, limit: 10 };
      const authors = [mockAuthor];

      mockAuthorModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(authors),
      });

      mockAuthorModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(queryDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });

    it('should filter authors by firstName', async () => {
      const queryDto = { page: 1, limit: 10, firstName: 'John' };

      mockAuthorModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockAuthor]),
      });

      mockAuthorModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(queryDto);
      expect(mockAuthorModel.find).toHaveBeenCalledWith({
        firstName: { $regex: 'John', $options: 'i' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an author by id', async () => {
      mockAuthorModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAuthor),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockAuthor);
    });

    it('should throw NotFoundException if author not found', async () => {
      mockAuthorModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update an author', async () => {
      const updateDto = { bio: 'Updated bio' };
      const updatedAuthor = { ...mockAuthor, ...updateDto };

      mockAuthorModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedAuthor),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
      expect(result.bio).toBe('Updated bio');
    });

    it('should throw NotFoundException if author not found', async () => {
      mockAuthorModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', { bio: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an author', async () => {
      mockAuthorModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAuthor),
      });

      await expect(
        service.delete('507f1f77bcf86cd799439011'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if author not found', async () => {
      mockAuthorModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('Authors (e2e)', () => {
  let app: INestApplication;
  let createdAuthorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/authors (POST)', () => {
    it('should create a new author', () => {
      return request(app.getHttpServer())
        .post('/api/v1/authors')
        .send({
          firstName: 'Jane',
          lastName: 'Austen',
          bio: 'English novelist known for romantic fiction',
          birthDate: '1775-12-16',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.firstName).toBe('Jane');
          expect(res.body.lastName).toBe('Austen');
          createdAuthorId = res.body.id;
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/authors')
        .send({
          firstName: 'John',
        })
        .expect(400);
    });

    it('should return 400 for invalid date format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/authors')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          birthDate: 'invalid-date',
        })
        .expect(400);
    });
  });

  describe('/api/v1/authors (GET)', () => {
    it('should return paginated list of authors', () => {
      return request(app.getHttpServer())
        .get('/api/v1/authors')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
        });
    });

    it('should filter authors by firstName', () => {
      return request(app.getHttpServer())
        .get('/api/v1/authors?firstName=Jane')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0].firstName).toContain('Jane');
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/authors?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('/api/v1/authors/:id (GET)', () => {
    it('should return a single author', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/authors/${createdAuthorId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdAuthorId);
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('lastName');
        });
    });

    it('should return 404 for non-existent author', () => {
      return request(app.getHttpServer())
        .get('/api/v1/authors/507f1f77bcf86cd799439999')
        .expect(404);
    });

    it('should return 400 for invalid id format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/authors/invalid-id')
        .expect(400);
    });
  });

  describe('/api/v1/authors/:id (PATCH)', () => {
    it('should update an author', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/authors/${createdAuthorId}`)
        .send({
          bio: 'Updated biography for Jane Austen',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdAuthorId);
          expect(res.body.bio).toBe('Updated biography for Jane Austen');
        });
    });

    it('should return 404 for non-existent author', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/authors/507f1f77bcf86cd799439999')
        .send({ bio: 'Updated' })
        .expect(404);
    });
  });

  describe('/api/v1/authors/:id (DELETE)', () => {
    it('should delete an author', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/authors/${createdAuthorId}`)
        .expect(204);
    });

    it('should return 404 for non-existent author', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/authors/507f1f77bcf86cd799439999')
        .expect(404);
    });
  });
});

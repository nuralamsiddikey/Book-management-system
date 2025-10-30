import { Model, Document, FilterQuery } from 'mongoose';

export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1> | string;
  populate?: string | (string | Record<string, any>)[];
  projection?: any;
  maxLimit?: number;
}

export async function paginate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate,
    projection,
    maxLimit = 100,
  }: PaginateOptions = {},
) {
  limit = Math.min(limit, maxLimit);
  const skip = (page - 1) * limit;
  

  const findQuery = model
    .find(filter, projection)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (populate) {
    findQuery.populate(populate as any);
  }

  const [data, total] = await Promise.all([
    findQuery.exec(),
    model.countDocuments(filter).exec(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

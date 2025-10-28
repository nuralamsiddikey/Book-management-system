import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookDocument = Book & Document

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true })
  isbn: string;

  @Prop({ type: Date })
  publishedDate?: Date;

  @Prop({ trim: true })
  genre?: string;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  author: Types.ObjectId;
}

export const BookSchema = SchemaFactory.createForClass(Book)
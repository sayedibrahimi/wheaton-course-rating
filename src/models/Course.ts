// models/Course.ts
// Purpose: Define the Course model using Mongoose.
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  prefix: string;
  courseCode: string;
  fullCode: string;
  name: string;
  description: string;
  prerequisites?: string;
  credits: string;
  department?: string;
  area?: string;
  foundation?: string;
  attributes?: string;
  notes?: string;
  connection?: string;
  Compass?: string;
  averageRating: number;
  averageDifficulty: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema(
  {
    prefix: {
      type: String,
      required: [true, 'Course prefix is required'],
      trim: true,
      index: true,
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      index: true,
    },
    fullCode: {
      type: String,
      required: [true, 'Full course code is required'],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    prerequisites: {
      type: String,
      default: '',
    },
    credits: {
      type: String,
      required: [true, 'Credits are required'],
      min: 0,
    },
    department: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    foundation: {
      type: String,
      trim: true,
    },
    attributes: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    connection: {
      type: String,
      default: '',
    },
    Compass: {
      type: String,
      default: '',
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    averageDifficulty: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for better search performance
CourseSchema.index({ prefix: 1, courseCode: 1 });
CourseSchema.index({ name: 'text', fullCode: 'text', description: 'text' });

// Delete the model if it exists to prevent OverwriteModelError during hot reloading
const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
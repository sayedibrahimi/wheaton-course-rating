// models/Review.ts
// Purpose: Define the Review model using Mongoose.
import mongoose, { Schema, Document, Model } from 'mongoose';
import Course from './Course';
import { predefinedTags } from '../constants/tags';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  difficulty: number;
  difficultyText: string;
  content: string;
  tags: string[];
  helpfulCount: number;
  helpfulUsers: mongoose.Types.ObjectId[];
  semester: string;
  professor: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the validator props interface
interface ValidatorProps {
  value: number;
  path: string;
}

const ReviewSchema: Schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      validate: {
        validator: function(v: number) {
          // Allow whole numbers and half numbers (e.g., 3.5)
          return v % 0.5 === 0;
        },
        message: (props: ValidatorProps) => `${props.value} is not a valid rating. Ratings must be in 0.5 increments.`
      }
    },
    difficulty: {
      type: Number,
      required: [true, 'Difficulty is required'],
      min: 1,
      max: 5,
      validate: {
        validator: function(v: number) {
          return Number.isInteger(v);
        },
        message: (props: ValidatorProps) => `${props.value} is not a valid difficulty rating. Difficulty must be an integer.`
      }
    },
    difficultyText: {
      type: String,
      required: [true, 'Difficulty text is required'],
      enum: ['Easy', 'Moderate', 'Hard'],
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      minlength: [10, 'Review content must be at least 10 characters long'],
    },
    tags: [{
        type: String,
        enum: predefinedTags
      }],
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true
    },
    professor: {
      type: String,
      required: [true, 'Professor name is required'],
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

// Enforce one review per user per course
ReviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Update course ratings when a review is saved
ReviewSchema.post('save', async function(this: IReview) {
  await updateCourseRatings(this.courseId);
});

// Update course ratings when a review is updated
ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateCourseRatings(doc.courseId);
  }
});

// Update course ratings when a review is deleted
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateCourseRatings(doc.courseId);
  }
});

// Function to update course ratings
async function updateCourseRatings(courseId: mongoose.Types.ObjectId | string) {
  const Review = mongoose.model<IReview>('Review');
  
  const stats = await Review.aggregate([
    { $match: { courseId: courseId } },
    { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        averageDifficulty: { $avg: '$difficulty' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
      averageDifficulty: parseFloat(stats[0].averageDifficulty.toFixed(1)),
      reviewCount: stats[0].reviewCount
    });
  } else {
    // If no reviews exist, reset to defaults
    await Course.findByIdAndUpdate(courseId, {
      averageRating: 0,
      averageDifficulty: 0,
      reviewCount: 0
    });
  }
}

// Delete the model if it exists to prevent OverwriteModelError during hot reloading
const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
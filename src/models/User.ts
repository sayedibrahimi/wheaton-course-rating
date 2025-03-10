// models/User.ts
// Purpose: Define the User model using Mongoose.
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the role enum in TypeScript
export enum Role {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; // Explicitly define _id type
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string;
  bio?: string;
  role?: Role;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(Role), // Use the Role enum to define allowed values
      default: Role.STUDENT, // Default to 'student' if no role is provided
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function(this: IUser, next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: unknown) {
    next(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Delete the model if it exists to prevent OverwriteModelError during hot reloading
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
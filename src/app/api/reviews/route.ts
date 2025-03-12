// app/api/reviews/route.ts
// Purpose: Define the API routes for the Review model.
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const query: Record<string, mongoose.Types.ObjectId> = {};

    // Check if valid search parameters are provided
    const hasValidParams = courseId || userId;

    if (!hasValidParams) {
      return NextResponse.json(
        { error: 'At least one search parameter (courseId or userId) is required' },
        { status: 400 }
      );
    }
    
    // Filter by courseId if provided
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json(
          { error: 'Invalid courseId format' },
          { status: 400 }
        );
      }
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }
    
    // Filter by userId if provided
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { error: 'Invalid userId format' },
          { status: 400 }
        );
      }
      query.userId = new mongoose.Types.ObjectId(userId);
    }
    
    // Get total count for pagination
    const total = await Review.countDocuments(query);
    
    // Get reviews with pagination
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName profilePicture')
      .populate('courseId', 'fullCode name');
    
    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Set difficultyText based on difficulty value
    if (body.difficulty && !body.difficultyText) {
      if (body.difficulty <= 2) {
        body.difficultyText = 'Easy';
      } else if (body.difficulty <= 4) {
        body.difficultyText = 'Moderate';
      } else {
        body.difficultyText = 'Hard';
      }
    }
    
    // Check if user already reviewed this course
    const existingReview = await Review.findOne({
      userId: body.userId,
      courseId: body.courseId
    });
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this course' },
        { status: 400 }
      );
    }
    
    const newReview = new Review(body);
    await newReview.save();
    
    // Course ratings are updated automatically via post-save hook

     // Return the populated review
    const populatedReview = await Review.findById(newReview._id)
      .populate('userId', 'firstName lastName profilePicture')
      .populate('courseId', 'fullCode name');
    
    return NextResponse.json(populatedReview, { status: 201 });
  } catch (error: Error | unknown) {
    const err = error as Error;
    console.error('Error creating review:', err);
    
    if (err instanceof Error && err.name === 'ValidationError') {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
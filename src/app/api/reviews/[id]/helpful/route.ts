// app/api/reviews/[id]/helpful/route.ts
// Purpose: API route for marking a review as helpful
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const reviewId = params.id;
    const userId = token.id as string;
    
    // Validate the IDs
    if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Check if user already marked this review as helpful
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const hasMarked = review?.helpfulUsers?.some(id => id.equals(userIdObj));
    
    // Toggle the helpful status
    if (hasMarked) {
      // Remove user from helpfulUsers array and decrement count
      await Review.findByIdAndUpdate(reviewId, {
        $pull: { helpfulUsers: userIdObj },
        $inc: { helpfulCount: -1 }
      });
      
      return NextResponse.json({ 
        message: 'Removed helpful mark',
        helpful: false
      });
    } else {
      // Add user to helpfulUsers array and increment count
      await Review.findByIdAndUpdate(reviewId, {
        $addToSet: { helpfulUsers: userIdObj },
        $inc: { helpfulCount: 1 }
      });
      
      return NextResponse.json({ 
        message: 'Marked as helpful',
        helpful: true
      });
    }
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
// app/api/reviews/[id]/report/route.ts
// Purpose: API route for reporting inappropriate reviews
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

// You might want to add a 'reports' field to your Review model
// This would track reports similar to helpfulUsers

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
    const body = await request.json();
    const { reason } = body;
    
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
    
    // For now, just acknowledge the report
    // In a production app, you would store this report in a database
    // and potentially have moderation workflows

    console.log(`Review ${reviewId} reported by user ${userId} for reason: ${reason}`);
    
    
    return NextResponse.json({ 
      message: 'Review reported successfully',
      reported: true
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}
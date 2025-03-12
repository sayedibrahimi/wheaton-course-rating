// app/api/users/route.ts
// Purpose: Define the API routes for the User model.
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    let query = {};
    if (email) {
      query = { email };
    }
    
    const users = await User.find(query).select('-password');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    const newUser = new User(body);
    await newUser.save();
    
    // Don't return password in response
    // Extract only the fields we want to return
    const { _id, email, firstName, lastName, role, profilePicture, bio, createdAt, updatedAt } = newUser.toObject();


    return NextResponse.json({_id, email, firstName, lastName, role, profilePicture, bio, createdAt, updatedAt}, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
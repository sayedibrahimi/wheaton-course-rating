// app/api/courses/route.ts
// Purpose: Define the API routes for the Course model.
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const query: { 
      prefix?: string;
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    } = {};
    
    // Filter by prefix if provided
    if (prefix) {
      query.prefix = prefix;
    }
    
    // Text search if search term provided
    if (search) {
      query.$or = [
        { fullCode: { $regex: `\\b${search}\\b`, $options: 'i' } }, // Word boundary at both ends
        { name: { $regex: `\\b${search}\\b`, $options: 'i' } },     // Word boundary at both ends
      ];
    }
    
    // Get total count for pagination
    const total = await Course.countDocuments(query);
    
    // Get courses with pagination
    const courses = await Course.find(query)
      .sort({ prefix: 1, courseCode: 1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      courses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Ensure fullCode is created correctly
    if (body.prefix && body.courseCode && !body.fullCode) {
      body.fullCode = `${body.prefix} ${body.courseCode}`;
    }
    
    // Check for duplicate course
    const existingCourse = await Course.findOne({ fullCode: body.fullCode });
    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 400 }
      );
    }
    
    const newCourse = new Course(body);
    await newCourse.save();
    
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating course:', error);
    
    if (typeof error === 'object' && error !== null && 'name' in error && 'message' in error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: (error as { message: string }).message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
// app/courses/[id]/page.tsx
// Purpose: Course details page component to display information about a specific course and its reviews.
// Description: This component fetches details for a specific course and displays information about the course, including its name, department, credits, average rating, and reviews. It also displays a list of reviews for the course, including the user's name, profile picture, rating, difficulty, content, tags, and helpful count. The component also provides a button to write a review for the course.
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Define types
interface Course {
  _id: string;
  fullCode: string;
  name: string;
  description: string;
  prerequisites: string;
  credits: number;
  department: string;
  area: string;
  foundation: string;
  attributes: string;
  notes: string;
  connection: string;
  Compass: string;
  averageRating: number;
  averageDifficulty: number;
  reviewCount: number;
}

interface Review {
  _id: string;
  courseId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  rating: number;
  difficulty: number;
  difficultyText: string;
  content: string;
  tags: string[];
  helpfulCount: number;
  createdAt: string;
}

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
       router.push(`/auth/signin?callbackUrl=/courses/${courseId}`);
    }
  }, [status, courseId, router]);

  // Fetch course and reviews
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course details');
        }
        const courseData = await courseResponse.json();
        setCourse(courseData);
        
        // Fetch reviews for this course
        const reviewsResponse = await fetch(`/api/reviews?courseId=${courseId}`);
        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews);
        
        // Check if current user has already reviewed this course
        if (session?.user?.id) {
          const hasReviewed = reviewsData.reviews.some(
            (review: Review) => review.userId._id === session.user.id
          );
          setUserHasReviewed(hasReviewed);
        }
        
        setError(null);
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, session]);

  // Display star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-500">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-500">½</span>);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }
    
    return stars;
  };

  // Handle Write Review button click
  const handleWriteReview = () => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/courses/${courseId}`);
    } else {
      router.push(`/courses/${courseId}/review`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p className="text-gray-500">Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Course not found'}
        </div>
        <Link href="/courses" className="text-blue-600 hover:underline">
          Back to Course Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/courses" className="inline-flex items-center text-blue-600 hover:underline mb-6">
        ← Back to Course Catalog
      </Link>

      {/* Course header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course.fullCode}: {course.name}</h1>
            <p className="text-gray-600 mb-2">
              {course.department} • {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
            </p>
            
            {course.area && (
              <p className="text-gray-600 mb-1">Area: {course.area}</p>
            )}
            
            {course.foundation && (
              <p className="text-gray-600 mb-1">Foundation: {course.foundation}</p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">
                {renderStars(course.averageRating)}
              </div>
              <span className="text-lg font-semibold">
                {course.averageRating?.toFixed(1)}
              </span>
              <span className="text-gray-500 ml-1">
                ({course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="mr-2">Difficulty:</span>
              <span className="font-semibold">
                {course.averageDifficulty > 0 
                  ? (() => {
                      if (course.averageDifficulty <= 2) return 'Easy';
                      if (course.averageDifficulty <= 4) return 'Moderate';
                      return 'Hard';
                    })()
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
        
        {/* Course description */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-800 whitespace-pre-line">{course.description}</p>
        </div>
        
        {/* Course details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {course.prerequisites && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
              <p className="text-gray-800">{course.prerequisites}</p>
            </div>
          )}
          
          {course.attributes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Attributes</h3>
              <p className="text-gray-800">{course.attributes}</p>
            </div>
          )}
          
          {course.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-gray-800">{course.notes}</p>
            </div>
          )}
          
          {course.connection && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Connection</h3>
              <p className="text-gray-800">{course.connection}</p>
            </div>
          )}
          
          {course.Compass && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Compass</h3>
              <p className="text-gray-800">{course.Compass}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Reviews section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reviews</h2>
          
          {!userHasReviewed && (
            <button
              onClick={handleWriteReview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Write a Review
            </button>
          )}
        </div>
        
        {reviews.length > 0 ? (
          <div className="space-y-8">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex justify-between mb-3">
                  <div className="flex items-center">
                    {review.userId.profilePicture ? (
                      <Image
                        src={review.userId.profilePicture}
                        alt={`${review.userId.firstName} ${review.userId.lastName}`}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-600">
                          {review.userId.firstName}{review.userId.lastName}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {review.userId.firstName} {review.userId.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center justify-end mb-1">
                      {renderStars(review.rating)}
                      <span className="ml-2">{review.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Difficulty: {review.difficultyText}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-4 whitespace-pre-line">{review.content}</p>
                
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <button
                  className="text-gray-500 text-sm flex items-center hover:text-blue-600"
                  onClick={() => {
                    // We'd implement this functionality with API calls
                    alert('Helpful button clicked - would be implemented with API call');
                  }}
                >
                  👍 Helpful ({review.helpfulCount})
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-600 mb-4">
              This course doesn&apos;t have any reviews yet.
            </p>
            {!userHasReviewed && (
              <button
                onClick={handleWriteReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Be the First to Write a Review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
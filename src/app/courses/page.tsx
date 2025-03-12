// app/courses/page.tsx
// Purpose: Courses page component to display a list of courses and allow filtering and searching.
// Description: This component fetches a list of courses from the API and displays them in a grid. It also provides a search form to filter courses by name or code, and a select input to filter by department prefix. The component also handles pagination and displays a loading state while fetching data.
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Course {
  _id: string;
  fullCode: string;
  name: string;
  department: string;
  credits: number;
  averageRating: number;
  reviewCount: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [prefix, setPrefix] = useState('');

  // Function to fetch courses wrapped in useCallback
  const fetchCourses = useCallback(async (page = 1, search = searchTerm, coursePrefix = prefix) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (search) {
        params.append('search', search);
      }
      
      if (coursePrefix) {
        params.append('prefix', coursePrefix);
      }
      
      const response = await fetch(`/api/courses?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCourses(data.courses);
      setPagination(data.pagination);
      setError(null);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching courses';
      setError(errorMessage);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, prefix, pagination.limit]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses(1, searchTerm, prefix);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchCourses(newPage, searchTerm, prefix);
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>
      
      {/* Search and Filter Form */}
      <form onSubmit={handleSearch} className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Courses
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by course code or name"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="w-48">
          <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 mb-1">
            Department Prefix
          </label>
          <select
            id="prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Departments</option>
            <option value="COMP">Computer Science</option>
            <option value="MATH">Mathematics</option>
            <option value="ENG">English</option>
            <option value="HIST">History</option>
            <option value="BIO">Biology</option>
            {/* Add more options as needed */}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center">
          <p className="text-gray-500">Loading courses...</p>
        </div>
      ) : (
        <>
          {/* Courses List */}
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link 
                  href={`/courses/${course._id}`}
                  key={course._id}
                  className="block border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">{course.fullCode}</h2>
                  <h3 className="text-lg mb-3">{course.name}</h3>
                  
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{course.department}</span>
                    <span className="text-gray-600">{course.credits} Credits</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {course.reviewCount > 0 ? (
                        <>
                          <div className="flex items-center">
                            {renderStars(course.averageRating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            ({course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'})
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No courses found matching your criteria.</p>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-2 rounded-md ${
                    pagination.page === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md ${
                      pagination.page === page
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-2 rounded-md ${
                    pagination.page === pagination.pages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
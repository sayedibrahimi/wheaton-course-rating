// app/profile/page.tsx
// Purpose: Profile page component to display user profile and reviews.
// Description: This page component fetches the user profile and reviews from the API and displays them. It also allows the user to edit their profile information.
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  bio: string;
}

interface Review {
  _id: string;
  courseId: {
    _id: string;
    fullCode: string;
    name: string;
  };
  rating: number;
  difficulty: number;
  difficultyText: string;
  content: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile');
    }
  }, [status, router]);

  // Fetch user profile and reviews
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`/api/users/${session.user.id}`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);
        
        // Set form state
        setFirstName(profileData.firstName);
        setLastName(profileData.lastName);
        setBio(profileData.bio || '');
        setProfilePicture(profileData.profilePicture || '');
        
        // Fetch user reviews
        const reviewsResponse = await fetch(`/api/reviews?userId=${session.user.id}`);
        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch user reviews');
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews);
        
        setError(null);
      } catch (err: Error | unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user?.id ) {
      fetchProfileData();
    }
  }, [session]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
    try {
      setProfileUpdating(true);
      setUpdateError(null);
      
      const updateData = {
        firstName,
        lastName,
        bio,
        profilePicture
      };
      
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err: Error | unknown) {
      setUpdateError(err instanceof Error ? err.message : 'An error occurred while updating your profile');
    } finally {
      setProfileUpdating(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form values to current profile
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setBio(profile.bio || '');
      setProfilePicture(profile.profilePicture || '');
    }
    setIsEditing(false);
    setUpdateError(null);
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

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Profile not found'}
        </div>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {isEditing ? (
              <form onSubmit={handleProfileUpdate}>
                {updateError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {updateError}
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture URL
                  </label>
                  <input
                    type="text"
                    id="profilePicture"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={profileUpdating}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                      profileUpdating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    {profileUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {profile.profilePicture ? (
                      <Image
                        src={profile.profilePicture}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-16 h-16 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                        <span className="text-xl text-gray-600">
                          {profile.firstName[0]}{profile.lastName[0]}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-xl font-bold">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <p className="text-gray-600">{profile.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bio</h3>
                  {profile.bio ? (
                    <p className="text-gray-800 whitespace-pre-line">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">
                      No bio provided. Click &apos;Edit&apos; to add one.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Your Reviews</h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <Link 
                      href={`/courses/${review.courseId._id}`}
                      className="text-xl font-bold text-blue-600 hover:underline mb-2 block"
                    >
                      {review.courseId.fullCode}: {review.courseId.name}
                    </Link>
                    
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                        <span className="ml-2">{review.rating.toFixed(1)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-gray-800 mb-2">
                      <span className="font-medium">Difficulty:</span> {review.difficultyText}
                    </p>
                    
                    <p className="text-gray-800 whitespace-pre-line">{review.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 mb-4">
                  You haven&apos;t written any reviews yet.
                </p>
                <Link
                  href="/courses"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Courses to Review
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI } from '@/lib/api';
import { Course } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


const fetchCourses = useCallback(async () => {
    try {
      const response = await courseAPI.getAll();
      const coursesData = response.data || [];
      
      const parsedCourses = coursesData.map((course: Course) => ({
        ...course,
        allowedRoles: parseAllowedRoles(course.allowedRoles)
      }));
      
      setCourses(parsedCourses);
    } catch (err) {
      setError('Failed to load courses');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);


  const parseAllowedRoles = (roles: string[] | string): string[] => {
    if (Array.isArray(roles)) {
      return roles;
    }
    if (typeof roles === 'string') {
      try {
        const parsed = JSON.parse(roles);
        return Array.isArray(parsed) ? parsed : [roles];
      } catch {
        return [roles];
      }
    }
    return [];
  };

const checkAccess = (course: Course): boolean => {
  if (!user) return false;
  
  // Get user role - check both type and name
  const userRoleType = user.role?.type?.toLowerCase() || '';
  const userRoleName = user.role?.name?.toLowerCase() || '';
  const allowedRoles = parseAllowedRoles(course.allowedRoles);
  
  console.log('=== ACCESS CHECK ===');
  console.log('User Role Type:', userRoleType);
  console.log('User Role Name:', userRoleName);
  console.log('Course:', course.title);
  console.log('Allowed Roles:', allowedRoles);
  
  // If no roles specified, everyone can access
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  
  // Check if user's role matches any allowed role
  const hasAccess = allowedRoles.some(role => {
    const roleLower = role.toLowerCase().trim();
    
    // Direct match with type or name
    if (roleLower === userRoleType || roleLower === userRoleName) {
      return true;
    }
    
    // Check for partial matches (e.g., "student" in "Student")
    if (userRoleType.includes(roleLower) || roleLower.includes(userRoleType)) {
      return true;
    }
    
    if (userRoleName.includes(roleLower) || roleLower.includes(userRoleName)) {
      return true;
    }
    
    return false;
  });
  
  console.log('Has Access:', hasAccess);
  console.log('===================');
  
  return hasAccess;
};

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Our Courses
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {user 
                ? `Welcome, ${user.username}! Browse courses available for your role.`
                : 'Sign in to access role-specific courses'}
            </p>
          </div>

          

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Courses Grid */}
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-600">Check back later for new courses!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  hasAccess={checkAccess(course)}
                />
              ))}
            </div>
          )}

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{courses.length}</div>
              <div className="text-gray-600">Total Courses</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {user ? courses.filter(c => checkAccess(c)).length : 0}
              </div>
              <div className="text-gray-600">Available to You</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">
                {user ? courses.filter(c => !checkAccess(c)).length : courses.length}
              </div>
              <div className="text-gray-600">Locked Courses</div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

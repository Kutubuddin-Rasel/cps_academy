'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI } from '@/lib/api';
import { Course } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchCourses();
    }
  }, [user, authLoading, router]);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      setCourses(response.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseAllowedRoles = (roles: string[] | string): string[] => {
    if (Array.isArray(roles)) return roles;
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
    
    const userRoleType = user.role?.type?.toLowerCase() || '';
    const userRoleName = user.role?.name?.toLowerCase() || '';
    const allowedRoles = parseAllowedRoles(course.allowedRoles);
    
    if (!allowedRoles || allowedRoles.length === 0) return true;
    
    return allowedRoles.some(role => {
      const roleLower = role.toLowerCase().trim();
      return roleLower === userRoleType || 
             roleLower === userRoleName ||
             userRoleType.includes(roleLower) || 
             roleLower.includes(userRoleType);
    });
  };

  const accessibleCourses = courses.filter(c => checkAccess(c));
  const lockedCourses = courses.filter(c => !checkAccess(c));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-extrabold mb-4">Welcome back, {user.username}! 👋</h1>
            <p className="text-xl text-purple-100">Track your learning progress and explore new courses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Total Courses */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">{courses.length}</h3>
              <p className="text-gray-600 font-medium">Total Courses</p>
            </div>

            {/* Accessible Courses */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">{accessibleCourses.length}</h3>
              <p className="text-gray-600 font-medium">Available Courses</p>
            </div>

            {/* User Role */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 rounded-full p-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{user.role?.name || 'User'}</h3>
              <p className="text-gray-600 font-medium">Your Role</p>
            </div>
          </div>

          {/* My Accessible Courses */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">📚 My Accessible Courses</h2>
              <Link 
                href="/courses"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
              >
                View All
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {accessibleCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessibleCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.documentId}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
                      <div className="text-white text-6xl font-bold opacity-30">
                        {course.title.charAt(0)}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center text-green-600 font-semibold">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Access Granted
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Courses Available</h3>
                <p className="text-gray-600 mb-6">You don't have access to any courses with your current role.</p>
                <Link 
                  href="/courses"
                  className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Browse All Courses
                </Link>
              </div>
            )}
          </div>

          {/* Locked Courses Section */}
          {lockedCourses.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🔒 Locked Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 opacity-75"
                  >
                    <div className="h-48 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center text-red-600 font-semibold">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Access Denied
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI } from '@/lib/api';
import { Course, Module as ModuleType } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState<number>(0);

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id as string);
    }
  }, [params.id]);

  const fetchCourse = async (id: string) => {
    try {
      const response = await courseAPI.getById(id);
      setCourse(response.data);
    } catch (err) {
      setError('Failed to load course details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const extractDescription = (description: any): string => {
    if (typeof description === 'string') return description;
    if (Array.isArray(description)) {
      return description
        .map((block) => {
          if (block.children && Array.isArray(block.children)) {
            return block.children.map((child: any) => child.text || '').join('');
          }
          return '';
        })
        .join(' ');
    }
    return 'No description available';
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

  const checkAccess = (): boolean => {
    if (!user || !course) return false;
    
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
            <button
              onClick={() => router.push('/courses')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Courses
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasAccess = checkAccess();
  const modules = Array.isArray(course.modules) ? course.modules : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Course Header - Improved gradient and spacing */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-black opacity-5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.push('/courses')}
              className="mb-6 text-white hover:text-purple-100 flex items-center transition group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Courses
            </button>
            
            <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">{course.title}</h1>
            <p className="text-xl text-purple-100 mb-6 max-w-3xl">{extractDescription(course.description)}</p>

            {!hasAccess && (
              <div className="bg-red-600 bg-opacity-95 p-5 rounded-xl inline-block border-2 border-red-400 shadow-xl">
                <p className="font-bold text-lg">🔒 Access Denied - This course is not available for your role</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Content */}
        {hasAccess ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {modules.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Modules Yet</h3>
                <p className="text-gray-600 text-lg">Course content is coming soon. Check back later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Modules Sidebar - Better styling */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4 border border-gray-100">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">📖 Modules</h3>
                    <div className="space-y-3">
                      {modules.length > 0 && [...modules]
                       .sort((a, b) => a.order - b.order)
                         .map((module, index) => (
                          <button
                            key={module.id}
                            onClick={() => setSelectedModule(index)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                              selectedModule === index
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-900 hover:shadow-md'
                            }`}
                          >
                            <div className="font-bold text-sm mb-1">Module {module.order}</div>
                            <div className={`text-sm ${selectedModule === index ? 'text-purple-100' : 'text-gray-600'}`}>
                              {module.title}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Module Content - Better colors and spacing */}
                <div className="lg:col-span-3">
                  {modules[selectedModule] && (
                    <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
                      <div className="mb-8">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900">{modules[selectedModule].title}</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">{modules[selectedModule].description}</p>
                      </div>

                      <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-3xl font-bold mb-6 text-gray-900">🎓 Classes</h3>
                        {modules[selectedModule].classes && modules[selectedModule].classes!.length > 0 ? (
                          <div className="space-y-6">
                            {modules[selectedModule].classes && Array.isArray(modules[selectedModule].classes) && 
                                   [...modules[selectedModule].classes]
                                   .sort((a, b) => a.order - b.order)
                                  .map((classItem) => (
                                <div
                                  key={classItem.id}
                                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-2xl font-bold text-gray-900">{classItem.title}</h4>
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                                      ⏱️ {classItem.duration} min
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-5 leading-relaxed">{classItem.topics}</p>
                                  {classItem.videoUrl && (
                                    <a
                                      href={classItem.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                                    >
                                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                      </svg>
                                      Watch Video
                                    </a>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                            <div className="text-5xl mb-3">📝</div>
                            <p className="text-gray-500 text-lg">No classes available in this module yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-16 text-center border border-gray-200">
              <svg className="w-32 h-32 mx-auto mb-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-4xl font-bold mb-4 text-gray-900">Course Locked</h2>
              <p className="text-xl text-gray-600 mb-8">This course is only available to specific user roles.</p>
              <button
                onClick={() => router.push('/courses')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all duration-200 hover:scale-105"
              >
                Browse Other Courses
              </button>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

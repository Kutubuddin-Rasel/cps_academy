import Link from 'next/link';
import { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  hasAccess: boolean;
}

// Helper to parse roles
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

// Helper to extract text from Strapi rich text
const extractDescription = (description: any): string => {
  if (typeof description === 'string') {
    return description;
  }
  
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

export default function CourseCard({ course, hasAccess }: CourseCardProps) {
  const allowedRoles = parseAllowedRoles(course.allowedRoles);
  const description = extractDescription(course.description);
  
  // Get thumbnail URL from Strapi
  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const thumbnailUrl = course.thumbnail?.url 
    ? `${API_URL}${course.thumbnail.url}`
    : null;
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Course Image/Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center relative overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-6xl font-bold opacity-20">
            {course.title.charAt(0)}
          </div>
        )}
        
        {/* Lock Overlay for restricted courses */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
            {course.title}
          </h3>
          {!hasAccess && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded flex-shrink-0">
              Locked
            </span>
          )}
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {description}
        </p>

        {/* Allowed Roles */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Access for:</p>
          <div className="flex flex-wrap gap-2">
            {allowedRoles.map((role, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {hasAccess ? (
          <Link
            href={`/courses/${course.documentId}`}
            className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            View Course
          </Link>
        ) : (
          <button
            disabled
            className="block w-full text-center bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
          >
            Access Denied
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section - Competitive Programming Focus */}
        <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 animate-fade-in">
                Master Competitive Programming
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                Become a pro competitive programmer with CPS Academy&apos;s comprehensive bootcamps. Master problem-solving from absolute beginner to FAANG interviews.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/courses" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg">
                    Browse Courses
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg">
                      Start Learning Free
                    </Link>
                    <Link href="/courses" className="bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-800 transition border-2 border-white">
                      View All Courses
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </section>

        {/* Success Stats Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
              Our Impact on Students
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Helping students achieve their competitive programming and career goals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition">
                <div className="text-5xl font-bold text-blue-600 mb-2">90+</div>
                <p className="text-gray-700 font-semibold">Codeforces Pupils</p>
                <p className="text-gray-500 text-sm mt-1">Students achieving rank</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition">
                <div className="text-5xl font-bold text-purple-600 mb-2">400+</div>
                <p className="text-gray-700 font-semibold">LeetCode Problems</p>
                <p className="text-gray-500 text-sm mt-1">Comprehensive practice</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl hover:shadow-lg transition">
                <div className="text-5xl font-bold text-pink-600 mb-2">80+</div>
                <p className="text-gray-700 font-semibold">Live Classes</p>
                <p className="text-gray-500 text-sm mt-1">Interactive sessions</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:shadow-lg transition">
                <div className="text-5xl font-bold text-indigo-600 mb-2">6 Months</div>
                <p className="text-gray-700 font-semibold">Job Interview Prep</p>
                <p className="text-gray-500 text-sm mt-1">FAANG ready training</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Updated for CPS Academy */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Why Choose CPS Academy?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 - Competitive Programming */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Competitive Programming Focus</h3>
                <p className="text-gray-600">Master problem-solving with expert trainers. Achieve Codeforces Pupil rank and become a coding specialist.</p>
              </div>

              {/* Feature 2 - FAANG Interview Prep */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">FAANG Interview Preparation</h3>
                <p className="text-gray-600">6-month intensive course with 400+ LeetCode problems, mock interviews, and system design for Big Tech companies.</p>
              </div>

              {/* Feature 3 - Career Building */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Complete Career Building</h3>
                <p className="text-gray-600">From absolute beginner to job-ready developer with CV reviews, soft skills training, and lifetime course access.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Path Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Your Learning Journey
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Start from Basics</h3>
                <p className="text-gray-600">Learn fundamentals of programming, data structures, and algorithms from scratch.</p>
              </div>
              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Practice & Compete</h3>
                <p className="text-gray-600">Solve 400+ problems on LeetCode and participate in competitive programming contests.</p>
              </div>
              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-pink-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Land Your Dream Job</h3>
                <p className="text-gray-600">Ace FAANG interviews with mock sessions, CV reviews, and expert mentorship.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
            <div className="max-w-4xl mx-auto text-center px-4">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Become a Pro Programmer?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join CPS Academy and transform your coding skills with expert-led bootcamps
              </p>
              <Link href="/register" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition inline-block shadow-lg">
                Enroll Now - It&apos;s Free
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

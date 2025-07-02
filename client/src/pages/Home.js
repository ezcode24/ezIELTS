import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiPlay, FiCheck, FiUsers, FiAward, FiClock, FiBookOpen,
  FiHeadphones, FiEye, FiEdit, FiMic, FiTrendingUp, FiShield
} from 'react-icons/fi';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: FiHeadphones,
      title: 'Listening Module',
      description: 'Practice with authentic audio recordings and improve your listening comprehension skills.'
    },
    {
      icon: FiEye,
      title: 'Reading Module',
      description: 'Enhance your reading speed and comprehension with diverse text types and question formats.'
    },
    {
      icon: FiEdit,
      title: 'Writing Module',
      description: 'Develop your writing skills with structured tasks and detailed feedback from experts.'
    },
    {
      icon: FiMic,
      title: 'Speaking Module',
      description: 'Practice speaking with certified examiners in real-time video sessions.'
    }
  ];

  const benefits = [
    'Authentic IELTS exam format',
    'Real-time scoring and feedback',
    'Detailed performance analytics',
    'Expert examiner feedback',
    'Flexible scheduling',
    'Mobile-friendly interface',
    'Progress tracking',
    '24/7 support'
  ];

  const stats = [
    { number: '10,000+', label: 'Students' },
    { number: '95%', label: 'Success Rate' },
    { number: '4.8/5', label: 'User Rating' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Master IELTS with
                <span className="block text-yellow-300">Confidence</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8">
                Comprehensive practice tests, real-time feedback, and expert guidance 
                to help you achieve your target IELTS score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/exams"
                    className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-200 text-center"
                  >
                    Start Practice Test
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-200 text-center"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      to="/exams"
                      className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 text-center"
                    >
                      View Practice Tests
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                    <FiPlay className="w-8 h-8 text-gray-900" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center mb-4">Try Sample Test</h3>
                <p className="text-blue-100 text-center mb-6">
                  Experience our platform with a free sample test
                </p>
                <Link
                  to="/exams"
                  className="block w-full bg-white text-blue-600 py-3 rounded-lg font-semibold text-center hover:bg-gray-100 transition-colors duration-200"
                >
                  Start Sample Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete IELTS Preparation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform covers all four IELTS modules with authentic 
              practice materials and expert guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose IELTS Simulator?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of successful students who have achieved their target 
                IELTS scores with our comprehensive preparation platform.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Progress Tracking</h3>
                    <p className="text-gray-600">Monitor your improvement over time</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Listening</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">8.5</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Reading</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">7.8</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Writing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">7.2</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Speaking</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">8.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your IELTS Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of students who have successfully achieved their target 
            IELTS scores with our comprehensive preparation platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/exams"
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-200"
              >
                Start Practice Test
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-200"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/pricing"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
                >
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 
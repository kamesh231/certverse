'use client';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to Certverse! 🎉
        </h1>
        <p className="text-xl text-gray-600">
          Master your certification with personalized daily practice
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 my-12 text-left">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">1000+ Practice Questions</h3>
            <p className="text-sm text-gray-600">Comprehensive coverage of all exam topics</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Track Your Progress</h3>
            <p className="text-sm text-gray-600">Detailed analytics and insights</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Personalized Learning</h3>
            <p className="text-sm text-gray-600">Adapt to your weak areas automatically</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Build Study Streaks</h3>
            <p className="text-sm text-gray-600">Stay motivated with daily practice</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onNext}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg shadow-lg hover:shadow-xl"
        >
          Get Started →
        </button>
        <p className="text-sm text-gray-500 mt-4">Takes about 2 minutes</p>
      </div>
    </div>
  );
}

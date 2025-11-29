'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface GoalStepProps {
  onNext: (data: any) => void;
}

const CERTIFICATIONS = [
  { id: 'cisa', name: 'CISA (Certified Information Systems Auditor)', icon: '🔐' },
  { id: 'aws-saa', name: 'AWS Solutions Architect Associate', icon: '☁️' },
  { id: 'aws-sap', name: 'AWS Solutions Architect Professional', icon: '☁️' },
  { id: 'cka', name: 'Certified Kubernetes Administrator', icon: '⚓' },
  { id: 'azure-admin', name: 'Azure Administrator', icon: '🔷' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: '0-1 year experience' },
  { id: 'intermediate', name: 'Intermediate', description: '1-3 years experience' },
  { id: 'advanced', name: 'Advanced', description: '3+ years experience' },
];

export default function GoalStep({ onNext }: GoalStepProps) {
  const { user } = useUser();
  const [certification, setCertification] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [studyTime, setStudyTime] = useState(5);
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!certification || !experienceLevel) {
      alert('Please select a certification and experience level');
      return;
    }

    setLoading(true);

    try {
      await fetch('/api/onboarding/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          goal: 'certification',
          certification,
          experienceLevel,
          studyTime,
          examDate: examDate || undefined,
        }),
      });

      onNext({ certification, experienceLevel, studyTime, examDate });
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          What's your goal? 🎯
        </h2>
        <p className="text-gray-600">
          Tell us what you're working towards
        </p>
      </div>

      {/* Certification Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Which certification are you preparing for?
        </label>
        <div className="grid gap-3">
          {CERTIFICATIONS.map((cert) => (
            <button
              key={cert.id}
              onClick={() => setCertification(cert.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                certification === cert.id
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-3">{cert.icon}</span>
              <span className="font-medium text-gray-900">{cert.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      {certification && (
        <div className="mb-8 animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What's your experience level?
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setExperienceLevel(level.id)}
                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                  experienceLevel === level.id
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900">{level.name}</div>
                <div className="text-sm text-gray-600 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Study Time */}
      {experienceLevel && (
        <div className="mb-8 animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How many hours per week can you study?
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="20"
              value={studyTime}
              onChange={(e) => setStudyTime(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="w-24 px-4 py-2 bg-blue-100 rounded-lg text-center">
              <span className="text-2xl font-bold text-blue-600">{studyTime}</span>
              <span className="text-sm text-blue-600 ml-1">hrs/wk</span>
            </div>
          </div>
        </div>
      )}

      {/* Exam Date (Optional) */}
      {experienceLevel && (
        <div className="mb-8 animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            When do you plan to take the exam? (Optional)
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full md:w-auto px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={!certification || !experienceLevel || loading}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

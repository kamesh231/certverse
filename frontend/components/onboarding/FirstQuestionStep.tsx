'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FirstQuestionStepProps {
  onNext: () => void;
}

export default function FirstQuestionStep({ onNext }: FirstQuestionStepProps) {
  const { user } = useUser();
  const [question, setQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadQuestion();
    }
  }, [user]);

  const loadQuestion = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/question?userId=${user.id}&category=cisa`);
      const data = await res.json();

      if (data && data.id) {
        setQuestion(data);
      } else {
        console.error('No question data received:', data);
      }
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (option: string) => {
    if (answered) return;

    setSelectedOption(option);

    try {
      const res = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          questionId: question.id,
          selectedOption: option,
        }),
      });

      const result = await res.json();
      setIsCorrect(result.is_correct);
      setAnswered(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your first question...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        <p className="text-red-600">Failed to load question. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's answer your first question! 🚀
        </h2>
        <p className="text-gray-600">
          Don't worry - this is just to get you started. Let's see what you know!
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-blue-600 bg-white px-3 py-1 rounded-full">
            {question.category?.toUpperCase()} • {question.difficulty}
          </span>
          {question.topic && (
            <span className="text-sm text-gray-600">
              Topic: {question.topic}
            </span>
          )}
        </div>

        <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>

      <div className="space-y-3 mb-8">
        {question.options?.map((option: any) => {
          const isSelected = selectedOption === option.id;
          const isCorrectOption = answered && option.id === question.correct_option;
          const isWrongOption = answered && isSelected && !isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={answered}
              className={`
                w-full p-4 text-left rounded-lg border-2 transition-all duration-200
                ${!answered && 'hover:border-blue-400 hover:bg-blue-50'}
                ${isCorrectOption && 'border-green-500 bg-green-50'}
                ${isWrongOption && 'border-red-500 bg-red-50'}
                ${!answered && isSelected && 'border-blue-600 bg-blue-50'}
                ${!answered && !isSelected && 'border-gray-200'}
                ${answered && 'cursor-not-allowed'}
              `}
            >
              <div className="flex items-start">
                <span className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-3
                  ${isCorrectOption && 'bg-green-500 text-white'}
                  ${isWrongOption && 'bg-red-500 text-white'}
                  ${!answered && isSelected && 'bg-blue-600 text-white'}
                  ${!answered && !isSelected && 'bg-gray-100 text-gray-700'}
                  ${answered && !isCorrectOption && !isWrongOption && 'bg-gray-100 text-gray-400'}
                `}>
                  {option.id.toUpperCase()}
                </span>
                <span className="flex-1 text-gray-900">{option.text}</span>
                {isCorrectOption && (
                  <svg className="w-6 h-6 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isWrongOption && (
                  <svg className="w-6 h-6 text-red-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`
          p-6 rounded-xl mb-8 animate-fadeIn
          ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'}
        `}>
          {isCorrect ? (
            <>
              <div className="flex items-center mb-3">
                <span className="text-4xl mr-3">🎉</span>
                <h4 className="text-xl font-bold text-green-800">Correct!</h4>
              </div>
              <p className="text-green-800 mb-3 font-medium">Great job! You got it right.</p>
            </>
          ) : (
            <>
              <div className="flex items-center mb-3">
                <span className="text-4xl mr-3">💡</span>
                <h4 className="text-xl font-bold text-blue-800">Not quite, but that's okay!</h4>
              </div>
              <p className="text-blue-800 mb-3 font-medium">Learning from mistakes is part of the process.</p>
            </>
          )}

          {question.explanation && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Explanation:</p>
              <p className="text-gray-600">{question.explanation}</p>
            </div>
          )}

          <button
            onClick={onNext}
            className="mt-6 w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Complete Onboarding →
          </button>
        </div>
      )}

      {!answered && (
        <p className="text-center text-sm text-gray-500">
          Select an answer to see if you're correct
        </p>
      
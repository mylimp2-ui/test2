import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { QuizData } from '../types';

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuizData(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Ensure user came from login
  if (!location.state?.classCode || !location.state?.studentCode) {
    return <Navigate to="/" replace />;
  }

  const { classCode, studentCode } = location.state;

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center p-12 text-gray-500">문제를 불러오는 중...</div>;
  if (!quizData) return <div className="min-h-screen bg-gray-50 flex justify-center p-12 text-red-500">문제를 불러오지 못했습니다.</div>;

  const questions = quizData.questions;

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classCode,
          studentCode,
          answers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/submit', {
          state: {
            classCode,
            studentCode,
            score: data.score,
            total: data.total,
            results: data.results,
            quizTitle: quizData.quiz_title,
          },
        });
      } else {
        alert('제출 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{quizData.quiz_title}</h2>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-500">수업 코드</p>
              <p className="font-semibold text-gray-900">{classCode}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">학생 코드</p>
              <p className="font-semibold text-gray-900">{studentCode}</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                {q.question}
              </h3>
              
              <div className="space-y-3">
                {q.choices.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === optIdx
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      className="hidden"
                      checked={answers[q.id] === optIdx}
                      onChange={() => handleOptionSelect(q.id, optIdx)}
                    />
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                        answers[q.id] === optIdx ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {answers[q.id] === optIdx && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className={answers[q.id] === optIdx ? 'text-blue-900' : 'text-gray-700'}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              allAnswered && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '제출 중...' : '답안 제출'}
          </button>
        </div>
      </div>
    </div>
  );
}

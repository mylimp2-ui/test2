import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [classCode, setClassCode] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (classCode.trim() === 'AI101' && studentCode.trim() === 'S01') {
      setError('');
      // Navigate to quiz and pass the state
      navigate('/quiz', { state: { classCode, studentCode } });
    } else {
      setError('수업 코드 또는 학생 코드가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">학생 로그인</h1>
          <p className="text-gray-500">퀴즈를 시작하려면 수업 코드와 학생 코드를 입력하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-1">
              수업 코드
            </label>
            <input
              id="classCode"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="예: CS101"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700 mb-1">
              학생 코드
            </label>
            <input
              id="studentCode"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="예: 2023001"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            퀴즈 시작
          </button>
        </form>
      </div>
    </div>
  );
}

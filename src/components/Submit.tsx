import React from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';

export default function Submit() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state) {
    return <Navigate to="/" replace />;
  }

  const { classCode, studentCode, score, total, results, quizTitle } = location.state;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{quizTitle} - 제출 완료!</h2>
          <p className="text-gray-500 mb-8">답안이 성공적으로 기록되었습니다.</p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">수업 코드</p>
                <p className="font-medium text-gray-900">{classCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">학생 코드</p>
                <p className="font-medium text-gray-900">{studentCode}</p>
              </div>
              <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center mb-1">최종 점수</p>
                <p className="text-3xl font-bold text-blue-600 text-center">
                  {score} / {total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {results && (
          <div className="space-y-6 mb-8 text-left">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2">문항별 결과</h3>
            {results.map((r: any, idx: number) => {
              return (
                <div key={r.id} className={`p-4 rounded-lg border ${r.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {idx + 1}. {r.text}
                  </h4>
                  <div className="text-sm mb-3 space-y-1">
                    <p>
                      <span className="text-gray-600">내 답안: </span>
                      <span className={r.isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium line-through'}>
                        {r.options[r.userAnswer]}
                      </span>
                    </p>
                    {!r.isCorrect && (
                      <p>
                        <span className="text-gray-600">정답: </span>
                        <span className="text-blue-700 font-medium">{r.options[r.correctAnswer]}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 bg-white/60 p-3 rounded border border-gray-100/50">
                    <span className="font-medium">해설:</span> {r.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors inline-block"
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

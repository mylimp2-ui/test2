import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ResponseRecord {
  id: string;
  classCode: string;
  studentCode: string;
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  submittedAt: string;
}

export default function AdminDashboard() {
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      if (data.success) {
        setResponses(data.responses);
        setQuestionsData(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/logout');
  };

  const handleReset = async () => {
    if (window.confirm("정말 모든 응답 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
      try {
        const res = await fetch('/api/admin/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setResponses([]);
          alert('초기화되었습니다.');
        }
      } catch (err) {
        alert('초기화 중 오류가 발생했습니다.');
      }
    }
  };

  const downloadCSV = () => {
    const headers = ['class_code', 'student_code', 'question_id', 'selected_answer', 'correct_answer', 'is_correct', 'submitted_at'];
    const rows = responses.map(r => [
      r.classCode,
      r.studentCode,
      r.questionId,
      r.selectedAnswer,
      r.correctAnswer,
      r.isCorrect ? 'O' : 'X',
      new Date(r.submittedAt).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz_responses_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.quiz_title || !Array.isArray(json.questions)) {
          alert('올바른 형식의 JSON 파일이 아닙니다.\n{"quiz_title": "...", "questions": [...]} 구조가 필요합니다.');
          return;
        }
        
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        const data = await res.json();
        if (data.success) {
          alert('문제 파일이 성공적으로 업로드되었습니다.');
          fetchData();
        } else {
          alert('서버 저장 중 오류가 발생했습니다.');
        }
      } catch (err) {
        alert('파일 처리 중 오류가 발생했습니다. JSON 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compute metrics
  const classCodes = Array.from(new Set(responses.map(r => r.classCode)));
  const filteredResponses = selectedClass === 'ALL' ? responses : responses.filter(r => r.classCode === selectedClass);
  
  const totalResponses = filteredResponses.length;
  const totalStudents = new Set(filteredResponses.map(r => r.studentCode)).size;
  const correctCount = filteredResponses.filter(r => r.isCorrect).length;
  const avgCorrectRate = totalResponses > 0 ? ((correctCount / totalResponses) * 100).toFixed(1) : '0.0';

  // Student Score Table
  const studentMap = new Map<string, { total: number, correct: number, lastSubmit: string }>();
  filteredResponses.forEach(r => {
    const current = studentMap.get(r.studentCode) || { total: 0, correct: 0, lastSubmit: '' };
    current.total += 1;
    if (r.isCorrect) current.correct += 1;
    if (!current.lastSubmit || new Date(r.submittedAt) > new Date(current.lastSubmit)) {
      current.lastSubmit = r.submittedAt;
    }
    studentMap.set(r.studentCode, current);
  });

  const studentScores = Array.from(studentMap.entries()).map(([studentCode, data]) => ({
    studentCode,
    total: data.total,
    correct: data.correct,
    rate: ((data.correct / data.total) * 100).toFixed(1),
    lastSubmit: new Date(data.lastSubmit).toLocaleString()
  })).sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate) || b.correct - a.correct);

  // Question Correct Rate
  const questionStats = questionsData?.questions.map((q: any) => {
    const qResponses = filteredResponses.filter(r => String(r.questionId) === String(q.id));
    const qCorrect = qResponses.filter(r => r.isCorrect).length;
    const qTotal = qResponses.length;
    const rate = qTotal > 0 ? ((qCorrect / qTotal) * 100).toFixed(1) : '0.0';
    return { id: q.id, text: q.question, correct: qCorrect, total: qTotal, rate };
  }) || [];

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-sm text-gray-500 mt-1">현재 문제 셋: {questionsData?.quiz_title}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              문제 JSON 업로드
            </button>
            <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">CSV 다운로드</button>
            <button onClick={handleReset} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">응답 초기화</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">로그아웃</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-semibold text-gray-900">요약 정보</h2>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="ALL">전체 수업</option>
              {classCodes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600 mb-1">전체 응답 수</p>
              <p className="text-2xl font-bold text-blue-900">{totalResponses}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-600 mb-1">제출 학생 수</p>
              <p className="text-2xl font-bold text-green-900">{totalStudents}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-600 mb-1">평균 정답률</p>
              <p className="text-2xl font-bold text-purple-900">{avgCorrectRate}%</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-600 mb-1">활성 수업 코드</p>
              <p className="text-xl font-bold text-orange-900 truncate">{selectedClass === 'ALL' ? (classCodes.join(', ') || '-') : selectedClass}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 shrink-0">학생별 점수표</h2>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">순위</th>
                    <th className="px-4 py-3">이름(코드)</th>
                    <th className="px-4 py-3">제출수</th>
                    <th className="px-4 py-3">정답수</th>
                    <th className="px-4 py-3">정답률</th>
                    <th className="px-4 py-3">마지막 제출시간</th>
                  </tr>
                </thead>
                <tbody>
                  {studentScores.map((s, i) => (
                    <tr key={s.studentCode} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{i + 1}</td>
                      <td className="px-4 py-3">{s.studentCode}</td>
                      <td className="px-4 py-3">{s.total}</td>
                      <td className="px-4 py-3 text-green-600">{s.correct}</td>
                      <td className="px-4 py-3">{s.rate}%</td>
                      <td className="px-4 py-3 text-gray-500">{s.lastSubmit}</td>
                    </tr>
                  ))}
                  {studentScores.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-4 text-gray-500">데이터가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 shrink-0">문항별 정답률</h2>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">문항번호</th>
                    <th className="px-4 py-3">정답수</th>
                    <th className="px-4 py-3">전체응답수</th>
                    <th className="px-4 py-3">정답률</th>
                  </tr>
                </thead>
                <tbody>
                  {questionStats.map((q: any) => (
                    <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{q.id}</td>
                      <td className="px-4 py-3 text-green-600">{q.correct}</td>
                      <td className="px-4 py-3">{q.total}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-12">{q.rate}%</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${q.rate}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 shrink-0">전체 응답 목록</h2>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">응답번호</th>
                  <th className="px-4 py-3">학생이름(코드)</th>
                  <th className="px-4 py-3">문제ID</th>
                  <th className="px-4 py-3">선택한 답</th>
                  <th className="px-4 py-3">정답여부</th>
                  <th className="px-4 py-3">제출시간</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.slice().reverse().map((r, index) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{filteredResponses.length - index}</td>
                    <td className="px-4 py-3 font-medium">{r.studentCode}</td>
                    <td className="px-4 py-3">{r.questionId}</td>
                    <td className="px-4 py-3">{r.selectedAnswer + 1}</td>
                    <td className="px-4 py-3">
                      {r.isCorrect 
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">정답</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">오답</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(r.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {filteredResponses.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

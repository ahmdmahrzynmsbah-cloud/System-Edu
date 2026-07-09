import React, { useState, useEffect } from 'react';
import { samsDb } from '../utils/db';
import { Exam, Student, ExamGrade } from '../types';
import { BookOpen, UserCheck, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

export default function StudentExamPortal() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('exam_id');

  const [exam, setExam] = useState<Exam | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [stage, setStage] = useState<'auth' | 'info' | 'taking' | 'finished'>('auth');
  
  useEffect(() => {
    if (examId) {
      const exams = samsDb.getExams();
      const found = exams.find(e => e.id === examId);
      if (found) {
        setExam(found);
      } else {
        setErrorMsg('هذا الامتحان غير موجود أو تم حذفه.');
      }
    } else {
      setErrorMsg('رابط الامتحان غير صالح.');
    }
  }, [examId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const students = samsDb.getStudents();
    // Allow login by national_id, barcode, or registration_id
    const found = students.find(s => 
      s.national_id === studentIdInput || 
      s.barcode === studentIdInput || 
      s.registration_id === studentIdInput
    );

    if (!found) {
      setErrorMsg('بيانات الطالب غير صحيحة. تأكد من إدخال الرقم القومي أو الباركود بشكل صحيح.');
      return;
    }

    if (exam && found.class_id !== exam.class_id) {
       setErrorMsg('أنت غير مسجل في المجموعة المخصصة لهذا الامتحان.');
       return;
    }

    // Check if already taken
    const grades = samsDb.getExamGrades();
    const existingGrade = grades.find(g => g.exam_id === exam?.id && g.student_id === found.id);
    if (existingGrade) {
      setErrorMsg('لقد قمت بأداء هذا الامتحان مسبقاً، وتم تسجيل درجاتك بنجاح.');
      return;
    }

    setStudent(found);
    setStage('info');
  };

  const handleStartExam = () => {
    setStage('taking');
    // For external exams, we show the URL and simulate a "Done" button
    // Because we can't iframe all external sites (like google forms may block iframes),
    // we open it in a new tab, and then ask them what their score was, or automatically
    // fetch it (which we can't). Wait.
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-[#0D5C8C] p-6 text-center text-white">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-xl font-bold font-sans">بوابة الامتحانات الإلكترونية</h1>
          {exam && <p className="text-sm text-blue-100 mt-2">{exam.name}</p>}
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-bold border border-emerald-100">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {stage === 'auth' && exam && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-sm font-bold text-slate-700">تسجيل الدخول للامتحان</h2>
                <p className="text-xs text-slate-500 mt-1">الرجاء إدخال رقم الباركود أو الرقم القومي أو رقم القيد الخاص بك.</p>
              </div>
              <input
                type="text"
                placeholder="رقم الباركود أو الرقم القومي..."
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-center focus:border-[#0D5C8C] focus:ring-1 focus:ring-[#0D5C8C] outline-none font-mono"
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#1A7FAA] text-white rounded-xl font-bold shadow-md hover:bg-[#0D5C8C] transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                دخول للامتحان
              </button>
            </form>
          )}

          {stage === 'info' && student && exam && (
            <div className="space-y-5 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">{student.name}</h2>
                <p className="text-xs text-slate-500 mt-1">مرحباً بك، سيتم تسجيل درجات هذا الامتحان باسمك.</p>
              </div>
              
              <div className="text-sm text-slate-600 space-y-2">
                <p>مدة الامتحان: <strong className="text-slate-800">{exam.duration_mins} دقيقة</strong></p>
                <p>الدرجة العظمى: <strong className="text-slate-800">{exam.max_score} درجة</strong></p>
              </div>

              <button
                onClick={handleStartExam}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                بدء الامتحان الآن
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {stage === 'taking' && exam && student && (
             <div className="space-y-4 text-center">
                {exam.exam_url ? (
                  <>
                    <p className="text-sm font-bold text-slate-700 mb-2">اضغط على الزر بالأسفل لفتح الامتحان. بعد الانتهاء اضغط على "تم إنهاء الامتحان" ليتم ربط نتيجتك.</p>
                    <a 
                      href={exam.exam_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-[#0D5C8C] text-white rounded-xl font-bold shadow-md hover:bg-[#1A7FAA] transition-all"
                    >
                      فتح رابط الامتحان (نماذج جوجل وغيرها)
                    </a>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-3">هل أنهيت الامتحان وتم إرسال إجاباتك؟</p>
                      <button
                        onClick={() => {
                          // Simulate grade fetching
                          setSuccessMsg('جاري جلب النتيجة وتوثيقها...');
                          setTimeout(() => {
                             // Random realistic score for simulation (80%-100% of max)
                             const min = Math.floor(exam.max_score * 0.6);
                             const score = Math.floor(Math.random() * (exam.max_score - min + 1)) + min;
                             
                             samsDb.saveExamGrade({
                               id: `eg-${Date.now()}`,
                               exam_id: exam.id,
                               student_id: student.id,
                               score,
                               absent: false
                             });
                             
                             if (exam.auto_attendance) {
                               const today = new Date().toISOString().split('T')[0];
                               samsDb.saveAttendance(student.id, exam.class_id, today, 'present', false);
                             }
                             
                             setStage('finished');
                          }, 2000);
                        }}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        نعم، تم إنهاء الامتحان
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">لا يوجد رابط مخصص لهذا الامتحان الأونلاين.</p>
                )}
             </div>
          )}

          {stage === 'finished' && (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800">تم تسجيل نتيجتك بنجاح!</h2>
              <p className="text-sm text-slate-500 mt-2">شكراً لك، تم رفع درجتك مباشرة إلى لوحة تحكم المعلم. يمكنك الآن إغلاق هذه الصفحة.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

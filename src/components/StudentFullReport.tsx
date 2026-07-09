import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Student, Attendance, ExamGrade, Exam, AssignmentGrade, Assignment, FeePayment, ClassRoom } from '../types';
import { samsDb } from '../utils/db';
import { X, Printer, Download, User, Calendar, BookOpen, CreditCard, CheckCircle, AlertCircle, Award, Target, Hash, Phone, Clock } from 'lucide-react';

interface Props {
  student: Student;
  onClose: () => void;
}

export default function StudentFullReport({ student, onClose }: Props) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [examGrades, setExamGrades] = useState<(ExamGrade & { exam: Exam })[]>([]);
  const [assignmentGrades, setAssignmentGrades] = useState<(AssignmentGrade & { assignment: Assignment })[]>([]);
  const [fees, setFees] = useState<FeePayment[]>([]);
  const [classInfo, setClassInfo] = useState<ClassRoom | null>(null);

  useEffect(() => {
    // Load class info
    const classes = samsDb.getClasses();
    setClassInfo(classes.find(c => c.id === student.class_id) || null);

    // Load attendance
    const allAtt = samsDb.getAttendance();
    setAttendance(allAtt.filter(a => a.student_id === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // Load Exams
    const allExams = samsDb.getExams();
    const allExamGrades = samsDb.getExamGrades();
    const studentExams = allExamGrades
      .filter(eg => eg.student_id === student.id)
      .map(eg => ({
        ...eg,
        exam: allExams.find(e => e.id === eg.exam_id)!
      }))
      .filter(eg => eg.exam)
      .sort((a, b) => new Date(b.exam.date).getTime() - new Date(a.exam.date).getTime());
    setExamGrades(studentExams);

    // Load Assignments
    const allAssignments = samsDb.getAssignments();
    const allAssignmentGrades = samsDb.getAssignmentGrades();
    const studentAssignments = allAssignmentGrades
      .filter(ag => ag.student_id === student.id)
      .map(ag => ({
        ...ag,
        assignment: allAssignments.find(a => a.id === ag.assignment_id)!
      }))
      .filter(ag => ag.assignment)
      .sort((a, b) => new Date(b.assignment.due_date).getTime() - new Date(a.assignment.due_date).getTime());
    setAssignmentGrades(studentAssignments);

    // Load Fees
    const allFees = samsDb.getFees();
    setFees(allFees.filter(f => f.student_id === student.id).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()));
  }, [student.id, student.class_id]);

  const handlePrint = () => {
    window.print();
  };

  const attPresent = attendance.filter(a => a.status === 'present').length;
  const attAbsent = attendance.filter(a => a.status === 'absent').length;
  const attExcused = attendance.filter(a => a.status === 'excused').length;
  const totalAtt = attendance.length;
  const attRate = totalAtt > 0 ? Math.round(((attPresent + attExcused) / totalAtt) * 100) : 0;

  const totalFeesPaid = fees.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] print:p-0 print:bg-white print:block" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-full print:h-auto print:max-h-none print:overflow-visible"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 print:bg-white print:border-slate-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1A7FAA]/10 text-[#1A7FAA] rounded-xl flex items-center justify-center border border-[#1A7FAA]/20">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">التقرير الشامل للطالب</h2>
              <p className="text-sm text-slate-500 font-medium">{student.name} - {student.registration_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-bold text-sm transition-colors">
              <Printer className="w-4 h-4" />
              طباعة التقرير
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar print:p-4 print:space-y-6">
          
          {/* Section 1: Personal Info & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Info Card */}
            <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#1A7FAA]" />
                البيانات الأساسية
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-slate-500">اسم الطالب</span><span className="font-bold text-slate-800">{student.name}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">رقم القيد</span><span className="font-mono text-slate-700">{student.registration_id}</span></div>
                {student.barcode && <div className="flex justify-between items-center"><span className="text-slate-500">باركود الطالب</span><span className="font-mono text-slate-700">{student.barcode}</span></div>}
                <div className="flex justify-between items-center"><span className="text-slate-500">الرقم القومي</span><span className="font-mono text-slate-700">{student.national_id}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">المجموعة</span><span className="font-bold text-[#1A7FAA]">{classInfo?.name || '-'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">السنة الدراسية</span><span className="font-bold text-slate-700">{student.grade_level}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">تاريخ التسجيل</span><span className="text-slate-700">{new Date(student.created_at).toLocaleDateString('ar-EG')}</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-slate-500">ولي الأمر</span>
                  <div className="text-left">
                    <span className="font-bold text-slate-800 block">{student.parent_name || 'غير مدون'}</span>
                    <span className="font-mono text-slate-500 flex items-center gap-1 justify-end mt-0.5"><Phone className="w-3 h-3"/> {student.parent_phone}</span>
                  </div>
                </div>
                {student.notes && (
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-50">
                    <span className="text-slate-500 font-bold text-xs">المذكرات المستلمة</span>
                    <p className="text-slate-700 text-sm leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 whitespace-pre-wrap">{student.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-emerald-800 font-bold flex items-center gap-2"><Target className="w-5 h-5"/> نسبة الحضور</h4>
                  <span className="text-2xl font-extrabold text-emerald-600">{attRate}%</span>
                </div>
                <div className="w-full bg-emerald-200/50 rounded-full h-2 mt-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{width: `${attRate}%`}}></div>
                </div>
                <div className="flex gap-4 mt-3 text-xs font-bold text-emerald-700/70">
                  <span>حاضر: {attPresent}</span>
                  <span>غائب: {attAbsent}</span>
                  <span>مستأذن: {attExcused}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-amber-800 font-bold flex items-center gap-2"><CreditCard className="w-5 h-5"/> إجمالي المدفوعات</h4>
                </div>
                <p className="text-3xl font-extrabold text-amber-600 font-mono mt-1">{totalFeesPaid} <span className="text-sm font-sans">ج.م</span></p>
                <p className="text-xs font-bold text-amber-700/70 mt-2">إجمالي ما تم سداده منذ التسجيل</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-indigo-800 font-bold flex items-center gap-2"><Award className="w-5 h-5"/> التقييمات والامتحانات</h4>
                </div>
                <p className="text-xl font-extrabold text-indigo-600 mt-1">{examGrades.length} <span className="text-sm font-bold">امتحان</span></p>
                <p className="text-xs font-bold text-indigo-700/70 mt-2">تم تسجيل درجات لها</p>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sky-800 font-bold flex items-center gap-2"><BookOpen className="w-5 h-5"/> الواجبات</h4>
                </div>
                <p className="text-xl font-extrabold text-sky-600 mt-1">{assignmentGrades.length} <span className="text-sm font-bold">تكليف</span></p>
                <p className="text-xs font-bold text-sky-700/70 mt-2">نسبة التسليم: {assignmentGrades.length > 0 ? Math.round((assignmentGrades.filter(a => a.completed).length / assignmentGrades.length)*100) : 0}%</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Attendance History */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1A7FAA]" />
              سجل الحضور والغياب المفصل
            </h3>
            {attendance.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {attendance.map(att => (
                  <div key={att.id} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${
                    att.status === 'present' ? 'bg-emerald-50 border-emerald-100' :
                    att.status === 'absent' ? 'bg-rose-50 border-rose-100' :
                    'bg-amber-50 border-amber-100'
                  }`}>
                    <span className="text-xs font-bold text-slate-700">{new Date(att.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                      att.status === 'present' ? 'bg-emerald-200 text-emerald-800' :
                      att.status === 'absent' ? 'bg-rose-200 text-rose-800' :
                      'bg-amber-200 text-amber-800'
                    }`}>
                      {att.status === 'present' ? 'حاضر' : att.status === 'absent' ? 'غائب' : 'مستأذن'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">لا توجد سجلات حضور مسجلة لهذا الطالب.</p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Exams & Assignments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                سجل الامتحانات
              </h3>
              {examGrades.length > 0 ? (
                <div className="space-y-3">
                  {examGrades.map(eg => (
                    <div key={eg.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{eg.exam.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(eg.exam.date).toLocaleDateString('ar-EG')} • {eg.exam.type}</p>
                      </div>
                      <div className="text-left">
                        {eg.absent ? (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">غائب عن الامتحان</span>
                        ) : (
                          <p className="font-extrabold text-indigo-700 text-lg">{eg.score} <span className="text-xs text-slate-400 font-medium">/ {eg.exam.max_score}</span></p>
                        )}
                        {eg.teacher_notes && <p className="text-[10px] text-amber-600 mt-1 max-w-[120px] truncate" title={eg.teacher_notes}>{eg.teacher_notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">لا توجد درجات امتحانات.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                سجل التكليفات والواجبات
              </h3>
              {assignmentGrades.length > 0 ? (
                <div className="space-y-3">
                  {assignmentGrades.map(ag => (
                    <div key={ag.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{ag.assignment.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">الاستلام: {new Date(ag.assignment.due_date).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="text-left">
                        {ag.completed ? (
                          <p className="font-extrabold text-emerald-600 text-lg">{ag.score} <span className="text-xs text-slate-400 font-medium">/ {ag.assignment.max_score}</span></p>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">لم يتم التسليم</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">لا توجد تكليفات مسجلة.</p>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Fees History */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              سجل المدفوعات المالية
            </h3>
            {fees.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">التاريخ</th>
                      <th className="px-4 py-3">المبلغ</th>
                      <th className="px-4 py-3">النوع</th>
                      <th className="px-4 py-3">البيان/الشهر</th>
                      <th className="px-4 py-3">رقم الإيصال</th>
                      <th className="px-4 py-3">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fees.map(fee => (
                      <tr key={fee.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs">{new Date(fee.payment_date).toLocaleDateString('ar-EG')}</td>
                        <td className="px-4 py-3 font-extrabold text-amber-600">{fee.amount} ج.م</td>
                        <td className="px-4 py-3 text-slate-700">{fee.category === 'tuition' ? 'مصروفات دراسية' : fee.category === 'bus' ? 'اشتراك باص' : fee.category === 'uniform' ? 'زي مدرسي' : 'أنشطة'}</td>
                        <td className="px-4 py-3 text-slate-600 font-bold">{fee.month || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{fee.receipt_number || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
                            {fee.payment_method === 'cash' ? 'نقدي' : fee.payment_method === 'card' ? 'فيزا' : 'تحويل'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">لا توجد مدفوعات مسجلة.</p>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClassRoom, Teacher, Subject, CenterScheduleData, Student } from '../types';
import { samsDb } from '../utils/db';
import { Plus, BookOpen, User, Maximize2, Search, ShieldAlert, Check, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ClassesManager() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddClass, setShowAddClass] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [classGradeFilter, setClassGradeFilter] = useState('all');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [successText, setSuccessText] = useState('');
  const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);
  
  const [classForm, setClassForm] = useState({
    name: '',
    schedule_days: '',
    schedule_time: '',
    grade_level: 'الأول الإعدادي'
  });

  const [schedule, setSchedule] = useState<CenterScheduleData | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CenterScheduleData | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    return () => window.removeEventListener('sams_data_changed', loadData);
  }, []);

  useEffect(() => {
    if (errorText) {
      const timer = setTimeout(() => {
        setErrorText('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorText]);

  useEffect(() => {
    if (successText) {
      const timer = setTimeout(() => {
        setSuccessText('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successText]);

  const confirmDeleteClass = () => {
    if (classToDelete) {
      const res = samsDb.deleteClass(classToDelete.id);
      if (res.success) {
        setSuccessText(`تم حذف المجموعة "${classToDelete.name}" بنجاح!`);
        setClassToDelete(null);
        loadData();
      } else {
        setErrorText(res.error || 'فشل حذف المجموعة.');
        setClassToDelete(null);
      }
    }
  };

  const loadData = () => {
    setClasses(samsDb.getClasses());
    setStudents(samsDb.getStudents());
    setTeachers(samsDb.getTeachers());
    setSubjects(samsDb.getSubjects());
    setSchedule(samsDb.getCenterSchedule());
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!classForm.name) {
      setErrorText('يرجى تحديد اسم للمجموعة الدراسية.');
      return;
    }
    if (!classForm.schedule_days || classForm.schedule_days.trim() === '') {
      setErrorText('يرجى تحديد أيام المجموعة الدراسية.');
      return;
    }
    if (!classForm.schedule_time || classForm.schedule_time.trim() === '') {
      setErrorText('يرجى تحديد وقت المجموعة الدراسية.');
      return;
    }
    if (!classForm.grade_level) {
      setErrorText('يرجى تحديد الصف الدراسي للمجموعة.');
      return;
    }

    const newCls: ClassRoom = {
      id: `c-${Date.now()}`,
      name: classForm.name,
      schedule_days: classForm.schedule_days,
      schedule_time: classForm.schedule_time,
      capacity: 0,
      grade_level: classForm.grade_level
    };

    samsDb.addClass(newCls);
    setClassForm({
      name: '',
      schedule_days: '',
      schedule_time: '',
      grade_level: 'الأول الإعدادي'
    });
    setShowAddClass(false);
    loadData();
  };

  return (
    <div className="space-y-6" id="sams_classes_module">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            
            إدارة المجموعات والمقررات والجداول بالسنتر
          </h2>
          <p className="text-xs text-slate-500 mt-1">تنسيق المجموعات الدراسية وسعتها الاستيعابية ومواعيدها</p>
        </div>
        <button
          onClick={() => {
            setShowAddClass(!showAddClass);
            setErrorText('');
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddClass ? 'إغلاق النموذج' : 'تأسيس مجموعة جديدة'}</span>
        </button>
      </div>

      {/* Error text alert */}
      {errorText && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#C0152A] rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E8192C] shrink-0" />
          <span className="font-semibold">{errorText}</span>
        </div>
      )}

      {/* Success text alert */}
      {successText && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successText}</span>
        </div>
      )}

      {/* Initialize classroom form */}
      {showAddClass && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">
          <h3 className="font-bold text-[#0D5C8C] text-sm mb-4 border-b border-gray-50 pb-2">تأسيس مجموعة دراسية جديدة</h3>
          <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-sans">اسم المجموعة الدراسية *</label>
              <input
                type="text"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                className="w-full text-xs font-sans border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-hidden focus:border-[#0D5C8C] text-right"
                placeholder="اسم المجموعة"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-sans">أيام المجموعة *</label>
              <div className="flex flex-wrap gap-1.5">
                {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                  <label key={day} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[11px] cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      className="accent-[#0D5C8C]"
                      checked={(classForm.schedule_days || '').includes(day)}
                      onChange={(e) => {
                        const currentDays = classForm.schedule_days ? classForm.schedule_days.split('، ').filter(Boolean) : [];
                        if (e.target.checked) {
                          setClassForm({ ...classForm, schedule_days: [...currentDays, day].join('، ') });
                        } else {
                          setClassForm({ ...classForm, schedule_days: currentDays.filter(d => d !== day).join('، ') });
                        }
                      }}
                    />
                    <span className="font-bold text-slate-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-sans">وقت المجموعة *</label>
              <input
                type="text"
                value={classForm.schedule_time}
                onChange={(e) => setClassForm({ ...classForm, schedule_time: e.target.value })}
                className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg focus:outline-hidden focus:border-[#0D5C8C] text-right bg-white"
                placeholder="أدخل وقت المواعيد..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-sans">الصف الدراسي *</label>
              <select
                value={classForm.grade_level}
                onChange={(e) => setClassForm({ ...classForm, grade_level: e.target.value })}
                className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg focus:outline-hidden focus:border-[#0D5C8C] text-right bg-white"
                required
              >
                <option value="الأول الإعدادي">الأول الإعدادي</option>
                <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                <option value="الأول الثانوي">الأول الثانوي</option>
                <option value="الثاني الثانوي">الثاني الثانوي</option>
                <option value="الثالث الثانوي">الثالث الثانوي</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 border-t border-slate-50 pt-3">
              <button
                type="button"
                onClick={() => setShowAddClass(false)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-600 font-bold shrink-0 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
              >
                تأسيس المجموعة الدراسية
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="ابحث باسم المجموعة..."
            value={classSearchQuery}
            onChange={(e) => setClassSearchQuery(e.target.value)}
            className="w-full text-right pr-9 pl-3 h-10 text-xs border border-slate-200 rounded-xl focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden"
            dir="rtl"
          />
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
        </div>
        <select
          value={classGradeFilter}
          onChange={(e) => setClassGradeFilter(e.target.value)}
          className="h-10 w-full md:w-auto shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
        >
          <option value="all">كل الصفوف</option>
          <option value="الأول الإعدادي">الأول الإعدادي</option>
          <option value="الثاني الإعدادي">الثاني الإعدادي</option>
          <option value="الثالث الإعدادي">الثالث الإعدادي</option>
          <option value="الأول الثانوي">الأول الثانوي</option>
          <option value="الثاني الثانوي">الثاني الثانوي</option>
          <option value="الثالث الثانوي">الثالث الثانوي</option>
        </select>
      </div>

      {/* Class list Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes
          .filter(cls => (classGradeFilter === 'all' || cls.grade_level === classGradeFilter) && cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()))
          .map((cls) => {
          
          const currentSubjects = subjects.filter(s => s.class_id === cls.id);
          const totalHours = currentSubjects.reduce((sum, item) => sum + item.weekly_hours, 0);

          return (
            <div key={cls.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-4" id={`classroom_card_${cls.id}`}>
              
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">{cls.name}</h3>
                  <button
                    onClick={() => setClassToDelete(cls)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    title="حذف المجموعة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold font-sans">{cls.grade_level}</span>
              </div>

              {/* Attributes */}
              <div className="space-y-2.5 text-xs">
                
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-sans">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    مواعيد المجموعة
                  </span>
                  <span className="font-bold text-slate-800">{cls.schedule_days ? `${cls.schedule_days} - ${cls.schedule_time || ''}` : 'ـ لم تحدد بعد ـ'}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-sans">
                    <User className="w-4 h-4 text-slate-400" />
                    عدد الطلاب
                  </span>
                  <span className="font-bold text-slate-800">{students.filter(s => s.class_id === cls.id).length} طالب</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-sans">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    المحاضرات والمقررات
                  </span>
                  <span className="font-bold text-[#0D5C8C]">{currentSubjects.length} مقررات ({totalHours} ساعة/أسبوع)</span>
                </div>

              </div>

              {/* Subjects in that group list display */}
              <div className="pt-3 border-t border-slate-50 space-y-1.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase">قائمة المواد الدراسية النشطة بالمجموعة:</p>
                {currentSubjects.length === 0 ? (
                  <p className="text-[10px] text-amber-600 italic">يتم تدريس المحاضرات الأساسية حالياً.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {currentSubjects.map(sub => (
                      <span key={sub.id} className="text-[10px] bg-[#0D5C8C]/5 text-[#0D5C8C] border border-[#0D5C8C]/10 px-2 py-0.5 rounded font-medium">
                        {sub.name} ({sub.weekly_hours}س)
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>


      {/* Dynamic Week Class Schedule */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            أوقات المحاضرات وجدول التوزيع اليومي الأسبوعي الأساسي للمجموعات بالسنتر
          </h3>
          {!isEditingSchedule ? (
            <button onClick={() => { setIsEditingSchedule(true); setEditingSchedule(schedule ? JSON.parse(JSON.stringify(schedule)) : null); }} className="text-xs bg-[#0D5C8C] text-white px-3 py-1.5 rounded-lg">تعديل الجدول</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditingSchedule(false)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">إلغاء</button>
              <button onClick={() => { if (editingSchedule) { samsDb.saveCenterSchedule(editingSchedule); setSchedule(editingSchedule); setIsEditingSchedule(false); } }} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><Check className="w-3 h-3"/> حفظ</button>
            </div>
          )}
        </div>
        
        <p className="text-[11px] text-slate-500 leading-relaxed">
          يتكون الأسبوع الدراسي من أيام وفترات يمكن تخصيصها.
        </p>

        {(isEditingSchedule && editingSchedule) || (!isEditingSchedule && schedule) ? (
          <div className="overflow-x-auto border border-gray-100 rounded-xl mt-2 text-xxs sm:text-xs">
            <table className="min-w-full text-right border-collapse" dir="rtl">
              <thead className="bg-[#0D5C8C] text-white">
                <tr>
                  <th className="p-3 w-32 border-b border-[#0A4B73]">اليوم</th>
                  {(isEditingSchedule ? editingSchedule : schedule)?.periods?.map(period => (
                    <th key={period.id} className="p-2 border-r border-[#0A4B73] border-b">
                      {isEditingSchedule ? (
                        <div className="flex flex-col gap-1 items-start">
                          <input type="text" value={period.name} onChange={(e) => {
                            const newSched = {...editingSchedule} as any;
                            const p = newSched.periods.find((x: any) => x.id === period.id);
                            if (p) p.name = e.target.value;
                            setEditingSchedule(newSched);
                          }} className="text-black px-1 py-0.5 rounded text-xs w-full" placeholder="اسم الفترة" />
                          <input type="text" value={period.time} onChange={(e) => {
                            const newSched = {...editingSchedule} as any;
                            const p = newSched.periods.find((x: any) => x.id === period.id);
                            if (p) p.time = e.target.value;
                            setEditingSchedule(newSched);
                          }} className="text-black px-1 py-0.5 rounded text-[10px] w-full mt-1" placeholder="الوقت" />
                          <label className="flex items-center gap-1 text-[10px] mt-1"><input type="checkbox" checked={period.isBreak} onChange={(e) => {
                            const newSched = {...editingSchedule} as any;
                            const p = newSched.periods.find((x: any) => x.id === period.id);
                            if (p) p.isBreak = e.target.checked;
                            setEditingSchedule(newSched);
                          }} /> استراحة؟</label>
                        </div>
                      ) : (
                        <div className="text-center">{period.name} <br/><span className="text-[10px] opacity-80">({period.time})</span></div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans text-slate-700">
                {(isEditingSchedule ? editingSchedule : schedule)?.days?.map(day => (
                  <tr key={day.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold bg-slate-50 border-l border-gray-100">
                      {isEditingSchedule ? (
                        <input type="text" value={day.name} onChange={(e) => {
                          const newSched = {...editingSchedule} as any;
                          const d = newSched.days.find((x: any) => x.id === day.id);
                          if (d) d.name = e.target.value;
                          setEditingSchedule(newSched);
                        }} className="px-1 py-0.5 border rounded w-full" />
                      ) : (
                        day.name
                      )}
                    </td>
                    {(isEditingSchedule ? editingSchedule : schedule)?.periods?.map(period => {
                      const entryKey = `${day.id}_${period.id}`;
                      const currentSchedule = isEditingSchedule ? editingSchedule : schedule;
                      const currentSubject = currentSchedule?.entries?.[entryKey] || '';
                      
                      return (
                        <td key={period.id} className={`p-3 border-r border-gray-100 ${period.isBreak ? 'bg-slate-50/50 text-slate-400' : ''}`}>
                          {isEditingSchedule && !period.isBreak ? (
                            <div className="flex flex-col gap-1">
                              <input type="text" value={currentSubject.includes('||') ? currentSubject.split('||')[0] : currentSubject} onChange={(e) => {
                                 const newSched = JSON.parse(JSON.stringify(editingSchedule));
                                 if (!newSched.entries) newSched.entries = {};
                                 const grade = currentSubject.includes('||') ? currentSubject.split('||')[1] : '';
                                 newSched.entries[entryKey] = `${e.target.value}||${grade}`;
                                 setEditingSchedule(newSched);
                              }} className="px-2 py-1 border rounded w-full text-xs" placeholder="اسم المجموعة" />
                              <input type="text" value={currentSubject.includes('||') ? currentSubject.split('||')[1] || '' : ''} onChange={(e) => {
                                 const newSched = JSON.parse(JSON.stringify(editingSchedule));
                                 if (!newSched.entries) newSched.entries = {};
                                 const group = currentSubject.includes('||') ? currentSubject.split('||')[0] : currentSubject;
                                 newSched.entries[entryKey] = `${group}||${e.target.value}`;
                                 setEditingSchedule(newSched);
                              }} className="px-2 py-1 border rounded w-full text-[10px]" placeholder="الصف الدراسي" />
                            </div>
                          ) : (
                            <div className="text-center">
                              {period.isBreak ? <span className="text-[10px] italic">فترة استراحة</span> : (
                                currentSubject ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-bold text-xs">{currentSubject.includes('||') ? currentSubject.split('||')[0] : currentSubject}</span>
                                    {currentSubject.includes('||') && currentSubject.split('||')[1] && (
                                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1">{currentSubject.split('||')[1]}</span>
                                    )}
                                  </div>
                                ) : <span className="text-slate-300">-</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-5 text-slate-500 text-xs">جاري تحميل الجدول...</div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {classToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">تأكيد حذف المجموعة الدراسية</h3>
                  <p className="text-[11px] text-slate-500 font-sans">إجراء إداري حساس وغير قابل للتراجع</p>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-2 py-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p>هل أنت متأكد من رغبتك في حذف المجموعة: <strong className="text-red-700">"{classToDelete.name}"</strong>؟</p>
                <p className="text-[10px] text-slate-400">ملاحظة: سيقوم النظام بالتحقق أولاً من عدم وجود أي طالب مسجل بهذه المجموعة كإجراء وقائي لمنع فقدان البيانات.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setClassToDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClass}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الحذف النهائي
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
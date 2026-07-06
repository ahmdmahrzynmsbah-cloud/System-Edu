import React, { useState, useEffect } from 'react';
import { samsDb } from '../utils/db';
import { Student, ClassRoom } from '../types';
import { Search, Plus, Filter, Edit, Trash2, ShieldAlert, CheckCircle, Eye, X, BookOpen, CreditCard, Calendar, Phone, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StudentFullReport from './StudentFullReport';

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Full Report state
  const [showFullReport, setShowFullReport] = useState(false);
  const [showBriefProfile, setShowBriefProfile] = useState(false);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  
  // Selected Profile for detail card
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null);

  // Calculate attendance statistics for the selected student
  const getStudentAttendanceStats = (studentId: string) => {
    const records = samsDb.getAttendance().filter(a => a.student_id === studentId);
    if (records.length === 0) {
      return {
        percentage: 100,
        total: 0,
        present: 0,
        absent: 0,
        statusLabel: 'لا توجد سجلات 📂',
        statusColor: 'text-slate-500',
        bgClass: 'bg-slate-50 border-slate-200 text-slate-600',
        description: 'لم يتم تسجيل أي حضور أو غياب لهذا الطالب بعد في النظام.'
      };
    }

    const total = records.length;
    const present = records.filter(a => a.status === 'present').length;
    const excused = records.filter(a => a.status === 'excused').length;
    const absent = records.filter(a => a.status === 'absent').length;
    
    const percentage = Math.round((present / total) * 100);

    let statusLabel = 'مستقر';
    let statusColor = 'text-emerald-600';
    let bgClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
    let description = `نسبة حضور الطالب للشهر الحالي سجلت ${percentage}% مع عدم رصد أي إنذار غياب مسبق.`;

    if (percentage >= 90) {
      statusLabel = 'ممتاز ✨';
      statusColor = 'text-emerald-700';
      bgClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
      description = `نسبة حضور الطالب ممتازة حيث بلغت ${percentage}% (حضر ${present} من أصل ${total} حصص).`;
    } else if (percentage >= 75) {
      statusLabel = 'مستقر 👍';
      statusColor = 'text-[#0D5C8C]';
      bgClass = 'bg-sky-50 border-sky-100 text-[#0D5C8C]';
      description = `نسبة حضور الطالب مستقرة عند ${percentage}% (حضر ${present} من أصل ${total} حصص).`;
    } else if (percentage >= 50) {
      statusLabel = 'إنذار غياب ⚠️';
      statusColor = 'text-amber-700';
      bgClass = 'bg-amber-50 border-amber-100 text-amber-800';
      description = `انتباه: تراجعت نسبة حضور الطالب إلى ${percentage}% بسبب غيابه المتكرر (${absent} حصص غياب).`;
    } else {
      statusLabel = 'حرج خطير 🚨';
      statusColor = 'text-rose-700';
      bgClass = 'bg-rose-50 border-rose-100 text-rose-800';
      description = `خطر: نسبة الحضور حرجة جداً وتساوي ${percentage}% (تغيب الطالب في ${absent} حصص من أصل ${total}).`;
    }

    return { percentage, total, present, absent, excused, statusLabel, statusColor, bgClass, description };
  };

  // Custom Delete Confirm state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // Creating/Editing student states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    grade_level: 'الأول الإعدادي',
    birth_date: '2015-05-12',
    phone: '',
    parent_name: '',
    parent_phone: '',
    notes: '',
    status: 'active' as Student['status']
  });

  useEffect(() => {
    loadData();
    const pendingSearch = localStorage.getItem('sams_global_search');
    if (pendingSearch) {
      setSearchTerm(pendingSearch);
      localStorage.removeItem('sams_global_search');
    }
  }, []);

  const loadData = () => {
    setStudents(samsDb.getStudents());
    const cl = samsDb.getClasses();
    setClasses(cl);
    if (!formData.class_id && cl.length > 0) {
      setFormData(prev => ({ ...prev, class_id: cl[0].id }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const executeAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name || !formData.phone || !formData.class_id) {
      setErrorMessage('يرجى ملء جميع الحقول الإلزامية التي تحمل النجمة (*).');
      return;
    }
    
    if (!isEditing) {
      const res = samsDb.addStudent(formData);
      if (res.success && res.student) {
        setSuccessMessage(`تم تسجيل الطالب بنجاح برقم القيد: ${res.student.registration_id}`);
        setFormData({
          name: '',
          class_id: classes[0]?.id || '',
          grade_level: 'الأول الإعدادي',
          birth_date: '2016-01-01',
          phone: '',
          parent_name: '',
          parent_phone: '',
          notes: '',
          status: 'active'
        });
        setShowAddForm(false);
        loadData();
      } else {
        setErrorMessage(res.error || 'حدث خطأ غير متوقع أثناء تسجيل الطالب.');
      }
    } else {
      const updatedStudent: Student = {
        ...formData,
        id: editId,
        registration_id: students.find(s => s.id === editId)?.registration_id || '20230000',
        created_at: students.find(s => s.id === editId)?.created_at || '2023-09-01'
      };
      
      const res = samsDb.updateStudent(updatedStudent);
      if (res.success) {
        setSuccessMessage('تم تعديل وحفظ بيانات الطالب بنجاح.');
        setIsEditing(false);
        setEditId('');
        setShowAddForm(false);
        loadData();
        if (selectedProfile && selectedProfile.id === editId) {
          setSelectedProfile(updatedStudent);
        }
      } else {
        setErrorMessage(res.error || 'فشل التعديل.');
      }
    }
  };

  const handleEditClick = (student: Student) => {
    setIsEditing(true);
    setEditId(student.id);
    setFormData({
      name: student.name,
      class_id: student.class_id,
      grade_level: student.grade_level,
      birth_date: student.birth_date,
      phone: student.phone,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      notes: student.notes || '',
      status: student.status
    });
    setShowAddForm(true);
    setErrorMessage('');
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      samsDb.softDeleteStudent(studentToDelete.id);
      setSuccessMessage('تمت أرشفة ونقل قيد الطالب بنجاح.');
      setStudentToDelete(null);
      loadData();
      if (selectedProfile?.id === studentToDelete.id) {
        setSelectedProfile(null);
      }
    }
  };

  const cancelDelete = () => {
    setStudentToDelete(null);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.registration_id.includes(searchTerm);
    const matchesClass = classFilter === 'all' || s.class_id === classFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || s.grade_level === gradeFilter;
    return matchesSearch && matchesClass && matchesStatus && matchesGrade;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6" 
      id="sams_students_module"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            إدارة سجلات الطلاب والقبول والتسجيل
          </h2>
          <p className="text-xs text-slate-500 mt-1">تسجيل، تعديل، أرشفة الطلاب الجدد وإدارة الملفات السنتر</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: '', class_id: classes[0]?.id || '', grade_level: 'الأول الإعدادي', 
                birth_date: '2016-01-01', phone: '', parent_name: '', parent_phone: '', notes: '', status: 'active'
              });
              setShowAddForm(!showAddForm);
              setErrorMessage('');
            }}
            className="px-4 py-2 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:bg-[#0D5C8C] transition-all"
          >
            {showAddForm && !isEditing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm && !isEditing ? 'إغلاق النموذج' : 'إضافة طالب جديد'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-3 text-sm font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </motion.div>
        )}
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-bold">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={executeAddOrUpdate} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-5">
              <h3 className="font-bold text-slate-800 border-b border-gray-100 pb-3">{isEditing ? 'تعديل بيانات الطالب المحددة' : 'تسجيل قيد طالب جديد'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">اسم الطالب الرباعي <span className="text-rose-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 focus:border-[#1A7FAA] outline-none transition-all" placeholder="الاسم كامل..." />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">هاتف الطالب <span className="text-rose-500">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none" placeholder="01X XXXX XXXX" dir="ltr" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">المجموعة المخصصة <span className="text-rose-500">*</span></label>
                  <select name="class_id" value={formData.class_id} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.grade_level})</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">الصف الدراسي</label>
                  <select name="grade_level" value={formData.grade_level} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    <option value="الأول الإعدادي">الأول الإعدادي</option>
                    <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                    <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">تاريخ الميلاد</label>
                  <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">حالة القيد</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    <option value="active">مفعل ومنتظم</option>
                    <option value="inactive">مجمد مؤقتاً</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">اسم ولي الأمر</label>
                  <input type="text" name="parent_name" value={formData.parent_name} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="الاسم..." />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">رقم هاتف ولي الأمر (للطوارئ)</label>
                  <input type="tel" name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="01X XXXX XXXX" dir="ltr" />
                </div>
                <div className="space-y-1.5 lg:col-span-3">
                  <label className="text-xs font-semibold text-slate-600 block">المذكرات (الكتب والملازم التي استلمها الطالب) <span className="text-slate-400 font-normal">- اختياري</span></label>
                  <textarea name="notes" value={formData.notes || ''} onChange={(e) => handleInputChange(e as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none min-h-[80px]" placeholder="مثال: استلم مذكرة الباب الأول وتم الدفع، كتاب المراجعة النهائية (باقي 50 جنيه)..." />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl ml-3">إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-[#1A7FAA] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0D5C8C]">
                  {isEditing ? 'حفظ التعديلات المطبقة' : 'حفظ وتسجيل الطالب المذكور'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Tools Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 shrink-0">
          <input 
            type="text" 
            placeholder="البحث بالاسم المذكور أو بكود التسجيل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1A7FAA]/30 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <div className="flex w-full md:w-auto items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
              <option value="all">كل الصفوف (الكل)</option>
              <option value="الأول الإعدادي">الأول الإعدادي</option>
              <option value="الثاني الإعدادي">الثاني الإعدادي</option>
              <option value="الثالث الإعدادي">الثالث الإعدادي</option>
              <option value="الأول الثانوي">الأول الثانوي</option>
              <option value="الثاني الثانوي">الثاني الثانوي</option>
              <option value="الثالث الثانوي">الثالث الثانوي</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
              <option value="all">كل المجموعات (الكل)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none cursor-pointer">
            <option value="all">كل الحالات (مفعل/غير مفعل)</option>
            <option value="active">المنتظمون فقط (مفعل)</option>
            <option value="inactive">المجمدون فقط (غير مفعل)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-gray-100 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-4 pr-6">م</th>
                  <th className="px-4 py-4 min-w-[200px]">بيانات الطالب</th>
                  <th className="px-4 py-4 min-w-[150px]">المجموعة والصف الدراسي</th>
                  <th className="px-4 py-4 min-w-[140px]">رقم ولي الأمر</th>
                  <th className="px-4 py-4 min-w-[200px]">المذكرات المستلمة</th>
                  <th className="px-4 py-4 text-left pl-6 min-w-[160px]">إجراءات التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {filteredStudents.length > 0 ? filteredStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 pr-6 text-xs text-slate-400 font-mono">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 font-bold text-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{student.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">#{student.registration_id}</p>
                            {student.status === 'active' ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> منتظم</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> غير منتظم</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0D5C8C] text-xs bg-sky-50 px-2 py-1 rounded-md inline-flex items-center w-fit border border-sky-100">
                          {classes.find(c => c.id === student.class_id)?.name || '-'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 mr-1">{student.grade_level}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100" dir="ltr">
                        {student.parent_phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {student.notes ? (
                        <div className="max-w-[200px] whitespace-normal text-[11px] text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-100" title={student.notes}>
                          {student.notes}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 pl-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedProfile(student);
                            setShowBriefProfile(true);
                          }} 
                          className="p-1.5 text-slate-400 hover:text-[#1A7FAA] hover:bg-sky-50 rounded-lg transition-colors" 
                          title="عرض الملف"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProfile(student);
                            setShowFullReport(true);
                          }} 
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="التقرير الشامل"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditClick(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="أرشفة وحذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p>لا توجد سجلات طلاب مطابقة للشروط الحالية</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      <AnimatePresence>
        {selectedProfile && showBriefProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    الملف الأكاديمي والشخصي
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowBriefProfile(false);
                        setSelectedProfile(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-[#1A7FAA]/10 flex items-center justify-center border border-[#1A7FAA]/20 text-[#1A7FAA] shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{selectedProfile.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">قيد: #{selectedProfile.registration_id}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">المجموعة المقيد بها</span>
                    <span className="font-bold text-[#1A7FAA] bg-[#1A7FAA]/5 px-2 py-0.5 rounded">{classes.find(c => c.id === selectedProfile.class_id)?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">الصف الدراسي</span>
                    <span className="font-bold text-slate-700">{selectedProfile.grade_level}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">تاريخ الميلاد</span>
                    <span className="font-mono text-slate-600">{selectedProfile.birth_date}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-slate-50">
                    <span className="text-slate-500">هاتف ولي الأمر</span>
                    <span className="font-mono text-slate-600" dir="ltr">{selectedProfile.parent_phone}</span>
                  </div>
                  {selectedProfile.notes && (
                    <div className="flex flex-col gap-1 p-2 bg-amber-50 rounded-lg mt-2 border border-amber-100">
                      <span className="text-amber-700 font-bold text-[10px]">المذكرات المستلمة</span>
                      <span className="text-amber-900 text-xs leading-relaxed whitespace-pre-wrap">{selectedProfile.notes}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const stats = getStudentAttendanceStats(selectedProfile.id);
                  return (
                    <div className={`p-3 border rounded-xl space-y-2 text-xs ${stats.bgClass}`}>
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>حضور وانتظام الطالب</span>
                        <span className={`font-extrabold ${stats.statusColor}`}>{stats.statusLabel}</span>
                      </div>
                      <p className={`text-[10px] ${stats.statusColor} opacity-80 leading-relaxed`}>{stats.description}</p>
                    </div>
                  );
                })()}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowBriefProfile(false);
                      setShowFullReport(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#1A7FAA] hover:bg-[#156a8e] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    عرض التقرير الشامل للطالب
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {studentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">تأكيد الحذف</h3>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                هل أنت متأكد تماماً من رغبتك في أرشفة الطالب <span className="font-bold text-slate-800">"{studentToDelete.name}"</span>؟ ستطبق عليه عملية Soft Delete وسيُنقل لسجلات الأرشيف.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                >
                  نعم، أرشفة الطالب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullReport && selectedProfile && (
          <StudentFullReport
            student={selectedProfile}
            onClose={() => {
              setShowFullReport(false);
              setSelectedProfile(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

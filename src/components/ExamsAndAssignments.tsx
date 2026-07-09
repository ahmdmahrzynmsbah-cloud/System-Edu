/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Assignment, ExamGrade, AssignmentGrade, Student, ClassRoom } from '../types';
import { samsDb , saveToStorage } from '../utils/db';
import {
  Check,
  X,
  Plus,
  Trash2,
  Edit,
  Save,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Award,
  Notebook,
  ListPlus,
  GraduationCap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export default function ExamsAndAssignments() {
  const [activeSubTab, setActiveSubTab] = useState<'grading' | 'exams' | 'assignments'>('grading');
  
  // Base data lists
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examGrades, setExamGrades] = useState<ExamGrade[]>([]);
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([]);

  // Selected filters for grading
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [gradingType, setGradingType] = useState<'exam' | 'assignment'>('exam');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
  const [termFilter, setTermFilter] = useState<'first_term' | 'second_term'>('first_term');

  // Input states for Exam creation/editing
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'quiz' as Exam['type'],
    max_score: 20,
    duration_mins: 30,
    date: new Date().toISOString().split('T')[0],
    class_id: '',
    term: 'first_term' as Exam['term'],
    mode: 'center' as 'center' | 'online',
    exam_url: '',
    auto_attendance: false
  });

  // Input states for Assignment creation/editing
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    max_score: 10,
    due_date: new Date().toISOString().split('T')[0],
    class_id: '',
    term: 'first_term' as Assignment['term']
  });

  // Batch grading temp inputs
  // key is student_id, value is object with score, absent/completed, notes
  const [tempGrades, setTempGrades] = useState<Record<string, { score: number; flag: boolean; notes: string }>>({});
  const [isEditingSheet, setIsEditingSheet] = useState<boolean>(false);

  // Search queries for lists
  const [examSearch, setExamSearch] = useState('');
  const [examGradeFilter, setExamGradeFilter] = useState('all');
  const [examClassFilter, setExamClassFilter] = useState('all');
  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState('all');
  const [assignmentClassFilter, setAssignmentClassFilter] = useState('all');
  const [gradingGradeFilter, setGradingGradeFilter] = useState('all');
  const [assignmentSearch, setAssignmentSearch] = useState('');

  // Deletion modals state
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Notifications feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Load all initial data from Database
  useEffect(() => {
    loadAllData();
    window.addEventListener('sams_data_changed', loadAllData);
    return () => window.removeEventListener('sams_data_changed', loadAllData);
  }, []);

  const loadAllData = () => {
    const allClasses = samsDb.getClasses();
    const allStudents = samsDb.getStudents();
    const allExams = samsDb.getExams();
    const allAssignments = samsDb.getAssignments();
    const allExamGrades = samsDb.getExamGrades();
    const allAssignmentGrades = samsDb.getAssignmentGrades();

    setClasses(allClasses);
    setStudents(allStudents);
    setExams(allExams);
    setAssignments(allAssignments);
    setExamGrades(allExamGrades);
    setAssignmentGrades(allAssignmentGrades);

    // Auto set defaults if not set yet
    if (allClasses.length > 0) {
      if (!selectedClassId) setSelectedClassId(allClasses[0].id);
      if (!examForm.class_id) setExamForm(prev => ({ ...prev, class_id: allClasses[0].id }));
      if (!assignmentForm.class_id) setAssignmentForm(prev => ({ ...prev, class_id: allClasses[0].id }));
    }
  };

  // When changing filters, update default evaluations and load student grading sheets
  const availableEvaluations = useMemo(() => {
    if (gradingType === 'exam') {
      return exams.filter(e => e.class_id === selectedClassId && e.term === termFilter);
    } else {
      return assignments.filter(a => a.class_id === selectedClassId && a.term === termFilter);
    }
  }, [exams, assignments, selectedClassId, gradingType, termFilter]);

  // Handle setting active evaluation ID automatically when the list of available ones changes
  useEffect(() => {
    if (availableEvaluations.length > 0) {
      // Keep selected if still valid, else select first
      const exists = availableEvaluations.some(e => e.id === selectedEvaluationId);
      if (!exists) {
        setSelectedEvaluationId(availableEvaluations[0].id);
      }
    } else {
      setSelectedEvaluationId('');
    }
  }, [availableEvaluations, selectedEvaluationId]);

  // Populate temp grades state when active evaluation or group changes
  useEffect(() => {
    if (!selectedEvaluationId) {
      setTempGrades({});
      setIsEditingSheet(false);
      return;
    }

    const groupStudents = students.filter(s => s.class_id === selectedClassId);
    const initialTemp: Record<string, { score: number; flag: boolean; notes: string }> = {};
    let hasSavedGrades = false;

    if (gradingType === 'exam') {
      groupStudents.forEach(student => {
        const existing = examGrades.find(eg => eg.exam_id === selectedEvaluationId && eg.student_id === student.id);
        if (existing) {
          hasSavedGrades = true;
        }
        initialTemp[student.id] = {
          score: existing ? existing.score : 0,
          flag: existing ? existing.absent : false, // absent status
          notes: existing ? (existing.teacher_notes || '') : ''
        };
      });
    } else {
      groupStudents.forEach(student => {
        const existing = assignmentGrades.find(ag => ag.assignment_id === selectedEvaluationId && ag.student_id === student.id);
        if (existing) {
          hasSavedGrades = true;
        }
        initialTemp[student.id] = {
          score: existing ? existing.score : 0,
          flag: existing ? existing.completed : false, // completed status
          notes: existing ? (existing.teacher_notes || '') : ''
        };
      });
    }

    setTempGrades(initialTemp);
    setIsEditingSheet(!hasSavedGrades);
  }, [selectedEvaluationId, selectedClassId, gradingType, students, examGrades, assignmentGrades]);

  const activeEvaluationObj = useMemo(() => {
    if (gradingType === 'exam') {
      return exams.find(e => e.id === selectedEvaluationId);
    } else {
      return assignments.find(a => a.id === selectedEvaluationId);
    }
  }, [selectedEvaluationId, gradingType, exams, assignments]);

  const getScoreBadge = (score: number, maxScore: number, flag: boolean) => {
    if (gradingType === 'exam' && flag) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          غائب 🔴
        </span>
      );
    }
    if (gradingType === 'assignment' && !flag) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          لم يسلم ❌
        </span>
      );
    }

    const missed = maxScore - score;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    if (missed <= 3 && score > maxScore / 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {score} / {maxScore} (ممتاز ✨)
        </span>
      );
    } else if (percentage <= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {score} / {maxScore} (ضعيف ⚠️)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {score} / {maxScore} (متوسط 👍)
        </span>
      );
    }
  };

  // Create or Update Exam
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!examForm.name.trim()) {
      setErrorMsg('فضلاً، أدخل اسم الامتحان.');
      return;
    }

    if (examForm.max_score <= 0) {
      setErrorMsg('الدرجة العظمى للامتحان يجب أن تكون أكبر من صفر.');
      return;
    }

    const examData: Exam = {
      id: editingExamId || `ex-${Date.now()}`,
      name: examForm.name,
      type: examForm.type,
      max_score: Number(examForm.max_score),
      duration_mins: Number(examForm.duration_mins),
      date: examForm.date,
      class_id: examForm.class_id,
      term: examForm.term,
      mode: examForm.mode,
      exam_url: examForm.exam_url,
      auto_attendance: examForm.auto_attendance
    };

    samsDb.saveExam(examData);
    setSuccessMsg(editingExamId ? 'تم تحديث بيانات الامتحان بنجاح!' : 'تم إضافة الامتحان الجديد بنجاح!');
    setEditingExamId(null);
    setExamForm({
      name: '',
      type: 'quiz',
      max_score: 20,
      duration_mins: 30,
      date: new Date().toISOString().split('T')[0],
      class_id: classes[0]?.id || '',
      term: 'first_term',
      mode: 'center',
      exam_url: '',
      auto_attendance: false
    });
    loadAllData();
  };

  // Edit Exam trigger
  const handleEditExamClick = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamForm({
      name: exam.name,
      type: exam.type,
      max_score: exam.max_score,
      duration_mins: exam.duration_mins,
      date: exam.date,
      class_id: exam.class_id,
      term: exam.term,
      mode: exam.mode || 'center',
      exam_url: exam.exam_url || '',
      auto_attendance: exam.auto_attendance || false
    });
    // Scroll to top of tab
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Exam
  const confirmDeleteExam = () => {
    if (examToDelete) {
      samsDb.deleteExam(examToDelete.id);
      // Clean grades as well (optional but clean database)
      const list = samsDb.getExamGrades().filter(g => g.exam_id !== examToDelete.id);
      saveToStorage('sams_v2_exam_grades', list);
      
      setSuccessMsg('تم حذف الامتحان وسجل درجاته بنجاح!');
      setExamToDelete(null);
      loadAllData();
    }
  };

  // Create or Update Assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!assignmentForm.title.trim()) {
      setErrorMsg('فضلاً، أدخل عنوان أو صفحات الواجب المطلوبة.');
      return;
    }

    if (assignmentForm.max_score <= 0) {
      setErrorMsg('الدرجة القصوى للواجب يجب أن تكون أكبر من صفر.');
      return;
    }

    const assignmentData: Assignment = {
      id: editingAssignmentId || `as-${Date.now()}`,
      title: assignmentForm.title,
      max_score: Number(assignmentForm.max_score),
      due_date: assignmentForm.due_date,
      class_id: assignmentForm.class_id,
      term: assignmentForm.term
    };

    samsDb.saveAssignment(assignmentData);
    setSuccessMsg(editingAssignmentId ? 'تم تحديث بيانات الواجب بنجاح!' : 'تم إضافة الواجب الدراسي بنجاح!');
    setEditingAssignmentId(null);
    setAssignmentForm({
      title: '',
      max_score: 10,
      due_date: new Date().toISOString().split('T')[0],
      class_id: classes[0]?.id || '',
      term: 'first_term'
    });
    loadAllData();
  };

  // Edit Assignment Trigger
  const handleEditAssignmentClick = (asg: Assignment) => {
    setEditingAssignmentId(asg.id);
    setAssignmentForm({
      title: asg.title,
      max_score: asg.max_score,
      due_date: asg.due_date,
      class_id: asg.class_id,
      term: asg.term
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Assignment
  const confirmDeleteAssignment = () => {
    if (assignmentToDelete) {
      samsDb.deleteAssignment(assignmentToDelete.id);
      const list = samsDb.getAssignmentGrades().filter(g => g.assignment_id !== assignmentToDelete.id);
      saveToStorage('sams_v2_assignment_grades', list);

      setSuccessMsg('تم حذف الواجب وسجلات الطلاب بنجاح!');
      setAssignmentToDelete(null);
      loadAllData();
    }
  };

  // Save current sheet grades in bulk
  const handleSaveBulkGrades = () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedEvaluationId || !activeEvaluationObj) {
      setErrorMsg('الرجاء اختيار امتحان أو واجب للرصد أولاً.');
      return;
    }

    const maxLimit = activeEvaluationObj.max_score;
    let hasValidationError = false;

    // First validate scores
    const groupStudents = students.filter(s => s.class_id === selectedClassId);
    for (const student of groupStudents) {
      const entry = tempGrades[student.id];
      if (entry) {
        if (!entry.flag && (entry.score < 0 || entry.score > maxLimit)) {
          setErrorMsg(`خطأ: الدرجة المدخلة للطالب (${student.name}) هي ${entry.score} وتتجاوز الحد الأقصى المسموح به لـ (${activeEvaluationObj.name || activeEvaluationObj.title}) وهو ${maxLimit} درجة.`);
          hasValidationError = true;
          break;
        }
      }
    }

    if (hasValidationError) return;

    // Save
    if (gradingType === 'exam') {
      groupStudents.forEach(student => {
        const entry = tempGrades[student.id] || { score: 0, flag: false, notes: '' };
        samsDb.saveExamGrade({
          id: '',
          exam_id: selectedEvaluationId,
          student_id: student.id,
          score: entry.flag ? 0 : Number(entry.score),
          absent: entry.flag,
          teacher_notes: entry.notes
        });
      });
      setSuccessMsg(`تم رصد وحفظ درجات الامتحان (${activeEvaluationObj.name}) لجميع طلاب المجموعة بنجاح!`);
    } else {
      groupStudents.forEach(student => {
        const entry = tempGrades[student.id] || { score: 0, flag: false, notes: '' };
        samsDb.saveAssignmentGrade({
          id: '',
          assignment_id: selectedEvaluationId,
          student_id: student.id,
          score: entry.flag ? Number(entry.score) : 0, // if completed/flag, take score, else 0
          completed: entry.flag, // completed status
          teacher_notes: entry.notes
        });
      });
      setSuccessMsg(`تم رصد وحفظ تقييم واجب اليوم (${activeEvaluationObj.title}) لجميع طلاب المجموعة بنجاح!`);
    }

    loadAllData();
    setIsEditingSheet(false);
  };

  // Bulk operation: Set all students to present/completed with full score
  const handleMarkAllPerfect = () => {
    if (!activeEvaluationObj) return;
    const maxVal = activeEvaluationObj.max_score;
    const updated = { ...tempGrades };
    
    Object.keys(updated).forEach(studentId => {
      updated[studentId] = {
        score: maxVal,
        flag: gradingType === 'assignment' ? true : false, // present for exam, completed for assignment
        notes: updated[studentId]?.notes || ''
      };
    });
    setTempGrades(updated);
    setSuccessMsg('تم ملء درجات جميع الطلاب افتراضياً بالدرجة الكاملة وحالة الحضور/التسليم النشطة!');
  };

  // Student list inside the active class
  const activeClassStudents = useMemo(() => {
    return students.filter(s => s.class_id === selectedClassId);
  }, [students, selectedClassId]);

  // Exam list search filter
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const cls = classes.find(c => c.id === e.class_id);
      const clsName = cls ? cls.name : '';
      const matchesSearch = e.name.toLowerCase().includes(examSearch.toLowerCase()) ||
        e.type.toLowerCase().includes(examSearch.toLowerCase()) ||
        clsName.toLowerCase().includes(examSearch.toLowerCase());
      
      const matchesGrade = examGradeFilter === 'all' || (cls && cls.grade_level === examGradeFilter);
      const matchesClass = examClassFilter === 'all' || e.class_id === examClassFilter;

      return matchesSearch && matchesGrade && matchesClass;
    });
  }, [exams, examSearch, classes, examGradeFilter, examClassFilter]);

  // Assignment list search filter
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const cls = classes.find(c => c.id === a.class_id);
      const clsName = cls ? cls.name : '';
      const matchesSearch = a.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
        clsName.toLowerCase().includes(assignmentSearch.toLowerCase());

      const matchesGrade = assignmentGradeFilter === 'all' || (cls && cls.grade_level === assignmentGradeFilter);
      const matchesClass = assignmentClassFilter === 'all' || a.class_id === assignmentClassFilter;

      return matchesSearch && matchesGrade && matchesClass;
    });
  }, [assignments, assignmentSearch, classes, assignmentGradeFilter, assignmentClassFilter]);

  return (
    <div className="space-y-6" id="sams_exams_assignments_module">
      
      {/* Upper Tab Navigation Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3 fill-current" />
            تطوير شؤون الطلاب والأكاديمية
          </span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-1.5">
            الامتحانات والواجبات المخصصة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة وإدارة اختبارات الحصة والامتحانات الشاملة، مع رصد ذكي للواجبات وحالة استلامها اليومية لكل مجموعة
          </p>
        </div>

        {/* Navigation sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveSubTab('grading');
              setSuccessMsg('');
              setErrorMsg('');
            }}
            className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'grading'
                ? 'bg-white text-[#0D5C8C] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Notebook className="w-4 h-4 text-emerald-500" />
            <span>رصد الدرجات والتسليم</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('exams');
              setSuccessMsg('');
              setErrorMsg('');
            }}
            className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'exams'
                ? 'bg-white text-[#0D5C8C] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-blue-500" />
            <span>إدارة الامتحانات</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('assignments');
              setSuccessMsg('');
              setErrorMsg('');
            }}
            className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'assignments'
                ? 'bg-white text-[#0D5C8C] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>إدارة الواجبات</span>
          </button>
        </div>
      </div>

      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#C0152A] rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#E8192C] shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 1: GRADING SHEET                                  */}
      {/* ========================================================= */}
      {activeSubTab === 'grading' && (
        <div className="space-y-6">
          
          {/* Quick Filters Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Term Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الفصل الدراسي</label>
              <select
                value={termFilter}
                onChange={(e) => {
                  setTermFilter(e.target.value as any);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                <option value="first_term">الفصل الدراسي الأول</option>
                <option value="second_term">الفصل الدراسي الثاني</option>
              </select>
            </div>

            {/* Grade Filter Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الصف الدراسي</label>
              <select
                value={gradingGradeFilter}
                onChange={(e) => {
                  const newGrade = e.target.value;
                  setGradingGradeFilter(newGrade);
                  const filteredClasses = classes.filter(c => newGrade === 'all' || c.grade_level === newGrade);
                  if (filteredClasses.length > 0) {
                    setSelectedClassId(filteredClasses[0].id);
                  } else {
                    setSelectedClassId('');
                  }
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
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

            {/* Class Group Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">المجموعة الدراسية</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700"
              >
                {classes.filter(c => gradingGradeFilter === 'all' || c.grade_level === gradingGradeFilter).length === 0 ? (
                  <option value="">لا توجد مجموعات</option>
                ) : (
                  classes.filter(c => gradingGradeFilter === 'all' || c.grade_level === gradingGradeFilter).map(c => (
                    <option key={c.id} value={c.id}>{c.name} (الصف: {c.grade_level})</option>
                  ))
                )}
              </select>
            </div>

            {/* Grading Type Switch */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">تصنيف الرصد الحالي</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setGradingType('exam');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 text-center text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                    gradingType === 'exam' ? 'bg-white text-[#0D5C8C] shadow-xs' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  الامتحانات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGradingType('assignment');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 text-center text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                    gradingType === 'assignment' ? 'bg-white text-[#0D5C8C] shadow-xs' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  الواجبات اليومية
                </button>
              </div>
            </div>

            {/* Evaluation Object Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {gradingType === 'exam' ? 'اختر الامتحان المراد رصده' : 'اختر واجب اليوم المراد رصده'}
              </label>
              <select
                value={selectedEvaluationId}
                onChange={(e) => {
                  setSelectedEvaluationId(e.target.value);
                  setSuccessMsg('');
                }}
                className="w-full text-xs font-black border border-slate-200 p-2.5 rounded-xl bg-amber-50/50 text-[#0D5C8C]"
              >
                {availableEvaluations.length === 0 ? (
                  <option value="">-- لا يوجد مدخلات متاحة لهذه المجموعة --</option>
                ) : (
                  availableEvaluations.map(item => (
                    <option key={item.id} value={item.id}>
                      {gradingType === 'exam' 
                        ? `${(item as Exam).name} (درجة عظمى: ${(item as Exam).max_score})`
                        : `${(item as Assignment).title} (درجة عظمى: ${(item as Assignment).max_score})`
                      }
                    </option>
                  ))
                )}
              </select>
            </div>

          </div>

          {/* Active Evaluation Banner */}
          {activeEvaluationObj ? (
            <div className="bg-[#0D5C8C]/5 border border-[#0D5C8C]/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0D5C8C] text-white rounded-xl">
                  {gradingType === 'exam' ? <Award className="w-5 h-5" /> : <Notebook className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {gradingType === 'exam' ? (activeEvaluationObj as Exam).name : (activeEvaluationObj as Assignment).title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5 font-sans">
                    {gradingType === 'exam' && (
                      <>
                        <span className="bg-blue-100 text-[#0D5C8C] px-2 py-0.5 rounded text-[10px] font-bold">
                          { {quiz: 'امتحان حصة', comprehensive: 'امتحان شامل', monthly: 'اختبار شهري', midterm: 'منتصف الفصل', final: 'اختبار نهائي' }[(activeEvaluationObj as Exam).type] || 'اختبار مخصص'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {(activeEvaluationObj as Exam).duration_mins} دقيقة</span>
                        <span>•</span>
                      </>
                    )}
                    <span>درجة التقييم العظمى: <strong className="text-amber-600">{(activeEvaluationObj as Exam | Assignment).max_score} درجات</strong></span>
                    <span>•</span>
                    <span>تاريخ الحدث: {gradingType === 'exam' ? (activeEvaluationObj as Exam).date : (activeEvaluationObj as Assignment).due_date}</span>
                  </div>
                </div>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                {isEditingSheet ? (
                  <button
                    onClick={handleMarkAllPerfect}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>تعبئة الدرجة كاملة للجميع</span>
                  </button>
                ) : (
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    الدرجات معتمدة ومحفوظة
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
              <Info className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">لم تقم بإضافة أي {gradingType === 'exam' ? 'امتحانات' : 'واجبات'} مخصصة لهذه المجموعة حتى الآن.</p>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                توجه للتبويبات بالأعلى لإضافة امتحان (امتحان حصة، شامل، إلخ) أو واجب دراسي مخصص لهذه المجموعة، ومن ثم ستظهر لك قائمة الطلاب وتستطيع رصد الدرجات مباشرة.
              </p>
              <button
                onClick={() => setActiveSubTab(gradingType === 'exam' ? 'exams' : 'assignments')}
                className="px-5 py-2.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                إضافة {gradingType === 'exam' ? 'امتحان جديد الآن' : 'واجب دراسي جديد الآن'}
              </button>
            </div>
          )}

          {/* Student Grading Grid Table */}
          {activeEvaluationObj && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <ListPlus className="w-4 h-4 text-[#0D5C8C]" />
                  قائمة كشف طلاب المجموعة للرصد والتقييم
                </h4>
                <span className="text-[10px] text-slate-400">
                  العدد الكلي للطلاب: <strong className="text-[#0D5C8C] font-mono">{activeClassStudents.length}</strong> طالب مقيد بالمجموعة
                </span>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full text-right" dir="rtl">
                  <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-3">رقم القيد</th>
                      <th className="p-3">اسم الطالب</th>
                      <th className="p-3 text-center w-[180px]">
                        {gradingType === 'exam' ? 'الحضور والغياب' : 'حالة تسليم الواجب'}
                      </th>
                      <th className="p-3 text-center w-[180px]">
                        الدرجة المستحقة (من {activeEvaluationObj.max_score})
                      </th>
                      <th className="p-3">ملاحظات خاصة برصد الطالب</th>
                      <th className="p-3 text-center w-[100px]">النسبة %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                    {activeClassStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          لا توجد سجلات طلاب مضافين لهذه المجموعة بعد.
                        </td>
                      </tr>
                    ) : (
                      activeClassStudents.map(student => {
                        const tempObj = tempGrades[student.id] || { score: 0, flag: false, notes: '' };
                        const scorePercent = activeEvaluationObj.max_score > 0 
                          ? Math.round((tempObj.score / activeEvaluationObj.max_score) * 100) 
                          : 0;

                        return (
                          <tr key={student.id} className={`hover:bg-slate-50/50 transition-all font-sans ${tempObj.flag && gradingType === 'exam' ? 'bg-red-50/30' : ''}`}>
                            <td className="p-3 font-mono font-semibold text-[#0D5C8C]">{student.registration_id}</td>
                            <td className="p-3 font-bold text-slate-800">{student.name}</td>
                            
                            {/* Flag toggler (Absent for Exams, Completed for Assignments) */}
                            <td className="p-3 text-center">
                              {isEditingSheet ? (
                                gradingType === 'exam' ? (
                                  <div className="flex items-center justify-center gap-1.5" dir="ltr">
                                    <span className={`text-[10px] font-extrabold tracking-tight transition-all duration-150 ${tempObj.flag ? 'text-rose-600' : 'text-slate-400'}`}>
                                      غائب
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTempGrades(prev => ({
                                          ...prev,
                                          [student.id]: {
                                            ...prev[student.id],
                                            flag: !tempObj.flag,
                                            score: !tempObj.flag ? 0 : tempObj.score // reset score if absent checked
                                          }
                                        }));
                                      }}
                                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        tempObj.flag ? 'bg-rose-500' : 'bg-emerald-500'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                          tempObj.flag ? 'translate-x-0' : 'translate-x-5'
                                        }`}
                                      />
                                    </button>
                                    <span className={`text-[10px] font-extrabold tracking-tight transition-all duration-150 ${!tempObj.flag ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      حاضر
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5" dir="ltr">
                                    <span className={`text-[10px] font-extrabold tracking-tight transition-all duration-150 ${!tempObj.flag ? 'text-amber-600' : 'text-slate-400'}`}>
                                      لم يسلم
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTempGrades(prev => ({
                                          ...prev,
                                          [student.id]: {
                                            ...prev[student.id],
                                            flag: !tempObj.flag,
                                            score: !tempObj.flag ? activeEvaluationObj.max_score : 0 // full score if completed, else 0
                                          }
                                        }));
                                      }}
                                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        tempObj.flag ? 'bg-emerald-500' : 'bg-amber-400'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                          tempObj.flag ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span className={`text-[10px] font-extrabold tracking-tight transition-all duration-150 ${tempObj.flag ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      سلم
                                    </span>
                                  </div>
                                )
                              ) : (
                                gradingType === 'exam' ? (
                                  tempObj.flag ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">🔴 غائب</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">🟢 حاضر</span>
                                  )
                                ) : (
                                  tempObj.flag ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">✔️ تم التسليم</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">❌ لم يسلم</span>
                                  )
                                )
                              )}
                            </td>

                            {/* Score Input or Read-Only Colored Badge */}
                            <td className="p-3 text-center">
                              {isEditingSheet ? (
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={activeEvaluationObj.max_score}
                                    disabled={gradingType === 'exam' && tempObj.flag} // disable score if absent
                                    value={tempObj.score === 0 ? '' : tempObj.score}
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const rawVal = e.target.value;
                                      const val = rawVal === '' ? 0 : Number(rawVal);
                                      setTempGrades(prev => ({
                                        ...prev,
                                        [student.id]: {
                                          ...prev[student.id],
                                          score: val
                                        }
                                      }));
                                    }}
                                    className="w-20 text-center border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 disabled:text-slate-400 rounded-xl p-2 font-mono font-bold text-sm focus:outline-hidden focus:border-[#0D5C8C] focus:bg-white"
                                  />
                                  <span className="text-slate-400 font-bold">/ {activeEvaluationObj.max_score}</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  {getScoreBadge(tempObj.score, activeEvaluationObj.max_score, tempObj.flag)}
                                </div>
                              )}
                            </td>

                            {/* Teacher Notes */}
                            <td className="p-3">
                              {isEditingSheet ? (
                                <input
                                  type="text"
                                  placeholder="مثلاً: متميز، يحتاج للمراجعة، غشاش، إلخ..."
                                  value={tempObj.notes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTempGrades(prev => ({
                                      ...prev,
                                      [student.id]: {
                                        ...prev[student.id],
                                        notes: val
                                      }
                                    }));
                                  }}
                                  className="w-full text-right border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl p-2 text-xs focus:outline-hidden focus:border-[#0D5C8C]"
                                  dir="rtl"
                                />
                              ) : (
                                tempObj.notes ? (
                                  <span className="font-bold text-slate-700 text-xs">{tempObj.notes}</span>
                                ) : (
                                  <span className="text-slate-300 italic text-xs">لا توجد ملاحظات</span>
                                )
                              )}
                            </td>

                            {/* Percentage Label */}
                            <td className="p-3 text-center font-mono font-bold text-slate-600">
                              {tempObj.flag && gradingType === 'exam' ? (
                                <span className="text-rose-600">0%</span>
                              ) : (
                                <span className={scorePercent >= 85 ? 'text-emerald-600' : scorePercent >= 50 ? 'text-blue-600' : 'text-amber-600'}>
                                  {scorePercent}%
                                </span>
                              )}
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Sheet Action Button */}
              {activeClassStudents.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-bold">
                    {isEditingSheet ? (
                      <span className="text-amber-600 flex items-center gap-1.5">
                        <Info className="w-4 h-4 animate-bounce" />
                        أنت في وضع رصد وتعديل الدرجات حالياً... يرجى الضغط على حفظ واعتماد الكشف لتثبيتها.
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        الدرجات مرصودة ومعتمدة بالكامل في النظام.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {isEditingSheet ? (
                      <>
                        {/* Cancel button if there are existing grades in DB */}
                        {(gradingType === 'exam' 
                          ? examGrades.some(eg => eg.exam_id === selectedEvaluationId)
                          : assignmentGrades.some(ag => ag.assignment_id === selectedEvaluationId)
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              loadAllData();
                              setIsEditingSheet(false);
                            }}
                            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            إلغاء التعديل
                          </button>
                        )}
                        <button
                          onClick={handleSaveBulkGrades}
                          className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ واعتماد كشف درجات المجموعة بالكامل</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingSheet(true)}
                        className="px-8 py-3.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>تعديل ورصد الدرجات</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: EXAMS MANAGEMENT                               */}
      {/* ========================================================= */}
      {activeSubTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create/Edit Exam Form (5 columns) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-blue-500" />
              <h3 className="font-extrabold text-slate-800 text-xs">
                {editingExamId ? 'تعديل الامتحان المحدد' : 'إنشاء وتجهيز امتحان جديد'}
              </h3>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              
              {/* Exam Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">اسم أو كود الامتحان</label>
                <input
                  type="text"
                  placeholder="مثال: امتحان الحصة الأولى، امتحان البلاغة الشامل"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full text-right border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-[#0D5C8C]"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Exam Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">تصنيف الامتحان</label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({ ...examForm, type: e.target.value as any })}
                    className="w-full text-right text-xs border border-slate-200 p-2.5 rounded-xl bg-white"
                  >
                    <option value="quiz">امتحان حصة (سريع)</option>
                    <option value="comprehensive">امتحان شامل</option>
                    <option value="monthly">اختبار شهري</option>
                    <option value="midterm">امتحان منتصف الفصل</option>
                    <option value="final">امتحان نهائي للمستوى</option>
                  </select>
                </div>

                {/* Term */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الفصل الدراسي</label>
                  <select
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value as any })}
                    className="w-full text-right text-xs border border-slate-200 p-2.5 rounded-xl bg-white"
                  >
                    <option value="first_term">الفصل الأول</option>
                    <option value="second_term">الفصل الثاني</option>
                  </select>
                </div>
              </div>

              {/* Class Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">موجه لطلاب المجموعة الدراسية</label>
                <select
                  value={examForm.class_id}
                  onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                  className="w-full text-right text-xs border border-slate-200 p-2.5 rounded-xl bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (الصف: {c.grade_level})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Max Score */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">درجة الامتحان من كام</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examForm.max_score}
                    onChange={(e) => setExamForm({ ...examForm, max_score: Number(e.target.value) })}
                    className="w-full text-center border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-xs"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">مدة الامتحان (بالدقائق)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={examForm.duration_mins}
                    onChange={(e) => setExamForm({ ...examForm, duration_mins: Number(e.target.value) })}
                    className="w-full text-center border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Exam Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">تاريخ إجراء الامتحان</label>
                <input
                  type="date"
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  className="w-full text-center border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>

              {/* Mode & URL */}
              <div className="space-y-3 pt-2 border-t border-slate-50">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">طريقة أداء الامتحان</label>
                  <select
                    value={examForm.mode}
                    onChange={(e) => setExamForm({ ...examForm, mode: e.target.value as any })}
                    className="w-full text-right text-xs border border-slate-200 p-2.5 rounded-xl bg-white"
                  >
                    <option value="center">في السنتر (حضور فعلي)</option>
                    <option value="online">أونلاين (رابط إلكتروني)</option>
                  </select>
                </div>
                {examForm.mode === 'online' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">رابط الامتحان (Google Forms / وغيرها)</label>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/forms/d/e/..."
                      value={examForm.exam_url}
                      onChange={(e) => setExamForm({ ...examForm, exam_url: e.target.value })}
                      className="w-full text-left border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-[#0D5C8C]"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-slate-500 font-sans">
                      * يمكنك استيراد درجات هذا الامتحان لاحقاً من ملف إكسيل (CSV) بضغطة زر.
                    </p>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examForm.auto_attendance}
                        onChange={(e) => setExamForm({ ...examForm, auto_attendance: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-700">تسجيل حضور الطالب تلقائياً عند إنهاء الامتحان الأونلاين</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingExamId ? 'تحديث وحفظ التعديل' : 'تأكيد إضافة الامتحان'}</span>
                </button>
                {editingExamId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExamId(null);
                      setExamForm({
                        name: '',
                        type: 'quiz',
                        max_score: 20,
                        duration_mins: 30,
                        date: new Date().toISOString().split('T')[0],
                        class_id: classes[0]?.id || '',
                        term: 'first_term'
                      });
                    }}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* Exams Listing (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col gap-3">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="ابحث باسم الامتحان، تصنيفه، أو اسم المجموعة..."
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    className="w-full text-right pr-9 pl-3 h-10 text-xs border border-slate-200 rounded-xl focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden"
                    dir="rtl"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1">
                  <select
                    value={examGradeFilter}
                    onChange={(e) => { setExamGradeFilter(e.target.value); setExamClassFilter('all'); }}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل الصفوف</option>
                    <option value="الأول الإعدادي">الأول الإعدادي</option>
                    <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                    <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>

                  <select
                    value={examClassFilter}
                    onChange={(e) => setExamClassFilter(e.target.value)}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل المجموعات</option>
                    {classes.filter(c => examGradeFilter === 'all' || c.grade_level === examGradeFilter).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">إجمالي: {filteredExams.length}</span>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {filteredExams.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-slate-400 text-xs">
                  لم يتم العثور على أي امتحانات مضافة تتطابق مع البحث.
                </div>
              ) : (
                filteredExams.map(exam => {
                  const cls = classes.find(c => c.id === exam.class_id);
                  const gradedCount = examGrades.filter(g => g.exam_id === exam.id).length;

                  return (
                    <div key={exam.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:border-slate-200 transition-all flex items-center justify-between gap-4">
                      <div className="space-y-1.5 text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{exam.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            exam.type === 'comprehensive' ? 'bg-rose-50 text-[#C0152A] border border-rose-100' : 'bg-blue-50 text-[#0D5C8C] border border-blue-100'
                          }`}>
                            { {quiz: 'امتحان حصة', comprehensive: 'امتحان شامل', monthly: 'اختبار شهري', midterm: 'منتصف الفصل', final: 'اختبار نهائي' }[exam.type] || 'امتحان مخصص'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-sans">
                          <span className="font-bold text-[#0D5C8C]">{cls ? cls.name : 'بدون مجموعة'}</span>
                          <span>•</span>
                          <span>الدرجة من: <strong className="text-amber-600">{exam.max_score}</strong></span>
                          <span>•</span>
                          <span>المدة: <strong>{exam.duration_mins} د</strong></span>
                          <span>•</span>
                          <span>التاريخ: {exam.date}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          تم رصد درجات ({gradedCount}) طلاب لهذه المادة.
                        </div>
                        {exam.mode === 'online' && (
                          <div className="mt-2 text-[10px]">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold ml-2 border border-amber-200">أونلاين</span>
                            <span className="text-slate-500 font-mono select-all break-all">{window.location.origin}/?exam_id={exam.id}</span>
                            <p className="text-slate-400 mt-1">انسخ هذا الرابط وأرسله للطلاب لأداء الامتحان وتسجيل درجاتهم تلقائياً.</p>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditExamClick(exam)}
                          className="p-2 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all cursor-pointer"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExamToDelete(exam)}
                          className="p-2 bg-slate-50 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: ASSIGNMENTS MANAGEMENT                         */}
      {/* ========================================================= */}
      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create/Edit Assignment Form (5 columns) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-800 text-xs">
                {editingAssignmentId ? 'تعديل الواجب الدراسي' : 'إضافة واجب يومي جديد'}
              </h3>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              
              {/* Assignment Title / Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">موضوع أو صفحات الواجب</label>
                <textarea
                  rows={2}
                  placeholder="مثال: حل صفحة 12 و 13 بكتاب المدرسة، أو واجب شرح اسم الفاعل صـ 40"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full text-right border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-[#0D5C8C] resize-none"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Max Score */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">درجة الواجب (مثلاً من 10)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={assignmentForm.max_score}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: Number(e.target.value) })}
                    className="w-full text-center border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-xs"
                  />
                </div>

                {/* Term */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الفصل الدراسي</label>
                  <select
                    value={assignmentForm.term}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, term: e.target.value as any })}
                    className="w-full text-right text-xs border border-slate-200 p-2.5 rounded-xl bg-white"
                  >
                    <option value="first_term">الفصل الدراسي الأول</option>
                    <option value="second_term">الفصل الدراسي الثاني</option>
                  </select>
                </div>
              </div>

              {/* Class Group */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">مخصص لطلاب المجموعة</label>
                <select
                  value={assignmentForm.class_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
                  className="w-full text-right text-xs border border-slate-200 p-2.5 rounded-xl bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (الصف: {c.grade_level})</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">تاريخ تسليم الواجب المطلوب</label>
                <input
                  type="date"
                  value={assignmentForm.due_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                  className="w-full text-center border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAssignmentId ? 'حفظ تعديلات الواجب' : 'إضافة ونشر الواجب'}</span>
                </button>
                {editingAssignmentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssignmentId(null);
                      setAssignmentForm({
                        title: '',
                        max_score: 10,
                        due_date: new Date().toISOString().split('T')[0],
                        class_id: classes[0]?.id || '',
                        term: 'first_term'
                      });
                    }}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* Assignments Listing (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col gap-3">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="ابحث بموضوع الواجب، اسم المجموعة..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="w-full text-right pr-9 pl-3 h-10 text-xs border border-slate-200 rounded-xl focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden"
                    dir="rtl"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1">
                  <select
                    value={assignmentGradeFilter}
                    onChange={(e) => { setAssignmentGradeFilter(e.target.value); setAssignmentClassFilter('all'); }}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل الصفوف</option>
                    <option value="الأول الإعدادي">الأول الإعدادي</option>
                    <option value="الثاني الإعدادي">الثاني الإعدادي</option>
                    <option value="الثالث الإعدادي">الثالث الإعدادي</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>

                  <select
                    value={assignmentClassFilter}
                    onChange={(e) => setAssignmentClassFilter(e.target.value)}
                    className="h-10 shrink-0 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 focus:border-[#1A7FAA] focus:ring-1 focus:ring-[#1A7FAA] outline-hidden cursor-pointer"
                  >
                    <option value="all">كل المجموعات</option>
                    {classes.filter(c => assignmentGradeFilter === 'all' || c.grade_level === assignmentGradeFilter).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">إجمالي: {filteredAssignments.length}</span>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {filteredAssignments.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-slate-400 text-xs">
                  لم يتم إضافة واجبات تتطابق مع البحث الحالي بعد.
                </div>
              ) : (
                filteredAssignments.map(asg => {
                  const cls = classes.find(c => c.id === asg.class_id);
                  const gradedCount = assignmentGrades.filter(g => g.assignment_id === asg.id && g.completed).length;

                  return (
                    <div key={asg.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:border-slate-200 transition-all flex items-center justify-between gap-4">
                      <div className="space-y-1.5 text-right flex-1">
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block leading-relaxed">{asg.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-sans">
                          <span className="font-bold text-[#0D5C8C]">{cls ? cls.name : 'بدون مجموعة'}</span>
                          <span>•</span>
                          <span>الدرجة القصوى: <strong className="text-amber-600">{asg.max_score}</strong></span>
                          <span>•</span>
                          <span>تاريخ التسليم: <strong>{asg.due_date}</strong></span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          تم تسليم الواجب من قبل ({gradedCount}) طلاب حتى الآن.
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditAssignmentClick(asg)}
                          className="p-2 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all cursor-pointer"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAssignmentToDelete(asg)}
                          className="p-2 bg-slate-50 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

      {/* Custom Exam Deletion Modal */}
      <AnimatePresence>
        {examToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">حذف الامتحان نهائياً</h3>
                  <p className="text-[11px] text-slate-500 font-sans font-medium">سيتم إزالة كافة السجلات والدرجات المرتبطة</p>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-1.5 py-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p>هل أنت متأكد من رغبتك في حذف الامتحان: <strong className="text-red-700">"{examToDelete.name}"</strong>؟</p>
                <p className="text-[10px] text-slate-400">تحذير: سيؤدي هذا الإجراء لحذف هذا الامتحان وجميع تقارير درجات الطلاب المسجلة له بشكل نهائي.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setExamToDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteExam}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Assignment Deletion Modal */}
      <AnimatePresence>
        {assignmentToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-sm">حذف الواجب الدراسي نهائياً</h3>
                  <p className="text-[11px] text-slate-500 font-sans font-medium">سيتم إزالة كافة السجلات والتسليمات المرتبطة</p>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-1.5 py-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p>هل أنت متأكد من رغبتك في حذف الواجب الدراسي: <strong className="text-red-700">"{assignmentToDelete.title}"</strong>؟</p>
                <p className="text-[10px] text-slate-400">تحذير: سيؤدي هذا الإجراء لحذف الواجب الدراسي وجميع سجلات استلام وتسليم الواجب الخاصة بالطلاب بشكل نهائي.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setAssignmentToDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAssignment}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { samsDb } from '../utils/db';
import { Student, ClassRoom } from '../types';
import { Search, Plus, Filter, Edit, Trash2, ShieldAlert, CheckCircle, Eye, X, Phone, User, Users, MessageSquare, Heart, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParentRecord {
  id: string;
  parent_name: string;
  parent_phone: string;
  children: Student[];
}

export default function ParentsList() {
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [multiChildrenFilter, setMultiChildrenFilter] = useState('all'); // all, multi, single

  // Form states
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing values
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = () => {
    const studentsList = samsDb.getStudents();
    const classList = samsDb.getClasses();
    setClasses(classList);

    // Group students by parent phone or name to identify unique parent records
    const parentMap: Record<string, ParentRecord> = {};
    
    studentsList.forEach(student => {
      const pName = (student.parent_name || 'ولي أمر غير مسجل').trim();
      const pPhone = (student.parent_phone || '').trim();
      
      // Generate a unique key for grouping: prioritize phone, fallback to name
      const key = pPhone ? pPhone : `name-${pName}`;
      
      if (!parentMap[key]) {
        parentMap[key] = {
          id: key,
          parent_name: pName,
          parent_phone: pPhone,
          children: []
        };
      }
      parentMap[key].children.push(student);
    });

    setParents(Object.values(parentMap));
  };

  const handleEditClick = (parent: ParentRecord) => {
    setSelectedParent(parent);
    setEditName(parent.parent_name);
    setEditPhone(parent.parent_phone);
    setShowEditForm(true);
    setErrorMessage('');
  };

  const handleUpdateParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!editName.trim()) {
      setErrorMessage('يرجى إدخال اسم ولي الأمر.');
      return;
    }

    if (!selectedParent) return;

    // We will update parent name and phone for all students previously linked to this parent
    const studentsList = samsDb.getStudents();
    let updatedCount = 0;

    studentsList.forEach(student => {
      const currentPName = (student.parent_name || 'ولي أمر غير مسجل').trim();
      const currentPPhone = (student.parent_phone || '').trim();
      const currentKey = currentPPhone ? currentPPhone : `name-${currentPName}`;

      if (currentKey === selectedParent.id) {
        const updatedStudent: Student = {
          ...student,
          parent_name: editName.trim(),
          parent_phone: editPhone.trim()
        };
        const res = samsDb.updateStudent(updatedStudent);
        if (res.success) {
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      setSuccessMessage(`تم تحديث بيانات ولي الأمر بنجاح وتعميم التعديل على عدد (${updatedCount}) طلاب مرتبطة به.`);
      setShowEditForm(false);
      setSelectedParent(null);
      loadData();
    } else {
      setErrorMessage('فشل تحديث البيانات، لم يتم العثور على طلاب مرتبطين.');
    }
  };

  // Filter Logic
  const filteredParents = parents.filter(p => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      p.parent_name.toLowerCase().includes(cleanSearch) || 
      p.parent_phone.includes(cleanSearch) ||
      p.children.some(child => 
        child.name.toLowerCase().includes(cleanSearch) || 
        child.registration_id.includes(cleanSearch)
      );

    const matchesGrade = gradeFilter === 'all' || p.children.some(child => child.grade_level === gradeFilter);
    
    let matchesMulti = true;
    if (multiChildrenFilter === 'multi') {
      matchesMulti = p.children.length > 1;
    } else if (multiChildrenFilter === 'single') {
      matchesMulti = p.children.length === 1;
    }

    return matchesSearch && matchesGrade && matchesMulti;
  });

  // Summary Metrics
  const totalParents = parents.length;
  const multiChildrenParentsCount = parents.filter(p => p.children.length > 1).length;
  const unlinkedParentsCount = parents.filter(p => !p.parent_name || p.parent_name === 'ولي أمر غير مسجل' || !p.parent_phone).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6" 
      id="sams_parents_module"
    >
      {/* Title & Action Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D5C8C]" />
            إدارة سجلات أولياء الأمور والتواصل المشترك
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة الآباء، أرقام الطوارئ، الرسائل التلقائية، والربط العائلي المتعدد للطلاب الأشقاء
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D5C8C] shrink-0 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">إجمالي أولياء الأمور</div>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{totalParents} ولي أمر</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">عائلات متعددة الأبناء</div>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{multiChildrenParentsCount} عائلات أشقاء</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">أولياء أمور غير مكتملي البيانات</div>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{unlinkedParentsCount} سجلات معلقة</div>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
          <button className="mr-auto text-emerald-600 font-bold hover:underline" onClick={() => setSuccessMessage('')}>إغلاق</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#C0152A] rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E8192C] shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
          <button className="mr-auto text-[#C0152A] font-bold hover:underline" onClick={() => setErrorMessage('')}>إغلاق</button>
        </div>
      )}

      {/* Edit Form Modal/Container */}
      {showEditForm && selectedParent && (
        <div className="bg-white border border-[#0D5C8C]/20 p-6 rounded-2xl shadow-sm" id="parent_edit_form_container">
          <h3 className="font-bold text-[#0D5C8C] text-sm mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Edit className="w-4 h-4" />
            تعديل بيانات ولي الأمر: {selectedParent.parent_name}
          </h3>
          <form onSubmit={handleUpdateParentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Parent Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">اسـم ولي الأمر بالكامل *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="اسم ولي الأمر رباعي"
                className="w-full text-xs font-sans border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-hidden focus:border-[#0D5C8C] text-right"
                dir="rtl"
                required
              />
            </div>

            {/* Parent Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">رقم هاتف التواصل (واتساب / إشعارات) *</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="مثلاً: 01xxxxxxxxx"
                className="w-full text-xs font-sans border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-hidden focus:border-[#0D5C8C] text-right"
                dir="rtl"
                required
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
              <span>سيتم تطبيق هذا التعديل تلقائياً على جميع الطلاب التابعين لهذا الرقم أو الاسم.</span>
              <span className="font-bold text-[#0D5C8C]">الطلاب المتأثرين بالتعديل: ({selectedParent.children.length})</span>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedParent(null);
                }}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-600 font-bold shrink-0 cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
              >
                حفظ التحديثات وتعميمها
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Main Grid: Filters & Parent Table / Cards */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        
        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="ابحث باسم ولي الأمر، هاتف، أو اسم الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full font-sans text-xs border border-slate-200 pr-9 pl-3 py-2.5 rounded-xl focus:outline-hidden focus:border-[#0D5C8C] text-right"
              dir="rtl"
            />
          </div>

          {/* Grade Filter of Children */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="font-sans text-xs border border-slate-200 p-2 rounded-xl focus:outline-hidden focus:border-[#0D5C8C] text-right bg-white"
          >
            <option value="all">كل المراحل الدراسية للأبناء</option>
            <option value="الأول الإعدادي">الأول الإعدادي</option>
            <option value="الثاني الإعدادي">الثاني الإعدادي</option>
            <option value="الثالث الإعدادي">الثالث الإعدادي</option>
            <option value="الأول الثانوي">الأول الثانوي</option>
            <option value="الثاني الثانوي">الثاني الثانوي</option>
            <option value="الثالث الثانوي">الثالث الثانوي</option>
          </select>

          {/* Multi Siblings Filter */}
          <select
            value={multiChildrenFilter}
            onChange={(e) => setMultiChildrenFilter(e.target.value)}
            className="font-sans text-xs border border-slate-200 p-2 rounded-xl focus:outline-hidden focus:border-[#0D5C8C] text-right bg-white"
          >
            <option value="all">كل أولياء الأمور</option>
            <option value="multi">من لديهم أكثر من ابن في السنتر (أشقاء)</option>
            <option value="single">من لديهم ابن واحد فقط</option>
          </select>

        </div>

        {/* Database Grid */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="min-w-full text-right" dir="rtl">
            <thead className="bg-[#0D5C8C]/5 text-slate-700 text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-4">اسم ولي الأمر</th>
                <th className="p-4">هاتف التواصل للطوارئ</th>
                <th className="p-4">الطلاب التابعين (الأبناء)</th>
                <th className="p-4">حالة الحضور الإجمالية للأبناء</th>
                <th className="p-4 text-left">التحكم والإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    لا يوجد نتائج مطابقة لاستعلام الفرز الحالي لأولياء الأمور.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredParents.map(parent => {
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                        key={parent.id} 
                        className="hover:bg-slate-50/50 transition-all"
                      >
                        {/* Parent Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#0D5C8C]/10 flex items-center justify-center text-[#0D5C8C] shrink-0 font-bold">
                              {parent.parent_name[0] || 'و'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-xs sm:text-xs">{parent.parent_name}</div>
                              {parent.children.length > 1 && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-sm">
                                  <Users className="w-2.5 h-2.5" />
                                  رابط أشقاء عائلي
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="p-4 font-mono text-slate-600">
                          {parent.parent_phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#0D5C8C]" />
                              {parent.parent_phone}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">⚠️ غير متوفر</span>
                          )}
                        </td>

                        {/* Children List */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {parent.children.map(child => (
                              <span 
                                key={child.id}
                                className="inline-block px-2.5 py-1 bg-sky-50 text-[#0D5C8C] border border-sky-100 rounded-lg font-bold text-[10px] shadow-3xs"
                              >
                                {child.name} <span className="text-slate-400 font-semibold font-sans">({child.grade_level})</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Aggregate Status Indicator */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            تواصل فعال وحضور منتظم
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-left flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(parent)}
                            title="تعديل بيانات ولي الأمر والتواصل"
                            className="p-1.5 text-slate-500 hover:text-[#0D5C8C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <a
                            href={parent.parent_phone ? `https://wa.me/${parent.parent_phone.startsWith('0') ? '2' + parent.parent_phone : parent.parent_phone}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مراسلة سريعة عبر الواتساب"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              parent.parent_phone 
                                ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' 
                                : 'text-slate-300 pointer-events-none'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </motion.div>
  );
}

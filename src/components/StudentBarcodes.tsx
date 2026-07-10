/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { samsDb, getTenantSetting } from '../utils/db';
import { Student, ClassRoom } from '../types';
import { Search, Filter, Printer, QrCode, CheckCircle, X, Users, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Barcode from './Barcode';

export default function StudentBarcodes() {
  const sysName = getTenantSetting('sams_custom_app_name_v2', 'Fox System');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Selection state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Render format
  const [renderType, setRenderType] = useState<'barcode' | 'qrcode' | 'both'>('both');

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    return () => window.removeEventListener('sams_data_changed', loadData);
  }, []);

  const loadData = () => {
    // Only get active/suspended students, skip archived
    const allStudents = samsDb.getStudents().filter(s => s.status !== 'archived');
    setStudents(allStudents);
    setClasses(samsDb.getClasses());
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registration_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = classFilter === 'all' || (student.class_ids || [student.class_id, student.class_id_2].filter(Boolean)).includes(classFilter);
    const matchesGrade = gradeFilter === 'all' || student.grade_level === gradeFilter;

    return matchesSearch && matchesClass && matchesGrade;
  });

  const handleSelectToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const formatDisplaySchedule = (cls?: ClassRoom) => {
    if (!cls) return 'غير محدد';
    if (!cls.schedule_days) return 'المواعيد غير محددة';
    try {
      const times = JSON.parse(cls.schedule_time || '{}');
      const formattedTimes = Object.entries(times).map(([day, time]) => {
        const t = time as string;
        if (!t) return day;
        const [h, m] = t.split(':');
        let hh = parseInt(h, 10);
        const ampm = hh >= 12 ? 'م' : 'ص';
        hh = hh % 12;
        hh = hh ? hh : 12;
        return `${day} (${hh}:${m} ${ampm})`;
      });
      return formattedTimes.join(' ، ');
    } catch (e) {
      return `${cls.schedule_days} - ${cls.schedule_time || ''}`;
    }
  };

  const handlePrintSingle = (student: Student) => {
    const classroom = classes.find(c => c.id === student.class_id);
    const scheduleFormatted = formatDisplaySchedule(classroom);
    
    const printWindow = window.open('', '_blank', 'width=450,height=300');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة باركود الطالب.');
      return;
    }
    
    // Capture the barcode SVG from our target div
    const barcodeHtml = document.getElementById(`print-barcode-view-${student.id}`)?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>طباعة ملصق باركود - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            *, *:before, *:after {
              box-sizing: border-box;
            }
            @page {
              size: 50mm 30mm landscape;
              margin: 0;
            }
            html, body {
              direction: rtl !important;
              font-family: 'Cairo', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #000000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .label-container {
              width: 50mm;
              height: 30mm;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
            }
            .label-border-wrapper {
              width: 47mm;
              height: 27mm;
              padding: 0.5mm 1.5mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              border: 1.5px solid #000000;
              border-radius: 4px;
              background-color: #ffffff;
              overflow: hidden;
            }
            .teacher-name {
              font-family: 'Cairo', sans-serif;
              font-size: 8px;
              font-weight: 800;
              color: #000000;
              border-bottom: 0.8px dashed #000000;
              width: 100%;
              padding-top: 0.4mm;
              padding-bottom: 0.6mm;
              line-height: 1.2;
              text-align: center;
              margin: 0;
              direction: rtl !important;
            }
            .student-info {
              font-family: 'Cairo', sans-serif;
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 0.2mm;
              text-align: center;
              margin-top: 0.4mm;
              direction: rtl !important;
            }
            .student-name {
              font-size: 8.5px;
              font-weight: 800;
              color: #000000;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }
            .meta-row {
              font-size: 6.5px;
              font-weight: bold;
              color: #333333;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }
            .meta-row span {
              color: #000000;
              font-weight: 900;
            }
            .barcode-wrapper {
              width: 100%;
              height: 10mm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              margin-top: 0.2mm;
              direction: ltr !important;
            }
            .barcode-wrapper > div {
              background-color: #ffffff !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
            }
            .barcode-wrapper > div > div {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 2mm !important;
              width: 100% !important;
              direction: ltr !important;
            }
            .barcode-wrapper svg {
              height: 7.5mm !important;
              max-width: 65% !important;
              display: block !important;
              margin: 0 !important;
            }
            .barcode-wrapper img {
              height: 8.5mm !important;
              width: 8.5mm !important;
              display: block !important;
              margin: 0 !important;
            }
            .barcode-wrapper span {
              font-family: monospace !important;
              font-size: 5.5px !important;
              color: #000000 !important;
              margin-top: 0.5px !important;
              letter-spacing: 0.5px !important;
              font-weight: bold !important;
              direction: ltr !important;
              display: block !important;
              text-align: center !important;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="label-border-wrapper">
              <div class="teacher-name">${sysName}</div>
              <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="meta-row">المجموعة: <span>${classroom?.name || 'غير محدد'}</span></div>
                <div class="meta-row">المواعيد: <span style="font-size: 8px;">${scheduleFormatted}</span></div>
              </div>
              <div class="barcode-wrapper" dir="ltr">
                ${barcodeHtml}
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 200);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintBulk = (selectedStudentsList: Student[]) => {
    if (selectedStudentsList.length === 0) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة الباركود.');
      return;
    }

    let labelsHtml = '';
    selectedStudentsList.forEach((student) => {
      const classroom = classes.find(c => c.id === student.class_id);
      const scheduleFormatted = formatDisplaySchedule(classroom);
      const barcodeHtml = document.getElementById(`print-barcode-view-${student.id}`)?.innerHTML || '';

      labelsHtml += `
        <div class="label-container">
          <div class="label-border-wrapper">
            <div class="teacher-name">${sysName}</div>
            <div class="student-info">
              <div class="student-name">${student.name}</div>
              <div class="meta-row">المجموعة: <span>${classroom?.name || 'غير محدد'}</span></div>
              <div class="meta-row">المواعيد: <span style="font-size: 8px;">${scheduleFormatted}</span></div>
            </div>
            <div class="barcode-wrapper" dir="ltr">
              ${barcodeHtml}
            </div>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>طباعة ملصقات الباركود - جماعي</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght=400;700;900&display=swap');
            *, *:before, *:after {
              box-sizing: border-box;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            html, body {
              direction: rtl !important;
              font-family: 'Cairo', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #000000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(3, 58mm);
              gap: 4mm 5mm;
              justify-content: center;
              padding: 2mm 0;
            }
            .label-container {
              width: 58mm;
              height: 32mm;
              display: flex;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
            }
            .label-border-wrapper {
              width: 56mm;
              height: 30mm;
              padding: 1.5mm 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              border: 1px solid #000000;
              border-radius: 4px;
              background-color: #ffffff;
              overflow: hidden;
            }
            .teacher-name {
              font-family: 'Cairo', sans-serif;
              font-size: 9px;
              font-weight: 800;
              color: #000000;
              border-bottom: 0.8px dashed #000000;
              width: 100%;
              padding-top: 0.2mm;
              padding-bottom: 0.6mm;
              line-height: 1.2;
              text-align: center;
              margin: 0;
              direction: rtl !important;
            }
            .student-info {
              font-family: 'Cairo', sans-serif;
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 0.4mm;
              text-align: center;
              margin-top: 0.6mm;
              direction: rtl !important;
            }
            .student-name {
              font-size: 9px;
              font-weight: 800;
              color: #000000;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }
            .meta-row {
              font-size: 7px;
              font-weight: bold;
              color: #333333;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }
            .meta-row span {
              color: #000000;
              font-weight: 900;
            }
            .barcode-wrapper {
              width: 100%;
              height: 11mm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              margin-top: 0.4mm;
              direction: ltr !important;
            }
            .barcode-wrapper > div {
              background-color: #ffffff !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
            }
            .barcode-wrapper > div > div {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 2mm !important;
              width: 100% !important;
              direction: ltr !important;
            }
            .barcode-wrapper svg {
              height: 8.5mm !important;
              max-width: 65% !important;
              display: block !important;
              margin: 0 !important;
            }
            .barcode-wrapper img {
              height: 9.5mm !important;
              width: 9.5mm !important;
              display: block !important;
              margin: 0 !important;
            }
            .barcode-wrapper span {
              font-family: monospace !important;
              font-size: 6px !important;
              color: #000000 !important;
              margin-top: 0.5px !important;
              letter-spacing: 0.5px !important;
              font-weight: bold !important;
              direction: ltr !important;
              display: block !important;
              text-align: center !important;
            }
          </style>
        </head>
        <body>
          <div class="labels-grid">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getGradeLevels = () => {
    return [
      'الأول الإعدادي',
      'الثاني الإعدادي',
      'الثالث الإعدادي',
      'الأول الثانوي',
      'الثاني الثانوي',
      'الثالث الثانوي'
    ];
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header Panel */}
      <div className="bg-[#0D5C8C] text-white p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl translate-x-24 translate-y-24" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-amber-300" />
              <h2 className="text-xl font-black">ملصقات وباركود الطلاب</h2>
            </div>
            <p className="text-xs text-sky-100/90 font-medium">
              عرض وطباعة بطاقات الهوية الشريطية (الباركود) للطلاب فرادى وجماعات للتسجيل والتحقق الفوري.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 shrink-0 self-start md:self-auto">
            <div className="text-center px-2">
              <div className="text-xs text-sky-200">إجمالي المقيدين</div>
              <div className="text-lg font-black font-sans text-amber-300">{students.length}</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-xs text-sky-200">المحدد للطباعة</div>
              <div className="text-lg font-black font-sans text-white">{selectedStudents.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ابحث باسم الطالب، رقم القيد، أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0D5C8C] focus:bg-white rounded-xl text-xs outline-none transition-all font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div className="relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <BookOpen className="w-4 h-4" />
            </span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0D5C8C] focus:bg-white rounded-xl text-xs outline-none transition-all cursor-pointer appearance-none"
            >
              <option value="all">كل المجموعات الدراسية</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} ({cls.grade_level})</option>
              ))}
            </select>
          </div>

          {/* Grade Level Filter */}
          <div className="relative">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Users className="w-4 h-4" />
            </span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0D5C8C] focus:bg-white rounded-xl text-xs outline-none transition-all cursor-pointer appearance-none"
            >
              <option value="all">كل الصفوف الدراسية</option>
              {getGradeLevels().map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Card Format Selector */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700 block">شكل بطاقة قيد الطالب:</span>
            <p className="text-[10px] text-slate-400">اختر التنسيق المفضل للطباعة والعرض لسهولة مسحه بالهاتف أو بالمسدس الليزر.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setRenderType('both')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                renderType === 'both' 
                  ? 'bg-[#0D5C8C] text-white shadow-3xs' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              الكل (باركود + QR)
            </button>
            <button
              type="button"
              onClick={() => setRenderType('qrcode')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                renderType === 'qrcode' 
                  ? 'bg-[#0D5C8C] text-white shadow-3xs' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              رمز QR فقط
            </button>
            <button
              type="button"
              onClick={() => setRenderType('barcode')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                renderType === 'barcode' 
                  ? 'bg-[#0D5C8C] text-white shadow-3xs' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              باركود خطي فقط
            </button>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all-barcodes"
              checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
              onChange={handleSelectAllToggle}
              className="rounded border-gray-300 text-[#0D5C8C] focus:ring-[#0D5C8C] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="select-all-barcodes" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              {selectedStudents.length === filteredStudents.length ? 'إلغاء تحديد الكل' : `تحديد كل المصفين للطباعة (${filteredStudents.length})`}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {selectedStudents.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const selectedList = students.filter(s => selectedStudents.includes(s.id));
                    handlePrintBulk(selectedList);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة المحددين ({selectedStudents.length})</span>
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </>
            )}

            <button
              onClick={() => handlePrintBulk(filteredStudents)}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كل المصفين ({filteredStudents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Barcode Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <QrCode className="w-12 h-12 opacity-35 text-slate-400" />
          <p className="font-bold">لا يوجد طلاب يطابقون خيارات التصفية أو البحث الحالية.</p>
          <p className="text-[10px] text-slate-400">تأكد من اختيار المجموعة الصحيحة أو كتابة استعلام بحث دقيق.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStudents.map(student => {
            const isSelected = selectedStudents.includes(student.id);
            const classroom = classes.find(c => c.id === student.class_id);
            
            return (
              <div
                key={student.id}
                onClick={() => handleSelectToggle(student.id)}
                className={`relative p-4 rounded-2xl border bg-white transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#0D5C8C] shadow-xs ring-1 ring-[#0D5C8C]' 
                    : 'border-slate-100 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Selection indicator and group badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    student.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {student.status === 'active' ? 'نشط' : 'موقف'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#0D5C8C] bg-sky-50 px-2 py-0.5 rounded-md">
                      {classroom?.name || 'بدون مجموعة'}
                    </span>
                    
                    {/* Checkbox */}
                    <div 
                      className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-[#0D5C8C] border-[#0D5C8C] text-white' 
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 fill-current text-white stroke-[#0D5C8C]" />}
                    </div>
                  </div>
                </div>

                {/* Name and ID */}
                <div className="space-y-1 text-center mb-4">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{student.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{student.grade_level}</p>
                </div>

                {/* Visual Barcode Rendering */}
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1.5">
                  <div id={`print-barcode-view-${student.id}`} className="w-full">
                    {/* Width adjusted for better rendering in grid */}
                    <Barcode value={student.barcode || student.registration_id} height={32} showText={true} renderType={renderType} />
                  </div>
                </div>

                {/* Individual Action Footer */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-50 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    ID: {student.registration_id}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintSingle(student);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0D5C8C]/10 hover:bg-[#0D5C8C] text-[#0D5C8C] hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>طباعة ملصق</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

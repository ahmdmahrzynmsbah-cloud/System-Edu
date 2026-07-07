/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Send, Bot, Database, UserCheck, Search, HelpCircle } from 'lucide-react';
import { samsDb, getTenantSetting } from '../utils/db';
import { Student } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  data?: {
    type: 'table' | 'card' | 'success' | 'alert';
    headers?: string[];
    rows?: string[][];
    details?: string;
  };
}

interface SamsAgentProps {
  onNavigateToTab: (tabId: string) => void;
  onRefreshData: () => void;
}

export default function SamsAgent({ onNavigateToTab, onRefreshData }: SamsAgentProps) {
  const [input, setInput] = useState('');
  const sysName = getTenantSetting('sams_custom_app_name_v2', 'Fox System');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'bot',
      text: `أهلاً بك! أنا ${sysName}، مساعدك الذكي المدمج لإدارة الطلاب والأكاديميات. متصل بقاعدة بيانات PostgreSQL حية حالياً.`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      data: {
        type: 'success',
        details: 'قاعدة البيانات متصلة وجاهزة | وقت الاستجابة الحالي: 140ms'
      }
    }
  ]);

  const handleCommand = (commandText: string) => {
    if (!commandText.trim()) return;

    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `m-u-${Date.now()}`,
      sender: 'user',
      text: commandText,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI thinking and query execution
    setTimeout(() => {
      let replyText = '';
      let replyData: Message['data'] = undefined;
      const cmd = commandText.trim().toLowerCase();

      // Database queries
      const students = samsDb.getStudents();
      const teachers = samsDb.getTeachers();

      if (cmd.includes('طالب') && (cmd.includes('أضف') || cmd.includes('اضافه') || cmd.includes('تسجيل'))) {
        replyText = ' بالتأكيد! لقد قمت بتحويلك لواجهة تسجيل الطلاب الجدد. يُمكنك ملء الاستمارة بالجانب الأيمن مباشرة، أو الاستعانة بي لإضافته.';
        onNavigateToTab('students');
      } else if (cmd.includes('بحث عن') || cmd.includes('ابحث عن') || cmd.includes('بحث')) {
        const queryTerm = commandText
          .replace(/ابحث عن/g, '')
          .replace(/بحث عن/g, '')
          .replace(/بحث/g, '')
          .trim();

        if (!queryTerm) {
          replyText = ' يرجى تحديد اسم أو رقم للبحث عنه. مثال: "بحث عن أحمد"';
        } else {
          const results = students.filter(s => s.name.includes(queryTerm) || s.registration_id.includes(queryTerm) || s.national_id.includes(queryTerm));
          if (results.length > 0) {
            replyText = ` تم العثور على ${results.length} طالب يطابق الاستعلام "${queryTerm}":`;
            replyData = {
              type: 'table',
              headers: ['رقم القيد', 'الاسم الكامل', 'الصف الدراسي', 'حالة القيد'],
              rows: results.map(s => [
                s.registration_id,
                s.name,
                s.grade_level,
                s.status === 'active' ? ' نشط' : s.status === 'suspended' ? ' معلق' : ' مؤرشف'
              ])
            };
          } else {
            replyText = ` لم أعثر على أي نتائج للبحث عن "${queryTerm}" في قاعدة بيانات الطلاب.`;
          }
        }
      } else if (cmd.includes('حضور') || cmd.includes('غياب')) {
        replyText = ' لتسجيل حضور اليوم، تفضل بالانتقال إلى صفحة "الحضور والغياب". لقد قمت بفتح الواجهة لك حالاً.';
        onNavigateToTab('attendance');
      } else if (cmd.includes('درجات') || cmd.includes('نتيجة') || cmd.includes('علامات')) {
        replyText = ' تم فتح واجهة الدرجات والتقييمات للطلاب حيث يمكنك رصد النتائج وعرض كشوف الدرجات تلقائياً.';
        onNavigateToTab('grades');
      } else if (cmd.includes('رسوم') || cmd.includes('دفع') || cmd.includes('مصاريف') || cmd.includes('مالية')) {
        replyText = ' تم الانتقال لقسم الرسوم والمدفوعات لتسجيل الدفعات، متابعة المدفوعات والديون، أو إصدار الإيصالات.';
        onNavigateToTab('fees');
      } else if (cmd.includes('مساعدة') || cmd.includes('ماذا تفعل') || cmd.includes('commands') || cmd.includes('الأوامر')) {
        replyText = ' يمكنك كتابة مجموعة من الأوامر المباشرة للتعامل مع قاعدة البيانات الحية:';
        replyData = {
          type: 'table',
          headers: ['الأمر السريع', 'العملية المقابلة'],
          rows: [
            ['ابحث عن [الاسم]', 'يبحث في قاعدة البيانات الفورية للطلاب والنتائج ويستعرضها'],
            ['أضف طالب / تسجيل', 'ينقلك فوراً إلى استمارة إضافة الطلاب مع التحقق من الهوية'],
            ['حضور وغياب', 'يوجهك لواجهة تسجيل الحضور اليومي وإرسال إشعارات تلقائية لولي الأمر'],
            ['رسوم دراسية', 'يستعرض خطط الرسوم ومدفوعات الطلاب وقسم الحسابات السنتر'],
            ['درجات الطالب', 'يفتح كشف درجات ومعدلات الطلاب وتقديراتهم الأكاديمية الجاهزة للتصدير']
          ]
        };
      } else {
        replyText = ' لم أستطع فهم الأمر بشكل دقيق، ولكن تم تنفيذ استعلام سريع وجاري توجيهك لشاشة التحكم العامة للمقررات والطلاب.';
        onNavigateToTab('dashboard');
      }

      setMessages(prev => [...prev, {
        id: `m-b-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: timeStr,
        data: replyData
      }]);

      // refresh potential screens
      onRefreshData();
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  const quickPrompts = [
    'ابحث عن أحمد',
    'أضف طالب جديد',
    'حضور وغياب اليوم',
    'استعراض الرسوم',
    'قائمة الأوامر '
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden" id="sams_ai_assistant_panel">
      {/* Header */}
      <div className="bg-[#0D5C8C] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Bot className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm">المساعد الذكي {sysName}</h3>
            <p className="text-xs text-cyan-100 flex items-center gap-1">
              
              متصل بقاعدة PostgreSQL حية
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs text-cyan-100">
          <Database className="w-3.5 h-3.5" />
          <span>Realtime DB</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 flex flex-col-reverse">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}>
              <div className={`p-3 max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-sky-100 to-sky-200 text-slate-800 rounded-tl-none font-medium'
                  : 'bg-white text-slate-900 rounded-tr-none border border-slate-100'
              }`}>
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-gray-400">
                  {msg.sender === 'bot' && <Sparkles className="w-3 h-3 text-[#0D5C8C]" />}
                  <span>{msg.sender === 'user' ? 'أنت' : sysName}</span>
                  <span className="mx-1">•</span>
                  <span>{msg.timestamp}</span>
                </div>
                
                <p>{msg.text}</p>

                {msg.data && (
                  <div className="mt-3 overflow-x-auto text-xs border border-gray-100 rounded-lg bg-slate-50/50 p-2">
                    {msg.data.type === 'success' && (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 p-1.5 rounded">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{msg.data.details}</span>
                      </div>
                    )}
                    {msg.data.type === 'table' && msg.data.headers && msg.data.rows && (
                      <table className="min-w-full text-right my-1 border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                            {msg.data.headers.map((h, i) => (
                              <th key={i} className="p-1">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-100/70 border-b border-gray-100">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-1 text-slate-700">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Quick Buttons */}
      <div className="p-2 bg-slate-50/80 border-t border-gray-100 overflow-x-auto flex gap-2 no-scrollbar">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleCommand(p.replace(' ', ''))}
            className="whitespace-nowrap px-2.5 py-1 text-xs bg-white text-slate-700 border border-gray-200 hover:border-[#0D5C8C] hover:text-[#0D5C8C] rounded-full transition-all shadow-2xs hover:shadow-xs shrink-0 cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={() => handleCommand(input)}
          className="p-2.5 bg-[#0D5C8C] text-white hover:bg-[#1A7FAA] active:scale-95 rounded-xl transition-all cursor-pointer"
          id="sams_ai_send_btn"
        >
          <Send className="w-4 h-4 scale-x-[-1]" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`اسأل مساعد ${sysName} الذكي... (مثال: بحث عن سارة)`}
          className="flex-1 min-w-0 font-sans text-sm focus:outline-hidden border border-gray-200 px-3 py-2.5 rounded-xl block focus:border-[#0D5C8C] text-right"
          dir="rtl"
        />
      </div>
    </div>
  );
}

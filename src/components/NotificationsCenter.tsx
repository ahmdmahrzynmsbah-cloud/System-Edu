import { saveToStorage } from "../utils/db";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SystemNotification, Student } from '../types';
import { samsDb, getTenantSetting, isWhatsappGatewayEnabledForTenant } from '../utils/db';
import { 
  Plus, 
  Check, 
  ShieldAlert, 
  AlertTriangle, 
  Send, 
  Mail, 
  MessageSquare, 
  Megaphone, 
  Calendar, 
  Search, 
  Users, 
  Phone, 
  Bell, 
  CheckCircle2, 
  CheckCheck,
  Smartphone,
  Wifi,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'parents' | 'broadcast' | 'logs'>('parents');
  
  // Search state for parents
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  
  // Quick direct message modal of SMS
  const [selectedParentStudent, setSelectedParentStudent] = useState<Student | null>(null);
  const [directSmsText, setDirectSmsText] = useState('');
  
  // Success / Error alerts
  const [successInfo, setSuccessInfo] = useState('');
  const [errorInfo, setErrorInfo] = useState('');

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (successInfo) {
      const timer = setTimeout(() => {
        setSuccessInfo('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successInfo]);

  useEffect(() => {
    if (errorInfo) {
      const timer = setTimeout(() => {
        setErrorInfo('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorInfo]);

  // WhatsApp manual API Settings states
  const [showWpSettings, setShowWpSettings] = useState(false);
  const isWpAllowed = isWhatsappGatewayEnabledForTenant();
  const whatsappEnabled = isWpAllowed && localStorage.getItem('sams_whatsapp_enabled') !== 'false';
  const [callmebotKeyValue, setCallmebotKeyValue] = useState(localStorage.getItem('sams_callmebot_api_key') || '');
  const [ultramsgIdValue, setUltramsgIdValue] = useState(localStorage.getItem('sams_ultramsg_instance_id') || '');
  const [ultramsgTokenValue, setUltramsgTokenValue] = useState(localStorage.getItem('sams_ultramsg_token') || '');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  const saveWpSettings = () => {
    saveToStorage('sams_callmebot_api_key', callmebotKeyValue.trim());
    saveToStorage('sams_ultramsg_instance_id', ultramsgIdValue.trim());
    saveToStorage('sams_ultramsg_token', ultramsgTokenValue.trim());
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  // Bulk Broadcast Form states
  const [broadcastFormData, setBroadcastFormData] = useState({
    title: '',
    message: '',
    category: 'sms' as SystemNotification['category'],
    recipient_type: 'parents' as SystemNotification['recipient_type'],
    recipient_id: ''
  });

  // Live Gateway Transmission Overlay Monitor state
  const [transmissionState, setTransmissionState] = useState<{
    isOpen: boolean;
    studentName: string;
    parentName: string;
    phone: string;
    message: string;
    progress: number;
    currentStep: string;
    status: 'connecting' | 'success' | 'failed';
    isSandbox: boolean;
    logs: string[];
  }>({
    isOpen: false,
    studentName: '',
    parentName: '',
    phone: '',
    message: '',
    progress: 0,
    currentStep: '',
    status: 'connecting',
    isSandbox: true,
    logs: []
  });

  useEffect(() => {
    loadData();
    window.addEventListener('sams_data_changed', loadData);
    return () => window.removeEventListener('sams_data_changed', loadData);
  }, []);

  const loadData = () => {
    setNotifications(samsDb.getNotifications());
    setStudents(samsDb.getStudents());
  };

  const triggerLiveSmsTransmission = async (studentName: string, parentName: string, phone: string, message: string) => {
    // Retrieve keys from LocalStorage dynamically
    const cKey = localStorage.getItem('sams_callmebot_api_key') || '';
    const uId = localStorage.getItem('sams_ultramsg_instance_id') || '';
    const uToken = localStorage.getItem('sams_ultramsg_token') || '';


    setTransmissionState({
      isOpen: true,
      studentName,
      parentName,
      phone,
      message,
      progress: 30,
      currentStep: 'جاري الإرسال...',
      status: 'connecting',
      isSandbox: true,
      logs: []
    });

    try {
      // 1. Send SMS background promise
      const smsPromise = fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message })
      });

      // 2. Send WhatsApp background promise with active custom credentials if enabled
      let waPromise = null;
      if (whatsappEnabled) {
        const sysName = getTenantSetting('sams_custom_app_name_v2', 'Fox System');
        waPromise = fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to: phone, 
            message: ` رسالة رسمية لولي الأمر من ${sysName} \n\n${message}`,
            callmebotApiKey: cKey,
            ultramsgInstanceId: uId,
            ultramsgToken: uToken
          })
        });
      }

      const [smsRes, waRes] = await Promise.all([smsPromise, waPromise]);
      let smsData: any = {};
      let waData: any = {};
      
      try { smsData = await smsRes.json(); } catch(e) {}
      try { if (waRes) waData = await waRes.json(); } catch(e) {}

      const isSmsOk = smsRes.ok && smsData.success;
      const isWaOk = whatsappEnabled ? (waRes && waRes.ok && waData.success) : true;

      if (isSmsOk || isWaOk) {
        setTransmissionState(prev => ({
          ...prev,
          progress: 100,
          currentStep: 'تم الإرسال بنجاح',
          status: 'success',
          isSandbox: !!((smsData && smsData.simulated) || (waData && waData.simulated)),
          logs: []
        }));
      } else {
        const errText = waData.error || smsData.error || 'تعذر تسليم البث المزدوج.';
        throw new Error(errText);
      }
    } catch (err: any) {
      setTransmissionState(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'فشل الإرسال',
        status: 'failed',
        logs: []
      }));
    }
  };

  // Direct custom SMS sender helper
  const handleSendDirectSms = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo('');
    setErrorInfo('');

    if (!selectedParentStudent) return;
    if (!directSmsText.trim()) {
      setErrorInfo('يرجى كتابة نص الرسالة التي تريد إرسالها إلى ولي الأمر أولاً.');
      return;
    }

    const parentName = selectedParentStudent.parent_name || 'ولي أمر الطالب';
    const parentPhone = selectedParentStudent.parent_phone || selectedParentStudent.phone || 'غير مسجل';

    // Save to global audit/notifications
    samsDb.addNotification({
      title: `رسالة SMS فورية مخصصة: ${selectedParentStudent.name}`,
      message: directSmsText,
      category: 'sms',
      recipient_type: 'specific',
      recipient_id: selectedParentStudent.id
    });

    setSuccessInfo(` تم توجيه الرسالة وإرسالها في ثوانٍ لهاتف ولي الأمر (${parentName}) على الرقم (${parentPhone})!`);
    
    // Start active live stepper animation inside Notifications Center
    triggerLiveSmsTransmission(selectedParentStudent.name, parentName, parentPhone, directSmsText);
    
    setSelectedParentStudent(null);
    setDirectSmsText('');
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessInfo(''), 6000);
  };

  // Predefined quick templates for direct SMS messaging
  const selectSmsTemplate = (templateType: 'absence' | 'excellent' | 'fees' | 'meeting') => {
    if (!selectedParentStudent) return;
    
    const childName = selectedParentStudent.name;
    const parentName = selectedParentStudent.parent_name || 'ولي الأمر العزيز';

    const tAbsence = localStorage.getItem('sams_msg_template_absence') || 'عزيزي ولي الأمر ({اسم_ولي_الأمر})، نحيطكم علماً بتغيب ابنكم ({اسم_الطالب}) عن السنتر اليوم. نرجو التواصل مع المعلم لتوضيح السبب.';
    const tExcellent = localStorage.getItem('sams_msg_template_excellent') || 'بشرى سارة لولي الأمر ({اسم_ولي_الأمر})، أبدى الطالب/الطالبة ({اسم_الطالب}) اليوم تفوقاً دراسياً متميزاً ومشاركة رائعة في الحصة! ونال تشجيعاً خاصاً من المعلم.';
    const tFees = localStorage.getItem('sams_msg_template_fees') || 'تحية طيبة لولي الأمر ({اسم_ولي_الأمر})، نود تذكيركم بلطف بوجوب سداد الرسوم الدراسية المتبقية لملف الطالب ({اسم_الطالب}) لانتظام القيد المالي. شكراً لتعاونكم.';
    const tMeeting = localStorage.getItem('sams_msg_template_meeting') || 'المحترم ({اسم_ولي_الأمر})، نتشرف بدعوتكم لحضور مجلس الآباء والمعلمين القادم بالسنتر لمتابعة المسار التعليمي لولدكم ({اسم_الطالب}).';

    const getParsedText = (template: string) => {
      const todayString = new Date().toISOString().split('T')[0];
      return template
        .replace(/{اسم_ولي_الأمر}/g, parentName)
        .replace(/{parent_name}/g, parentName)
        .replace(/{اسم_الطالب}/g, childName)
        .replace(/{student_name}/g, childName)
        .replace(/{التاريخ}/g, todayString)
        .replace(/{date}/g, todayString);
    };

    const text = {
      absence: getParsedText(tAbsence),
      excellent: getParsedText(tExcellent),
      fees: getParsedText(tFees),
      meeting: getParsedText(tMeeting)
    }[templateType];

    setDirectSmsText(text);
  };

  // General Broadcast Broadcast sender
  const handleSendGeneralBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo('');
    setErrorInfo('');

    if (!broadcastFormData.title || !broadcastFormData.message) {
      setErrorInfo('يرجى كتابة عنوان الرسالة ونص الإشعار بالكامل.');
      return;
    }

    samsDb.addNotification({
      title: broadcastFormData.title,
      message: broadcastFormData.message,
      category: broadcastFormData.category,
      recipient_type: broadcastFormData.recipient_type,
      recipient_id: broadcastFormData.recipient_id || undefined
    });

    setSuccessInfo('تم نشر وبث الإشعار المعتمد بنجاح وإرساله فورياً لجميع الفئات المستهدفة عبر القنوات المحددة!');
    setBroadcastFormData({
      title: '',
      message: '',
      category: 'sms',
      recipient_type: 'parents',
      recipient_id: ''
    });
    setActiveSubTab('logs');
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessInfo(''), 5000);
  };

  // Filter Parents
  const filteredParentsStudents = students.filter(std => {
    const term = parentSearchTerm.trim().toLowerCase();
    if (!term) return true;
    
    const parentName = (std.parent_name || '').toLowerCase();
    const studentName = std.name.toLowerCase();
    const regId = std.registration_id.toLowerCase();
    const phoneNum = (std.parent_phone || '').toLowerCase();

    return parentName.includes(term) || studentName.includes(term) || regId.includes(term) || phoneNum.includes(term);
  });

  return (
    <div className="space-y-6" id="sams_parent_notifications_module">
      
      {/* Upper Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            بوابة الرسائل وتواصل أولياء الأمور (SMS & Mail)
          </h2>
          <p className="text-xs text-slate-500 mt-1">تتبع وإدارة شؤون أولياء الأمور، وإرسال وإحصاء تنبيهات الغياب والرسائل الفورية اليومية</p>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping inline-block mx-1.5" />
          <span className="text-[10px] text-slate-600 font-bold ml-1.5">بث SMS فوري نشط ومتصل</span>
        </div>
      </div>

      {/* COLLAPSIBLE INTELLIGENT WHATSAPP SENDING PANEL */}
      {!isWpAllowed ? (
        <div className="bg-red-50 border border-red-150 rounded-2xl p-4 text-right flex items-center gap-2.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-700">⚠️ خدمة "بوابة الواتسآب السحابي الصامت بالخلفية" غير مفعلة لهذا الحساب من قِبل إدارة السيستم المركزي. يرجى مراجعة إدارة السنتر أو المدير العام لتفعيل الخدمة.</span>
        </div>
      ) : (
        whatsappEnabled && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowWpSettings(!showWpSettings)}
            className="w-full flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer text-right"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">إعدادات تفعيل الإرسال السحابي للواتسآب (بحفل الخيار ليرسل صامتاً بالخلفية)</span>
            </div>
            <span className="text-xs font-black text-[#0D5C8C]">
              {showWpSettings ? '▲ إخفاء لوحة الإعدادات' : '▼ تفعيل الإرسال التلقائي دون فتح المحادثة (اضغط للبدء)'}
            </span>
          </button>

          {showWpSettings && (
            <div className="p-5 border-t border-blue-50 space-y-4 text-right animate-fade-in" dir="rtl">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                افتراضياً، لحمايتك من العمليات الوهمية، يتم الحفظ بالسيستم فقط لعدم تواجد كود تفعيل مفتاح الربط. يمكنك جعل التطبيق يقوم بإرسال الرسائل حقيقةً وتلقائياً بالخلفية فوراً عبر إدخال كود مفتاحك الشخصي أدناه:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: CallMeBot */}
                <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-3">
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    الطريقة الأولى: CallMeBot للواتساب (مجانية 100% ورائعة للتجربة الفردية)
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    تتيح لك تجربة استلام الرسائل تلقائياً في ثوانٍ على هاتفك. للحصول عليه مجاناً:
                    <br />
                    1. قم بحفظ رقم البوت على هاتفك: <b className="font-mono text-slate-700 font-bold">+34 621 07 33 53</b>
                    <br />
                    2. افتح محادثة معه على الواتساب وأرسل له: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-600 font-bold">I allow callmebot to send me messages</code>
                    <br />
                    3. سيقوم بإرسال الـ API Key الخاص بك فوراً. الصقه بالأسفل:
                  </p>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">كود الـ API Key المستلم (مثل 2384920):</label>
                    <input
                      type="text"
                      value={callmebotKeyValue}
                      onChange={(e) => setCallmebotKeyValue(e.target.value)}
                      placeholder="اكتب كود الـ API هنا..."
                      className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg text-left font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Option 2: UltraMsg */}
                <div className="p-4 bg-sky-50/30 rounded-xl border border-sky-100 space-y-3">
                  <span className="inline-block px-2 py-0.5 bg-sky-100 text-[#0D5C8C] text-[10px] font-bold rounded-md">
                    الطريقة الثانية: UltraMsg (احترافية لإرسال رسائل لجميع أولياء الأمور تلقائياً)
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    بوابة احترافية تتيح لك إرسال الرسائل لجميع أرقام أولياء الأمور في الخلفية بنموذج رائع.
                    <br />
                    1. افتح حساب مجاني بموقع <a href="https://ultramsg.com" target="_blank" rel="noreferrer" className="text-sky-600 hover:underline font-bold">ultramsg.com</a>.
                    <br />
                    2. امسح كود الـ QR لربط خط الواتساب الخاص بك.
                    <br />
                    3. الصق كود الـ Instance ID والـ Token أدناه ليربط السيستم بقناتك فوراً:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Instance ID (رقم السيرفر):</label>
                      <input
                        type="text"
                        value={ultramsgIdValue}
                        onChange={(e) => setUltramsgIdValue(e.target.value)}
                        placeholder="instance12345"
                        className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg text-left font-mono outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">Token الخاص بقناتك:</label>
                      <input
                        type="text"
                        value={ultramsgTokenValue}
                        onChange={(e) => setUltramsgTokenValue(e.target.value)}
                        placeholder="token_value"
                        className="w-full p-2 text-xs bg-white border border-gray-200 rounded-lg text-left font-mono outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {settingsSavedMsg ? (
                  <span className="text-[11px] font-bold text-emerald-600 animate-pulse">
                     تم حفظ بيانات الربط بنجاح! سيتم فك قيود الإرسال التلقائي في الخلفية في الحضور والغياب.
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">سيتم حفظ البيانات داخل المتصفح لإرسال صامت وتلقائي بنسبة 100%.</span>
                )}
                <button
                  type="button"
                  onClick={saveWpSettings}
                  className="px-6 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-lg cursor-pointer transition-transform active:scale-95 shadow-sm"
                >
                  حفظ كود الباقة والربط 
                </button>
              </div>
            </div>
          )}
        </div>
        )
      )}


      {/* Success alert */}
      {successInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in shadow-3xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-extrabold">{successInfo}</span>
        </div>
      )}

      {/* Error alert */}
      {errorInfo && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-[#C0152A] rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E8192C] shrink-0" />
          <span className="font-semibold">{errorInfo}</span>
        </div>
      )}

      {/* Beautiful Sub-Tabs selector */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => { setActiveSubTab('parents'); setSuccessInfo(''); }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'parents'
              ? 'border-[#0D5C8C] text-[#0D5C8C]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>دليل أولياء الأمور والاتصال المباشر ({students.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('broadcast'); setSuccessInfo(''); }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'broadcast'
              ? 'border-[#0D5C8C] text-[#0D5C8C]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>بث إشعار أو تعميم جماعي للأهالي</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('logs'); setSuccessInfo(''); }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'logs'
              ? 'border-[#0D5C8C] text-[#0D5C8C]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>أرشيف وسجل الرسائل والـ SMS الصادرة ({notifications.length})</span>
        </button>
      </div>

      {/* PAGE SUBTAB 1: PARENTS & DIRECT SMS SENDER */}
      {activeSubTab === 'parents' && (
        <div className="space-y-6">
          
          {/* Quick Notice detailing the instant link */}
          <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 justify-between" id="instant_sms_explanation_banner">
            <div className="flex items-start gap-3">
              
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#0D5C8C] text-xs">نظام إرسال الرسائل التلقائي متصل بنشاط!</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  عندما ترصد غياب طالب من صفحة <b>"الانتظام اليومي"</b>، يرسل النظام تلقائياً رسالة SMS فورية لهاتف والده/والدتها لإخطارهم فوراً. 
                  أدناه، يتاح لك كمعلم البحث المباشر في سجلات الآباء لإرسال أي رسائل تذكير أو تهنئة مخصصة يدوياً.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xxs font-extrabold text-[#0D5C8C] bg-white border border-sky-200.50 px-3 py-1.5 rounded-lg shrink-0">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>إرسال الغياب بضغطة واحدة مفعل</span>
            </div>
          </div>

          {/* Parents grid & Search input */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                
                دليل أرقام الهواتف والتواصل مع أولياء الأمور
              </h3>
              
              {/* Search filter input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم الأب، اسم الطالب، رقم القيد..."
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                  className="w-full text-xs font-sans border border-slate-200 pr-9 pl-3 py-2 rounded-lg focus:outline-none focus:border-[#0D5C8C] text-right"
                />
              </div>
            </div>

            {/* Parents List Table */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="min-w-full text-right" dir="rtl">
                <thead className="bg-[#0D5C8C]/5 text-slate-700 text-xs font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">اسم ولي الأمر</th>
                    <th className="p-3">الطالب التابع</th>
                    <th className="p-3">رقم الهاتف المسجل</th>
                    <th className="p-3">حالة إرسال الـ SMS للغياب</th>
                    <th className="p-3 text-left">الإجراء المباشر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                  {filteredParentsStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        لا يوجد أولياء أمور مسجلين مطابقين لاسم البحث في سجلات شؤون الطلاب الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredParentsStudents.map(std => (
                      <tr key={std.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{std.parent_name || 'غير محدد في النظام'}</td>
                        <td className="p-3 font-sans">
                          <span className="font-semibold text-[#0D5C8C]">{std.name}</span>
                          <span className="text-[10px] text-slate-400 block">رقم قيد: #{std.registration_id}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {std.parent_phone || std.phone || 'دون رقم'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-black">
                            
                            تلقائي ومبث فوراً
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            onClick={() => {
                              setSelectedParentStudent(std);
                              setDirectSmsText('');
                              setSuccessInfo('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white font-extrabold rounded-lg shadow-3xs cursor-pointer text-xxs transition-transform transform active:scale-95"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>مراسلة فورية SMS </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* SMS DIRECT SEND MODAL WINDOW */}
          {selectedParentStudent && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-xl w-full space-y-4 animate-slide-up text-right" dir="rtl">
                
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="font-black text-[#0D5C8C] text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    توجيه رسالة SMS شخصية فورية ومباشرة
                  </h3>
                  <button 
                    onClick={() => setSelectedParentStudent(null)} 
                    className="text-slate-400 font-bold hover:text-slate-600 text-xs px-2 cursor-pointer"
                  >
                    إغلاق 
                  </button>
                </div>

                {/* Receiver Info Banner */}
                <div className="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ولي الأمر المستهدف</span>
                    <span className="font-bold text-slate-800">{selectedParentStudent.parent_name || 'ولي أمر الطالب'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ابنهم / ابنتهم</span>
                    <span className="font-semibold text-slate-700">{selectedParentStudent.name} (قيد #{selectedParentStudent.registration_id})</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-gray-100">
                    <span className="text-slate-400 text-[10px] inline-block mr-1">رقم الإرسال:</span>
                    <span className="font-mono text-slate-600 ml-1 font-bold">{selectedParentStudent.parent_phone || selectedParentStudent.phone}</span>
                  </div>
                </div>

                {/* Quick Templates Picker */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">اختر أحد القوالب الجاهزة لتعبئة النص فوراً:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => selectSmsTemplate('absence')}
                      className="p-2 border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-lg text-xxs font-semibold text-right hover:bg-slate-50 cursor-pointer"
                    >
                       إنذار غياب طارئ للطفل
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSmsTemplate('excellent')}
                      className="p-2 border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-lg text-xxs font-semibold text-right hover:bg-slate-50 cursor-pointer"
                    >
                      ⭐ تشجيع وتفوق دراسي متميز
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSmsTemplate('fees')}
                      className="p-2 border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-lg text-xxs font-semibold text-right hover:bg-slate-50 cursor-pointer"
                    >
                       مطابقة وتذكير الرسوم الدراسية
                    </button>
                    <button
                      type="button"
                      onClick={() => selectSmsTemplate('meeting')}
                      className="p-2 border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-lg text-xxs font-semibold text-right hover:bg-slate-50 cursor-pointer"
                    >
                       دعوة لحضور مجلس الآباء
                    </button>
                  </div>
                </div>

                {/* Message Write form */}
                <form onSubmit={handleSendDirectSms} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">نص الرسالة القصيرة المرسل (سيتم محاكاة توجيهها للشبكة):</label>
                    <textarea
                      value={directSmsText}
                      onChange={(e) => setDirectSmsText(e.target.value)}
                      rows={4}
                      placeholder="اكتب رسالتك لولي الأمر بالتفصيل هنا..."
                      className="w-full text-xs font-sans border border-slate-200 px-3 py-2 rounded-lg text-slate-700 focus:outline-[#0D5C8C] text-right min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedParentStudent(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      إلغاء الإرسال
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      بث وإرسال رسالة الـ SMS الآن 
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      )}

      {/* PAGE SUBTAB 2: BULK GENERAL BROADCAST */}
      {activeSubTab === 'broadcast' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">
          <h3 className="font-extrabold text-[#0D5C8C] text-sm mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4" />
            بث رسالة نصية أو بريدية أو تعميم إداري جماعي جديد للأولياء
          </h3>
          <form onSubmit={handleSendGeneralBroadcast} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">عنوان التنبيه الرئيسي للتعميم *</label>
                <input
                  type="text"
                  value={broadcastFormData.title}
                  onChange={(e) => setBroadcastFormData({ ...broadcastFormData, title: e.target.value })}
                  placeholder="مثال: موعد تسليم الأنشطة المجموعةية لشهر مارس"
                  className="w-full text-xs font-sans border border-slate-200 px-3 py-2.5 rounded-lg text-slate-700 text-right"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">قناة البث المستهدفة</label>
                <select
                  value={broadcastFormData.category}
                  onChange={(e) => setBroadcastFormData({ ...broadcastFormData, category: e.target.value as SystemNotification['category'] })}
                  className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
                >
                  <option value="sms">رسائل SMS جماعية لهواتف أولياء الأمور</option>
                  <option value="system">لوحة الإشعارات العامة داخل النظام</option>
                  <option value="email">بريد إلكتروني رسمي وموثق</option>
                  <option value="alert">تنبيه أحمر عاجل بالإدارة</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">المستلم المترقب</label>
                <select
                  value={broadcastFormData.recipient_type}
                  onChange={(e) => setBroadcastFormData({ ...broadcastFormData, recipient_type: e.target.value as SystemNotification['recipient_type'] })}
                  className="w-full text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
                >
                  <option value="parents">أولياء أمور الطلاب فقط</option>
                  <option value="all">الجميع (أولياء أمور، طلاب)</option>
                  <option value="specific">طالب محدد بعينه</option>
                </select>
              </div>

            </div>

            {broadcastFormData.recipient_type === 'specific' && (
              <div className="space-y-1 animate-fade-in text-right">
                <label className="block text-xs font-bold text-slate-700">حدد الطالب المستلم للرسالة الأبوية</label>
                <select
                  value={broadcastFormData.recipient_id}
                  onChange={(e) => setBroadcastFormData({ ...broadcastFormData, recipient_id: e.target.value })}
                  className="w-1/3 text-xs font-sans border border-slate-200 p-2.5 rounded-lg text-slate-700 bg-white"
                  required
                >
                  <option value="">-- حدد الطالب --</option>
                  {students.map(std => (
                    <option key={std.id} value={std.id}>{std.name} (قيد: {std.registration_id})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">نص الرسالة أو البيان الإخطاري بالكامل *</label>
              <textarea
                value={broadcastFormData.message}
                onChange={(e) => setBroadcastFormData({ ...broadcastFormData, message: e.target.value })}
                rows={4}
                placeholder="يرجى كتابة نص البيان الموجه بدقة ووضوح..."
                className="w-full text-xs font-sans border border-slate-200 px-3 py-2.5 rounded-lg text-slate-700 text-right min-h-[90px]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setBroadcastFormData({
                  title: '',
                  message: '',
                  category: 'sms',
                  recipient_type: 'parents',
                  recipient_id: ''
                })}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-600 font-bold shrink-0 cursor-pointer"
              >
                إعادة ضبط
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0D5C8C] hover:bg-[#1A7FAA] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
              >
                تحديث وبث التعميم فوراً 
              </button>
            </div>

          </form>
        </div>
      )}

      {/* PAGE SUBTAB 3: ARCHIVE LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-gray-50 pb-2 flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-[#0D5C8C]" />
            سجل حركة الاتصالات وبث الـ SMS الصادر بالألوان
          </h3>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">لا توجد رسائل صادرة في السجل حالياً.</p>
            ) : (
              notifications.map((n) => {
                const icon = {
                  system: <Megaphone className="w-4 h-4 text-[#0D5C8C]" />,
                  sms: <MessageSquare className="w-4 h-4 text-emerald-600" />,
                  email: <Mail className="w-4 h-4 text-indigo-600" />,
                  alert: <AlertTriangle className="w-4 h-4 text-[#C0152A]" />
                }[n.category];

                const categoryLabel = {
                  system: 'إعلان نظامي عام',
                  sms: 'رسالة قصيرة SMS لهاتف ولي الأمر ',
                  email: 'بريد رسمي معتمد',
                  alert: 'تنبيه إداري فوري عاجل'
                }[n.category];

                return (
                  <div key={n.id} className="p-4 border border-gray-100 rounded-xl hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-slate-50 rounded-lg shrink-0 mt-1">
                        {icon}
                      </div>
                      <div className="space-y-1 text-right">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2 flex-wrap">
                          {n.title}
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal shadow-3xs">{categoryLabel}</span>
                        </h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed max-w-3xl font-sans">{n.message}</p>
                        
                        {n.recipient_id && (
                          <p className="text-[10px] text-slate-400 font-bold">
                            الطالب المقصود: {students.find(st => st.id === n.recipient_id)?.name || 'ـ طالب مدقق ـ'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left shrink-0 font-sans">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5" />
                        {n.created_at}
                      </span>
                      <div className="flex items-center gap-1.5 justify-end">
                        
                        <span className="text-[9px] text-emerald-600 font-bold">تم البث والإرسال فوراً</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FLOATING SMS TRANSMISSION MONITOR OVERLAY */}
      {transmissionState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden flex flex-col animate-slide-up p-5 text-center space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-slate-400">إرسال تنبيه فوري</span>
              <button 
                type="button" 
                onClick={() => setTransmissionState(prev => ({ ...prev, isOpen: false }))} 
                disabled={transmissionState.status === 'connecting'} 
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>

            {transmissionState.status === 'connecting' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#0D5C8C]" />
                <p className="text-xs font-bold text-slate-700">جاري إرسال الرسالة الآن...</p>
                <p className="text-[11px] text-slate-500">جاري إرسال النص إلى ولي الأمر ({transmissionState.parentName})</p>
              </div>
            )}

            {transmissionState.status === 'success' && (() => {
              const cleanPhone = transmissionState.phone.trim().replace(/\D/g, '');
              const formattedPhoneForWa = cleanPhone.startsWith('01') && cleanPhone.length === 11 
                ? '20' + cleanPhone.substring(1) 
                : cleanPhone.startsWith('1') && cleanPhone.length === 10
                  ? '20' + cleanPhone
                  : cleanPhone;
              
              return (
                <div className="py-2 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                    <CheckCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">تم تسجيل الإشعار وتوجيهه! </p>
                  
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl text-right w-full border border-slate-100 space-y-1">
                    <div> <b>المستلم:</b> {transmissionState.parentName}</div>
                    <div> <b>الهاتف:</b> <span className="font-mono text-slate-800">{transmissionState.phone}</span></div>
                    <div className="pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                      <b>الرسالة:</b> "{transmissionState.message}"
                    </div>
                  </div>

                  {transmissionState.isSandbox ? (
                    <div className="text-[10px] text-amber-700 bg-amber-50 p-2.5 rounded-lg text-right w-full border border-amber-100/70 flex flex-col gap-1">
                      <span className="font-bold flex items-center gap-1 text-[11px]"> وضع المحاكاة نشط بالمتصفح:</span>
                      <span>لم يتم إرسال رسالة حقيقية في الخلفية لعدم ربط كود الباقة.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTransmissionState(prev => ({ ...prev, isOpen: false }));
                          setShowWpSettings(true);
                          // Scroll to the settings box
                          document.getElementById('sams_parent_notifications_module')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-[10px] font-bold text-indigo-700 hover:underline hover:text-indigo-800 text-right mt-1 w-fit bg-white px-2 py-1 rounded border border-indigo-100"
                      >
                         اضغط هنا لإدخال كود ومفتاح الواتساب مجاناً ليرسل تلقائياً
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg text-right w-full border border-emerald-100 font-bold flex items-center gap-1">
                      <span> تم إرسال الرسالة تلقائياً بالخلفية فوراً عبر البوابة بنجاح!</span>
                    </div>
                  )}

                  <div className="w-full pt-1 space-y-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${formattedPhoneForWa}&text=${encodeURIComponent(transmissionState.message)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-transform transform active:scale-95 cursor-pointer shadow-sm"
                    >
                       فتح وتوجيه يدوي بالواتساب (حل بديل سريع)
                    </a>
                    
                    <a
                      href={`sms:${transmissionState.phone}?body=${encodeURIComponent(transmissionState.message)}`}
                      className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-transform transform active:scale-95 cursor-pointer shadow-sm"
                    >
                       إرسال رسالة SMS عادية
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTransmissionState(prev => ({ ...prev, isOpen: false }))}
                    className="w-full pt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    موافق، إغلاق النافذة ↩
                  </button>
                </div>
              );
            })()}

            {transmissionState.status === 'failed' && (() => {
              const cleanPhone = transmissionState.phone.trim().replace(/\D/g, '');
              const formattedPhoneForWa = cleanPhone.startsWith('01') && cleanPhone.length === 11 
                ? '20' + cleanPhone.substring(1) 
                : cleanPhone.startsWith('1') && cleanPhone.length === 10
                  ? '20' + cleanPhone
                  : cleanPhone;

              return (
                <div className="py-2 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">حفظ الإشعار وخيارات الإرسال المباشر</p>
                  <p className="text-[11px] text-slate-500 px-1 leading-relaxed">
                    تم تسجيل الإرسال على السيستم بنجاح. لوصول الرسالة فوراً مجاناً بدون إعداد الخادم:
                  </p>

                  <div className="w-full space-y-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${formattedPhoneForWa}&text=${encodeURIComponent(transmissionState.message)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-transform transform active:scale-95 cursor-pointer shadow-sm"
                    >
                       إرسال بالواتساب
                    </a>
                    
                    <a
                      href={`sms:${transmissionState.phone}?body=${encodeURIComponent(transmissionState.message)}`}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-transform transform active:scale-95 cursor-pointer shadow-sm"
                    >
                       إرسال رسالة SMS
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTransmissionState(prev => ({ ...prev, isOpen: false }))}
                    className="w-full pt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    تجاوز ومتابعة ↩
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}

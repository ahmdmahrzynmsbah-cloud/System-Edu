import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Server, 
  Globe, 
  Mail, 
  Phone, 
  ExternalLink, 
  FileText, 
  CheckCircle, 
  Code, 
  Sparkles, 
  Facebook, 
  Send, 
  Github, 
  Laptop, 
  Award,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Smartphone,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const policySections = [
    {
      title: "جمع البيانات واستخدامها (Data Collection & Usage)",
      icon: <Eye className="w-5 h-5 text-indigo-500" />,
      content: "نقوم بجمع البيانات الضرورية فقط لإدارة العملية التعليمية والأكاديمية بكفاءة تامة. تشمل هذه البيانات: أسماء الطلاب وأرقام الهواتف الشخصية وهواتف أولياء الأمور، سجلات الغياب والانتظام اليومي، درجات الامتحانات والواجبات، المدفوعات والاشتراكات الشهرية، والعمليات الإدارية التي يتم تسجيلها تلقائياً لأغراض المراجعة والأمن."
    },
    {
      title: "حماية أمن وسرية البيانات (Data Security & Integrity)",
      icon: <Lock className="w-5 h-5 text-emerald-500" />,
      content: "تُخزّن كافة البيانات في قواعد بيانات مشفرة ومحمية بالكامل ضد الاختراق أو الوصول غير المصرح به. نلتزم باتخاذ أقصى التدابير التقنية والتنظيمية لضمان سلامة السجلات الأكاديمية والمالية، بما في ذلك عزل بيانات السكرتارية وتدقيق العمليات عبر سجل المعاملات الحية (Audit Logs)."
    },
    {
      title: "صلاحيات الوصول والخصوصية (Access Roles & Confidentiality)",
      icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
      content: "يتم تحديد صلاحيات الوصول بصرامة تامة بناءً على دور المستخدم (المدير الأكاديمي، سكرتيرة الإدارة، المعلم). لا يتم السماح لأي جهة خارجية أو غير مخولة بالاطلاع على بيانات الطلاب أو المجموعات أو المعاملات المالية، وتظل سرية بيانات أولياء الأمور والطلاب على رأس أولويات المنصة."
    },
    {
      title: "مشاركة البيانات والتحديثات (Data Sharing Policy)",
      icon: <Server className="w-5 h-5 text-amber-500" />,
      content: "نحن نطبق سياسة صارمة تمنع مشاركة أو بيع أو تأجير أي بيانات تخص الطلاب أو أولياء الأمور لأي طرف ثالث أو لشركات التسويق والإعلانات. تُستخدم البيانات حصرياً داخل المنصة التعليمية لتقديم تقارير الأداء ومتابعة الرسوم الحسابية وإرسال الإشعارات والرسائل التنبيهية."
    }
  ];

  const socialLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
      url: "https://www.facebook.com/share/1EDnGL7gnQ/",
      color: "bg-[#1877F2]/15 text-blue-400 hover:bg-[#1877F2] hover:text-white border border-[#1877F2]/20"
    },
    {
      name: "الهاتف",
      icon: <Phone className="w-5 h-5" />,
      url: "tel:01034859313",
      color: "bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20"
    },
    {
      name: "Telegram",
      icon: <Send className="w-5 h-5" />,
      url: "https://t.me/FoxTech_1",
      color: "bg-[#229ED9]/15 text-sky-400 hover:bg-[#229ED9] hover:text-white border border-[#229ED9]/20"
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.948h.003c4.368 0 7.927-3.558 7.929-7.93a7.9 7.9 0 0 0-2.325-5.611zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-1.0-1.173-1.115-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
        </svg>
      ),
      url: "https://wa.me/201034859313",
      color: "bg-[#25D366]/15 text-emerald-400 hover:bg-[#25D366] hover:text-white border border-[#25D366]/20"
    },
    {
      name: "Fox Tech Website",
      icon: <Globe className="w-5 h-5" />,
      url: "https://foxtech.com",
      color: "bg-[#0D5C8C]/15 text-cyan-400 hover:bg-[#0D5C8C] hover:text-white border border-[#0D5C8C]/20"
    }
  ];

  return (
    <div className="space-y-8 animate-slide-up" dir="rtl">
      
      {/* Dynamic Header Section */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            سياسة الخصوصية وحماية البيانات
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-sans">
            الالتزام الكامل بسلامة السجلات الأكاديمية وحصانة البيانات الشخصية للمنصة التعليمية
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50/50 px-4 py-2 rounded-2xl border border-indigo-100 self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-black text-indigo-950 font-mono">آخر تحديث: يوليو 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch items-start">
        
        {/* Left/Right Column: Privacy Content Accordion (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex-grow flex flex-col justify-between h-full gap-6">
            <div className="space-y-4 flex-grow flex flex-col">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-800">بنود اتفاقية الخصوصية والأمان</h3>
              </div>

              <div className="space-y-3 flex-grow">
              {policySections.map((section, idx) => {
                const isOpen = activeSection === idx;
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                      isOpen ? 'border-indigo-200 bg-indigo-50/10 shadow-xs' : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <button
                      onClick={() => setActiveSection(isOpen ? null : idx)}
                      className="w-full text-right px-5 py-4 flex items-center justify-between cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-1.5 rounded-lg ${isOpen ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                          {section.icon}
                        </span>
                        <span className="text-xs font-black text-slate-700 font-sans">{section.title}</span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed font-sans border-t border-gray-50 mt-1 whitespace-pre-line">
                            {section.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/50 flex gap-3 mt-4">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">تأكيد الموافقة والأمان</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                باستخدامك لهذه المنصة بصفتك إدارياً، معلمًا، أو سكرتيرة، فإنك توافق بشكل تلقائي على الالتزام التام ببنود السرية وحفظ أمان المعلومات المذكورة أعلاه.
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Right/Left Column: Premium Credit & Signature Container (5 Columns) */}
        <div className="lg:col-span-5 h-full flex flex-col">
        
        {/* Luxury Fox Tech Box */}
        <div className="relative overflow-hidden bg-[#0A192F] text-white rounded-3xl border border-slate-800 p-6 shadow-2xl flex-grow flex flex-col justify-between h-full">
            {/* Glossy ambient reflex decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-sky-500/0 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
            
            {/* Futuristic Tech Lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-[#F5C453] to-cyan-400" />

            <div className="relative space-y-5">
              
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-indigo-500/20 animate-pulse">
                    <svg 
                      className="w-7 h-7 text-white" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      {/* Forehead Left */}
                      <path d="M 12 5 L 9 8 L 12 11 Z" fillOpacity="0.85" />
                      {/* Forehead Right */}
                      <path d="M 12 5 L 12 11 L 15 8 Z" fillOpacity="0.55" />
                      {/* Left Ear Inner */}
                      <path d="M 9 8 L 5 3 L 12 11 Z" fillOpacity="0.9" />
                      {/* Left Ear Outer */}
                      <path d="M 5 3 L 3 11 L 12 11 Z" fillOpacity="0.75" />
                      {/* Right Ear Inner */}
                      <path d="M 15 8 L 12 11 L 19 3 Z" fillOpacity="0.6" />
                      {/* Right Ear Outer */}
                      <path d="M 19 3 L 12 11 L 21 11 Z" fillOpacity="0.45" />
                      {/* Left Cheek Upper */}
                      <path d="M 3 11 L 9 14 L 12 11 Z" fillOpacity="0.8" />
                      {/* Right Cheek Upper */}
                      <path d="M 21 11 L 12 11 L 15 14 Z" fillOpacity="0.5" />
                      {/* Left Cheek Lower */}
                      <path d="M 3 11 L 12 21 L 9 14 Z" fillOpacity="0.7" />
                      {/* Right Cheek Lower */}
                      <path d="M 21 11 L 15 14 L 12 21 Z" fillOpacity="0.4" />
                      {/* Snout Left */}
                      <path d="M 9 14 L 12 21 L 12 11 Z" fillOpacity="1.0" />
                      {/* Snout Right */}
                      <path d="M 15 14 L 12 11 L 12 21 Z" fillOpacity="0.65" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#1877F2] fill-current shrink-0 filter drop-shadow-[0_1px_3px_rgba(24,119,242,0.4)]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      <h3 className="text-base font-black tracking-wider text-white font-sans uppercase">Fox Tech</h3>
                    </div>
                    <p className="text-[9px] text-[#FCF6BA] font-extrabold uppercase tracking-widest font-mono">Software Solutions & Design</p>
                  </div>
                </div>
              </div>

              {/* Company Info Intro */}
              <div className="space-y-2 text-right">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  تم تطوير، تصميم، وهندسة هذا النظام الإداري التعليمي المتكامل بأعلى معايير الدقة والسرعة بواسطة شركة <strong className="text-white font-black">Fox Tech</strong> الرائدة في مجالات التقنية الذكية وتطوير المنصات الرقمية الكبرى.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] text-slate-300 font-bold font-sans">برمجة فائقة السرعة</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] text-slate-300 font-bold font-sans">واجهات تفاعلية راقية</span>
                  </div>
                </div>
              </div>

              {/* Social links Grid */}
              <div className="pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-300 mb-3 text-right">مواقع التواصل والدعم الفني</h4>
                <div className="flex flex-wrap gap-2.5 justify-start">
                  {socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center cursor-pointer ${link.color}`}
                      title={link.name}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* CEO & CTO Digital Signature Box - EXQUISITE */}
              <div className="pt-5 border-t border-slate-800/80 mt-2 flex flex-col items-center">
                <div className="text-[10px] text-slate-400 font-bold tracking-wider font-mono uppercase mb-4">
                  OFFICIAL SIGN-OFF & DECREE
                </div>
                <div className="w-full bg-slate-900/80 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                  {/* Subtle grid pattern for extra fidelity */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

                  <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
                    
                    {/* CEO: Eng: Anas Abd El Aziz */}
                    <div className="flex flex-col p-4 bg-[#07111e]/80 rounded-2xl border border-slate-800/60 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
                      {/* Watermark security badge */}
                      <div className="absolute right-3 top-3 opacity-[0.03] text-white select-none pointer-events-none">
                        <Award className="w-20 h-20" />
                      </div>
                      
                      {/* Signature Canvas */}
                      <div className="h-28 flex flex-col items-center justify-center relative select-none">
                        {/* High-Fidelity Vector Signature tracing of Anas Abd El Aziz's uploaded handwriting */}
                        <svg 
                          className="w-52 h-24 text-sky-400 filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.4)] pointer-events-none transition-all duration-300 group-hover:scale-105" 
                          viewBox="0 0 200 110" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          {/* Giant elegant oval loop on the left */}
                          <path d="M 105,75 C 55,73 40,32 80,22 C 120,12 175,18 158,45 C 142,68 108,82 108,90" strokeWidth="2.0" />
                          
                          {/* Sharp downward point/loop at the bottom */}
                          <path d="M 108,90 L 105,98 L 110,82" strokeWidth="2.2" />
                          
                          {/* Beautiful seen (teeth) and alif flowing upwards */}
                          <path d="M 110,82 C 114,76 118,76 120,82 C 124,74 128,74 130,82 C 132,71 135,71 137,82 L 140,42" strokeWidth="2.2" />
                          
                          {/* Calligraphic dot at the top */}
                          <circle cx="140" cy="34" r="1.5" fill="currentColor" stroke="none" />
                          
                          {/* Sharp swift underline strike exactly matching the photo */}
                          <path d="M 40,85 L 160,67" strokeWidth="1.8" />
                        </svg>
                      </div>

                      {/* Official Signature Line */}
                      <div className="w-full border-t border-slate-800/80 my-3 relative">
                        <span className="absolute -top-2 left-2 px-1.5 text-[7px] font-black text-slate-500 bg-[#07111e] rounded tracking-wider uppercase font-mono">
                          SECURE SEC-CEO
                        </span>
                      </div>

                      {/* Printed Meta info */}
                      <div className="text-center mt-1.5 space-y-0.5 z-10">
                        <div className="text-xs font-black text-slate-200 font-sans tracking-wide">
                          Eng: Anas Abd El Aziz
                        </div>
                        <div className="text-[8.5px] text-slate-400 font-black uppercase tracking-widest font-mono">
                          Co-Founder & CEO
                        </div>
                      </div>
                    </div>

                    {/* CTO: Eng: Ahmed Maher */}
                    <div className="flex flex-col p-4 bg-[#07111e]/80 rounded-2xl border border-slate-800/60 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
                      {/* Watermark security badge */}
                      <div className="absolute left-3 top-3 opacity-[0.03] text-white select-none pointer-events-none">
                        <Code className="w-20 h-20" />
                      </div>
                      
                      {/* Signature Canvas */}
                      <div className="h-28 flex flex-col items-center justify-center relative select-none">
                        {/* High-Fidelity Vector Signature tracing of Ahmed Maher's uploaded handwriting */}
                        <svg 
                          className="w-52 h-24 text-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)] pointer-events-none transition-all duration-300 group-hover:scale-105" 
                          viewBox="0 0 200 110" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          {/* Capital 'A' loop and down-stroke */}
                          <path d="M 32,55 C 32,40 42,32 50,32 C 58,32 58,55 52,68" strokeWidth="2.4" />
                          
                          {/* Swooping horizontal crossing line of 'A' that starts the cursive 'hmed' */}
                          <path d="M 40,48 C 50,48 55,48 62,45" />
                          
                          {/* Cursive 'hmed' flowing beautifully */}
                          <path d="M 62,45 C 66,35 70,35 70,48 C 70,55 74,40 78,40 C 82,40 82,55 86,52 C 90,42 94,42 96,52 C 98,45 102,45 104,52 C 108,42 112,32 112,32 L 112,54" strokeWidth="2.0" />
                          
                          {/* Giant gorgeous under-swoop circling from 'd' (112, 54) back to the left under 'Ahmed' and then looping up-right to finish with 'E. I' */}
                          <path d="M 112,54 C 122,66 115,88 95,92 C 70,95 50,82 50,68 C 50,52 75,48 105,42 C 135,36 160,30 175,25" strokeWidth="2.2" />
                          
                          {/* Clean underline stroke from left to right */}
                          <path d="M 45,58 L 155,45" strokeWidth="1.8" />
                          
                          {/* Four dots under the line */}
                          <circle cx="132" cy="41" r="1.5" fill="currentColor" stroke="none" />
                          <circle cx="137" cy="41" r="1.5" fill="currentColor" stroke="none" />
                          <circle cx="142" cy="41" r="1.5" fill="currentColor" stroke="none" />
                          <circle cx="147" cy="41" r="1.5" fill="currentColor" stroke="none" />
                          
                          {/* Stylized final right accent/flourish ('I' / slash with top tick) */}
                          <path d="M 162,38 L 172,18 M 171,14 L 173,16" strokeWidth="2.5" />
                        </svg>
                      </div>

                      {/* Official Signature Line */}
                      <div className="w-full border-t border-slate-800/80 my-3 relative">
                        <span className="absolute -top-2 left-2 px-1.5 text-[7px] font-black text-slate-500 bg-[#07111e] rounded tracking-wider uppercase font-mono">
                          SECURE SEC-CTO
                        </span>
                      </div>

                      {/* Printed Meta info */}
                      <div className="text-center mt-1.5 space-y-0.5 z-10">
                        <div className="text-xs font-black text-slate-200 font-sans tracking-wide">
                          Eng: Ahmed Maher
                        </div>
                        <div className="text-[8.5px] text-slate-400 font-black uppercase tracking-widest font-mono">
                          Co-Founder & CTO
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

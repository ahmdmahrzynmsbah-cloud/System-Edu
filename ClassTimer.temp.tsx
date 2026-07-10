function ClassTimer({ classObj, selectedDate }: { classObj: ClassRoom | null, selectedDate: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!classObj) return null;

  const targetDate = new Date(selectedDate);
  const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNameAr = ARABIC_WEEKDAYS[targetDate.getDay()];
  
  let scheduleTime = null;
  if (classObj.schedule_time && classObj.schedule_time.startsWith('{')) {
    try {
      const times = JSON.parse(classObj.schedule_time);
      if (times[dayNameAr]) {
        scheduleTime = times[dayNameAr];
      }
    } catch (e) {}
  } else if (classObj.schedule_time) {
    scheduleTime = classObj.schedule_time;
  }

  // Ensure it is actually a time format
  const isValidTime = scheduleTime && /^\d{1,2}:\d{2}$/.test(scheduleTime);

  const isSelectedToday = selectedDate === (new Date(currentTime.getTime() - (currentTime.getTimezoneOffset() * 60000))).toISOString().split('T')[0];

  if (!scheduleTime || !isValidTime || !isSelectedToday) return null;

  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const startTime = new Date(currentTime);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime.getTime() + 120 * 60000); // Default to 2 hours duration

  const diffMs = endTime.getTime() - currentTime.getTime();
  const startDiffMs = startTime.getTime() - currentTime.getTime();

  if (startDiffMs > 2 * 60 * 60000) { // More than 2 hours before start -> don't show the timer yet
     return null; 
  }

  let targetTimeMs = 0;
  let label = '';
  let isApproaching = false;
  let hasStarted = false;

  if (startDiffMs > 0) {
    targetTimeMs = startDiffMs;
    label = 'تبدأ الحصة خلال';
    isApproaching = startDiffMs <= 15 * 60000; 
  } else if (diffMs > 0) {
    targetTimeMs = diffMs;
    label = 'الوقت المتبقي لانتهاء الحصة';
    isApproaching = diffMs <= 15 * 60000;
    hasStarted = true;
  } else {
    return (
       <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-fade-in mt-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-500">
                <Clock className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-700">انتهت الحصة</h3>
               <p className="text-xs text-slate-500">مجموعة ({classObj.name})</p>
             </div>
          </div>
       </div>
    );
  }

  const totalSeconds = Math.floor(targetTimeMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors animate-fade-in mt-4 ${
      isApproaching ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
    }`}>
       <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isApproaching ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
             <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold ${isApproaching ? 'text-rose-800' : 'text-emerald-800'}`}>
              {label}
            </h3>
            <p className={`text-xs ${isApproaching ? 'text-rose-600' : 'text-emerald-600'}`}>
              مجموعة ({classObj.name})
            </p>
          </div>
       </div>
       <div className={`text-2xl sm:text-3xl font-mono font-bold flex gap-1 items-center ${isApproaching ? 'text-rose-700' : 'text-emerald-700'}`} dir="ltr">
         {h > 0 && <span>{h.toString().padStart(2, '0')}:</span>}
         <span>{m.toString().padStart(2, '0')}</span>:
         <span>{s.toString().padStart(2, '0')}</span>
       </div>
    </div>
  );
}


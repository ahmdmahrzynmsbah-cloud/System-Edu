import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

old_classes_map = """                      {selectedDayEvents.classes.map((cls) => (
                        <div key={cls.id} className="p-3 bg-white border border-gray-100 rounded-xl hover:shadow-2xs transition-all text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{cls.name}</span>
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono text-[10px]">{cls.schedule_time || '12:00'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>السنة: {cls.grade_level}</span>
                            <span>السعة: {cls.capacity} طالب</span>
                          </div>
                        </div>
                      ))}"""

new_classes_map = """                      {selectedDayEvents.classes.map((cls) => {
                        const scheduleTime = cls.schedule_time || '12:00';
                        let isApproaching = false;
                        let timeMsg = '';

                        const isSelectedToday = formatDateString(selectedDate) === formatDateString(currentTime);

                        if (isSelectedToday) {
                          const [hours, minutes] = scheduleTime.split(':').map(Number);
                          const classTime = new Date(currentTime);
                          classTime.setHours(hours, minutes, 0, 0);
                          
                          const diffMs = classTime.getTime() - currentTime.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          
                          if (diffMins > 0 && diffMins <= 60) {
                            isApproaching = true;
                            timeMsg = `تبدأ بعد ${diffMins} دقيقة`;
                          } else if (diffMins <= 0 && diffMins >= -90) {
                            isApproaching = true;
                            timeMsg = 'جارية الآن';
                          }
                        }

                        return (
                          <div key={cls.id} className={`p-3 bg-white border ${isApproaching ? 'border-rose-300 shadow-sm bg-rose-50/30' : 'border-gray-100'} rounded-xl hover:shadow-2xs transition-all text-xs space-y-1 relative overflow-hidden`}>
                            {isApproaching && (
                              <div className="absolute top-0 right-0 left-0 h-0.5 bg-rose-500 animate-pulse" />
                            )}
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span>{cls.name}</span>
                                {isApproaching && (
                                  <span className="flex items-center gap-1 text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded text-[9px] animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    {timeMsg}
                                  </span>
                                )}
                              </div>
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${isApproaching ? 'text-rose-600 bg-rose-100' : 'text-emerald-600 bg-emerald-50'}`}>
                                {scheduleTime}
                              </span>
                            </div>
                            <div className={`flex items-center justify-between text-[10px] ${isApproaching ? 'text-rose-500/80 font-semibold' : 'text-slate-400'}`}>
                              <span>السنة: {cls.grade_level}</span>
                              <span>السعة: {cls.capacity} طالب</span>
                            </div>
                          </div>
                        );
                      })}"""

content = content.replace(old_classes_map, new_classes_map)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)


const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
function getScheduleTime(cls, selectedDate) {
    if (!cls) return null;
    let scheduleTime = null;
    const dayNameAr = ARABIC_WEEKDAYS[selectedDate.getDay()];
    if (cls.schedule_time && cls.schedule_time.startsWith('{')) {
        try {
            const times = JSON.parse(cls.schedule_time);
            if (times[dayNameAr]) {
                scheduleTime = times[dayNameAr];
            }
        } catch (e) {}
    } else if (cls.schedule_time) {
        scheduleTime = cls.schedule_time;
    }
    return scheduleTime;
}
console.log(getScheduleTime({ schedule_time: '{"الجمعة":"14:30"}' }, new Date('2026-07-10')));

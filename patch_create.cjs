const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

const updatedHandleCreateClass = `  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!classForm.name) {
      setErrorText('يرجى تحديد اسم للمجموعة الدراسية.');
      return;
    }
    if (!classForm.schedule_days || classForm.schedule_days.trim() === '') {
      setErrorText('يرجى تحديد أيام المجموعة الدراسية.');
      return;
    }
    
    const selectedDays = classForm.schedule_days.split('، ').filter(Boolean);
    const timesMissing = selectedDays.some(day => !dayTimes[day] || dayTimes[day].trim() === '');
    if (timesMissing) {
      setErrorText('يرجى تحديد الوقت لكل يوم من أيام المجموعة المختارة.');
      return;
    }

    if (!classForm.grade_level) {
      setErrorText('يرجى تحديد الصف الدراسي للمجموعة.');
      return;
    }

    const newCls: ClassRoom = {
      id: editingClassId || \`c-\${Date.now()}\`,
      name: classForm.name,
      schedule_days: classForm.schedule_days,
      schedule_time: JSON.stringify(dayTimes),
      capacity: 0,
      grade_level: classForm.grade_level
    };

    if (editingClassId) {
      samsDb.updateClass(newCls);
      setSuccessText('تم تحديث المجموعة بنجاح!');
    } else {
      samsDb.addClass(newCls);
      setSuccessText('تم إضافة المجموعة بنجاح!');
    }
    
    setClassForm({
      name: '',
      schedule_days: '',
      schedule_time: '',
      grade_level: 'الأول الإعدادي'
    });
    setDayTimes({});
    setEditingClassId(null);
    setShowAddClass(false);
    loadData();
  };`;

// replace between const handleCreateClass = and formatDisplaySchedule
let start = code.indexOf('const handleCreateClass = (e: React.FormEvent) => {');
let end = code.indexOf('const formatDisplaySchedule = (cls: ClassRoom) => {');
code = code.substring(0, start) + updatedHandleCreateClass + '\n\n  ' + code.substring(end);
fs.writeFileSync('src/components/ClassesManager.tsx', code);

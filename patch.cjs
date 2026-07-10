const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

const editHandler = `
  const handleEditClass = (cls: ClassRoom) => {
    setClassForm({
      name: cls.name,
      schedule_days: cls.schedule_days || '',
      schedule_time: cls.schedule_time || '',
      grade_level: cls.grade_level
    });
    try {
      if (cls.schedule_time && cls.schedule_time.startsWith('{')) {
        setDayTimes(JSON.parse(cls.schedule_time));
      } else {
        setDayTimes({});
      }
    } catch(e) {
      setDayTimes({});
    }
    setEditingClassId(cls.id);
    setShowAddClass(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

`;

code = code.replace('const handleCreateClass = (e: React.FormEvent) => {', editHandler + 'const handleCreateClass = (e: React.FormEvent) => {');
fs.writeFileSync('src/components/ClassesManager.tsx', code);

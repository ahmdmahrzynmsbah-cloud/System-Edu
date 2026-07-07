#!/bin/bash
sed -i 's/const \[selectedClass, setSelectedClass\] = useState('\''all'\'');/const [selectedClass, setSelectedClass] = useState('\''all'\'');\n  const [selectedGrade, setSelectedGrade] = useState('\''all'\'');/g' src/components/AttendanceTracker.tsx

sed -i 's/return students.filter(s => s.class_id === selectedClass);/return students.filter(s => {\n      const matchesClass = selectedClass === '\''all'\'' || s.class_id === selectedClass;\n      const matchesGrade = selectedGrade === '\''all'\'' || s.grade_level === selectedGrade;\n      return matchesClass \&\& matchesGrade;\n    });/g' src/components/AttendanceTracker.tsx

sed -i 's/<option value="all">جميع المجموعات<\/option>/<option value="all">جميع المجموعات<\/option>/g' src/components/AttendanceTracker.tsx

#!/bin/bash
cat << 'INNER_EOF' > script.py
import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

# Replace filteredExams
old_filtered_exams = """  // Exam list search filter
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const cls = classes.find(c => c.id === e.class_id);
      const clsName = cls ? cls.name : '';
      return (
        e.name.toLowerCase().includes(examSearch.toLowerCase()) ||
        e.type.toLowerCase().includes(examSearch.toLowerCase()) ||
        clsName.toLowerCase().includes(examSearch.toLowerCase())
      );
    });
  }, [exams, examSearch, classes]);"""

new_filtered_exams = """  // Exam list search filter
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const cls = classes.find(c => c.id === e.class_id);
      const clsName = cls ? cls.name : '';
      const matchesSearch = e.name.toLowerCase().includes(examSearch.toLowerCase()) ||
        e.type.toLowerCase().includes(examSearch.toLowerCase()) ||
        clsName.toLowerCase().includes(examSearch.toLowerCase());
      
      const matchesGrade = examGradeFilter === 'all' || (cls && cls.grade_level === examGradeFilter);
      const matchesClass = examClassFilter === 'all' || e.class_id === examClassFilter;

      return matchesSearch && matchesGrade && matchesClass;
    });
  }, [exams, examSearch, classes, examGradeFilter, examClassFilter]);"""

content = content.replace(old_filtered_exams, new_filtered_exams)

# Replace filteredAssignments
old_filtered_assignments = """  // Assignment list search filter
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const cls = classes.find(c => c.id === a.class_id);
      const clsName = cls ? cls.name : '';
      return (
        a.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
        clsName.toLowerCase().includes(assignmentSearch.toLowerCase())
      );
    });
  }, [assignments, assignmentSearch, classes]);"""

new_filtered_assignments = """  // Assignment list search filter
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const cls = classes.find(c => c.id === a.class_id);
      const clsName = cls ? cls.name : '';
      const matchesSearch = a.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
        clsName.toLowerCase().includes(assignmentSearch.toLowerCase());

      const matchesGrade = assignmentGradeFilter === 'all' || (cls && cls.grade_level === assignmentGradeFilter);
      const matchesClass = assignmentClassFilter === 'all' || a.class_id === assignmentClassFilter;

      return matchesSearch && matchesGrade && matchesClass;
    });
  }, [assignments, assignmentSearch, classes, assignmentGradeFilter, assignmentClassFilter]);"""

content = content.replace(old_filtered_assignments, new_filtered_assignments)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)

INNER_EOF
python3 script.py

import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

old_str = "  const [examSearch, setExamSearch] = useState('');"
new_str = """  const [examSearch, setExamSearch] = useState('');
  const [examGradeFilter, setExamGradeFilter] = useState('all');
  const [examClassFilter, setExamClassFilter] = useState('all');
  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState('all');
  const [assignmentClassFilter, setAssignmentClassFilter] = useState('all');"""

content = content.replace(old_str, new_str)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)


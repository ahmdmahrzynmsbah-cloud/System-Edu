import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

# 1. Update initial state
old_form = """  const [examForm, setExamForm] = useState({
    name: '',
    type: 'quiz' as Exam['type'],
    max_score: 20,
    duration_mins: 30,
    date: new Date().toISOString().split('T')[0],
    class_id: '',
    term: 'first_term' as Exam['term'],
    mode: 'center' as 'center' | 'online',
    exam_url: ''
  });"""
new_form = """  const [examForm, setExamForm] = useState({
    name: '',
    type: 'quiz' as Exam['type'],
    max_score: 20,
    duration_mins: 30,
    date: new Date().toISOString().split('T')[0],
    class_id: '',
    term: 'first_term' as Exam['term'],
    mode: 'center' as 'center' | 'online',
    exam_url: '',
    auto_attendance: false
  });"""
content = content.replace(old_form, new_form)

# 2. Update form reset
old_reset = """      term: 'first_term',
      mode: 'center',
      exam_url: ''
    });"""
new_reset = """      term: 'first_term',
      mode: 'center',
      exam_url: '',
      auto_attendance: false
    });"""
content = content.replace(old_reset, new_reset)

# 3. Update form edit
old_edit = """      mode: exam.mode || 'center',
      exam_url: exam.exam_url || ''
    });"""
new_edit = """      mode: exam.mode || 'center',
      exam_url: exam.exam_url || '',
      auto_attendance: exam.auto_attendance || false
    });"""
content = content.replace(old_edit, new_edit)

# 4. Update save object
old_save = """      class_id: examForm.class_id,
      term: examForm.term,
      mode: examForm.mode,
      exam_url: examForm.exam_url
    };"""
new_save = """      class_id: examForm.class_id,
      term: examForm.term,
      mode: examForm.mode,
      exam_url: examForm.exam_url,
      auto_attendance: examForm.auto_attendance
    };"""
content = content.replace(old_save, new_save)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)

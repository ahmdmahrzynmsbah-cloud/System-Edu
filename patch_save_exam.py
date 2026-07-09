import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

old_save = """    const examData: Exam = {
      id: editingExamId || `ex-${Date.now()}`,
      name: examForm.name,
      type: examForm.type,
      max_score: Number(examForm.max_score),
      duration_mins: Number(examForm.duration_mins),
      date: examForm.date,
      class_id: examForm.class_id,
      term: examForm.term
    };"""
new_save = """    const examData: Exam = {
      id: editingExamId || `ex-${Date.now()}`,
      name: examForm.name,
      type: examForm.type,
      max_score: Number(examForm.max_score),
      duration_mins: Number(examForm.duration_mins),
      date: examForm.date,
      class_id: examForm.class_id,
      term: examForm.term,
      mode: examForm.mode,
      exam_url: examForm.exam_url
    };"""

content = content.replace(old_save, new_save)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)

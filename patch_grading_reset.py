import re

with open('src/components/ExamsAndAssignments.tsx', 'r') as f:
    content = f.read()

old_onchange = """                onChange={(e) => {
                  setGradingGradeFilter(e.target.value);
                  setSuccessMsg('');
                }}"""

new_onchange = """                onChange={(e) => {
                  const newGrade = e.target.value;
                  setGradingGradeFilter(newGrade);
                  const filteredClasses = classes.filter(c => newGrade === 'all' || c.grade_level === newGrade);
                  if (filteredClasses.length > 0) {
                    setSelectedClassId(filteredClasses[0].id);
                  } else {
                    setSelectedClassId('');
                  }
                  setSuccessMsg('');
                }}"""

content = content.replace(old_onchange, new_onchange)

with open('src/components/ExamsAndAssignments.tsx', 'w') as f:
    f.write(content)


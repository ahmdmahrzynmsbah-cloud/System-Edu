#!/bin/bash
sed -i '/const \[examSearch, setExamSearch\] = useState..;/d' src/components/ExamsAndAssignments.tsx
sed -i 's/const \[examSearch, setExamSearch\] = useState(.);/const \[examSearch, setExamSearch\] = useState("");\n  const [examGradeFilter, setExamGradeFilter] = useState("all");\n  const [examClassFilter, setExamClassFilter] = useState("all");\n  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState("all");\n  const [assignmentClassFilter, setAssignmentClassFilter] = useState("all");/g' src/components/ExamsAndAssignments.tsx

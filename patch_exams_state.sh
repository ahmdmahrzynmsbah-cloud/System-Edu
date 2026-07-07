#!/bin/bash

# Add states
sed -i '/const \[examSearch, setExamSearch\] = useState..;/i \  const [examGradeFilter, setExamGradeFilter] = useState("all");\n  const [examClassFilter, setExamClassFilter] = useState("all");\n  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState("all");\n  const [assignmentClassFilter, setAssignmentClassFilter] = useState("all");\n' src/components/ExamsAndAssignments.tsx


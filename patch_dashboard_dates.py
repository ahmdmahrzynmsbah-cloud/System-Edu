import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const [currentMonth, setCurrentMonth] = useState<number>(6); // July (0-indexed)",
    "const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());"
)

content = content.replace(
    "const [currentYear, setCurrentYear] = useState<number>(2026);",
    "const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());"
)

content = content.replace(
    "const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 6));",
    "const [selectedDate, setSelectedDate] = useState<Date>(new Date());"
)

content = content.replace(
    "const isToday = cellDateStr === '2026-07-06'; // current mock local date",
    "const isToday = cellDateStr === formatDateString(currentTime);"
)

content = content.replace(
    """              onClick={() => {
                setCurrentMonth(6); // Reset to July 2026 for demonstration
                setCurrentYear(2026);
                setSelectedDate(new Date(2026, 6, 6));
              }}""",
    """              onClick={() => {
                const now = new Date();
                setCurrentMonth(now.getMonth());
                setCurrentYear(now.getFullYear());
                setSelectedDate(now);
              }}"""
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)


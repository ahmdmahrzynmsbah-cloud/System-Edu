#!/bin/bash

# Update Date Picker Container
sed -i 's/className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200"/className="flex items-center h-9 gap-2 bg-slate-50 px-3 rounded-lg border border-slate-200"/' src/components/AttendanceTracker.tsx

# Update both selects
sed -i 's/className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 focus:border-\[#1A7FAA\] focus:ring-1 focus:ring-\[#1A7FAA\] outline-hidden cursor-pointer"/className="h-9 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 focus:border-\[#1A7FAA\] focus:ring-1 focus:ring-\[#1A7FAA\] outline-hidden cursor-pointer"/g' src/components/AttendanceTracker.tsx


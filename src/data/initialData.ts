/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Teacher, ClassRoom, Subject, Grade, Attendance, ClassSchedule, FeePayment, SystemNotification, AuditLog, CenterScheduleData } from '../types';

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_CLASSES: ClassRoom[] = [];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_SUBJECTS: Subject[] = [];

export const INITIAL_GRADES: Grade[] = [];
export const INITIAL_ATTENDANCE: Attendance[] = [];
export const INITIAL_SCHEDULES: ClassSchedule[] = [];
export const INITIAL_FEES: FeePayment[] = [];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_CENTER_SCHEDULE: CenterScheduleData = {
  periods: [
    { id: 'p1', name: 'الفترة الأولى', time: '12:00', isBreak: false },
    { id: 'p2', name: 'الفترة الثانية', time: '02:00', isBreak: false },
    { id: 'p3', name: 'استراحة تبديل المجموعات', time: '04:00', isBreak: true },
    { id: 'p4', name: 'الفترة الثالثة', time: '04:30', isBreak: false },
    { id: 'p5', name: 'الفترة الرابعة', time: '06:30', isBreak: false },
    { id: 'p6', name: 'الفترة الخامسة', time: '08:30', isBreak: false },
  ],
  days: [
    { id: 'd1', name: 'الأحد' },
    { id: 'd2', name: 'الاثنين' },
    { id: 'd3', name: 'الثلاثاء' },
    { id: 'd4', name: 'الأربعاء' },
    { id: 'd5', name: 'الخميس' },
  ],
  entries: {}
};

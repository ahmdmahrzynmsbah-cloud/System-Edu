/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string; // unique identification string
  national_id?: string;
  name: string; // الاسم
  registration_id: string; // رقم القيد
  class_id: string; // المجموعة
  grade_level: string; // السنة الدراسية (مثلاً: الصف الأول، الثاني، الثالث)
  birth_date: string; // تاريخ الميلاد
  phone: string; // الهاتف
  parent_name: string; // ولي الأمر
  parent_phone: string; // هاتف ولي الأمر
  barcode?: string; // باركود الطالب
  status: 'active' | 'suspended' | 'archived'; // نشط / معلق / مؤرشف
  photo_url?: string;
  notes?: string;
  created_at: string;
  deleted_at?: string; // soft delete
}

export interface Teacher {
  id: string;
  name: string;
  national_id?: string;
  specialization: string; // التخصص الدراسي
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  joined_date: string;
  deleted_at?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // اسم المجموعة (مثلاً: 1/أ، 2/ب)
  schedule_days?: string; // مواعيد المجموعة (أيام)
  schedule_time?: string; // وقت المجموعة
  capacity: number; // السعة
  grade_level: string; // المستوى الدراسي
}

export interface Subject {
  id: string;
  name: string; // اسم المادة
  class_id: string;
  teacher_id: string;
  weekly_hours: number;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  term: 'first_term' | 'second_term'; // المجموعة الدراسي
  exam_grade: number; // درجة الامتحان (مثلاً من 100)
  class_work: number; // المتابعة والواجبات
  total: number; // المجموع تلقائياً
  grade_label: string; // التقدير (ممتاز، جيد جداً، جيد، مقبول، ضعيف)
  teacher_notes?: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  name: string; // اسم الامتحان (مثلاً: امتحان الحصة الأولى، الشامل الأول)
  type: 'quiz' | 'comprehensive' | 'monthly' | 'midterm' | 'final'; // نوع الامتحان
  max_score: number; // درجة الامتحان من كام
  duration_mins: number; // مدة الامتحان بالدقائق
  date: string; // تاريخ الامتحان YYYY-MM-DD
  class_id: string; // المجموعة
  term: 'first_term' | 'second_term';
  mode?: 'center' | 'online'; // مكان الامتحان
  exam_url?: string; // رابط الامتحان الأونلاين
  auto_attendance?: boolean; // ربط الامتحان بنظام الحضور
}

export interface Assignment {
  id: string;
  title: string; // عنوان أو وصف الواجب (مثلاً: واجب صفحة 15-20)
  max_score: number; // درجة الواجب من كام
  due_date: string; // تاريخ الاستلام YYYY-MM-DD
  class_id: string; // المجموعة
  term: 'first_term' | 'second_term';
}

export interface ExamGrade {
  id: string;
  exam_id: string;
  student_id: string;
  score: number; // الدرجة المستحقة
  absent: boolean; // غياب عن الامتحان
  teacher_notes?: string;
  updated_at: string;
}

export interface AssignmentGrade {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number; // الدرجة المستحقة أو 0 في حالة عدم التسليم
  completed: boolean; // تم تسليم الواجب؟
  teacher_notes?: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'excused'; // حضور / غياب / عذر
  notified_parent: boolean; // تم إخطار ولي الأمر
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  day_of_week: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
  period: number; // الحصة (1-6)
  subject_id: string;
  teacher_id: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'transfer'; // نقدي / بطاقة / تحويل
  term: 'first_term' | 'second_term' | 'full_year';
  receipt_number: string; // رقم الإيصال
  category: 'tuition' | 'bus' | 'uniform' | 'activities'; // نوع الرسوم
  month?: string; // الشهر المدفوع له الاشتراك (مثلاً: سبتمبر 2026)
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'sms' | 'email' | 'alert';
  recipient_type: 'all' | 'teachers' | 'students' | 'parents' | 'specific';
  recipient_id?: string;
  created_at: string;
  sent_status: 'sent' | 'pending' | 'failed';
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'QUERY';
  table_name: string;
  record_id: string;
  details: string;
  timestamp: string;
}

export interface UserRolePerm {
  role: 'admin' | 'principal' | 'teacher' | 'parent' | 'student';
  title_ar: string;
  can_view: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface SchedulePeriod {
  id: string;
  name: string;
  time: string;
  isBreak: boolean;
}

export interface ScheduleDay {
  id: string;
  name: string;
}

export interface CenterScheduleData {
  periods: SchedulePeriod[];
  days: ScheduleDay[];
  entries: Record<string, string>; // key is dayId_periodId, value is subject name
}

export interface Book {
  id: string;
  name: string; // اسم المذكرة (مثلاً: مذكرة الباب الأول)
  grade_level: string; // الصف الدراسي المستهدف
  subject: string; // المادة الدراسية (اختياري)
  price: number; // سعر المذكرة
  created_at: string;
}

export interface BookPayment {
  id: string;
  student_id: string;
  book_id: string;
  amount_paid: number; // المبلغ المدفوع
  total_price: number; // إجمالي السعر
  payment_date: string;
  status: 'fully_paid' | 'partially_paid' | 'not_paid'; // حالة الدفع
  receipt_number: string;
}

export interface AdminNotification {
  id: string;
  type: 'absence' | 'payment_reminder' | 'system';
  message: string;
  created_at: string;
  read: boolean;
  metadata?: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'teachers' | 'students' | 'parents';
  publish_date: string;
  expiry_date?: string;
  is_pinned: boolean;
  status: 'active' | 'archived';
  color_theme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
  views_count?: number;
  display_style?: 'card' | 'marquee_banner' | 'popup_modal';
  action_text?: string;
  action_link?: string;
  icon_type?: 'megaphone' | 'gift' | 'alert' | 'trophy' | 'star';
  image_url?: string;
}


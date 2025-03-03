import { Prerequisite } from './prerequisite.model';
import { Schedule } from './schedule.model';

export interface Course {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  professor?: any;
  professorId?: string | undefined;
  department?: string;
  schedule?: Schedule;
  enrolledStudents?: any[];
  isEnrolled?: boolean;
  enrollmentStatus?: string;
  enrollmentDate?: string;
  prerequisites?: Prerequisite[];
} 
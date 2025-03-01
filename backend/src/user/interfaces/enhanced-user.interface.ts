import { Student } from '../../students/schemas/student.schema';
import { Professor } from '../../professors/schemas/professor.schema';
import { User } from '../schemas/user.schema';

export interface EnhancedUser extends User {
  studentInfo?: Student | Record<string, any>;
  professorInfo?: Professor | Record<string, any>;
}

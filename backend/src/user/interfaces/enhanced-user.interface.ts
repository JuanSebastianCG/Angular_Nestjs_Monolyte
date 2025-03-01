import { Student } from '../../students/schemas/student.schema';
import { Professor } from '../../professors/schemas/professor.schema';
import { User } from '../schemas/user.schema';

export interface EnhancedUserData extends Omit<User, '_id'> {
  _id?: any;
  studentInfo?: Student;
  professorInfo?: Professor;
  [key: string]: any; // Allow for additional properties
}

import { User } from '../schemas/user.schema';
import { Document } from 'mongoose';

export type UserResponse = Omit<User, 'password'>;

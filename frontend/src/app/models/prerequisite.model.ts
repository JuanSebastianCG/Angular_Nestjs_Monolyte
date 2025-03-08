import { CourseJustId } from './course.model';
/* 
[
  {
    "_id": "67cc6e6cbad0d96a6d3da864",
    "courseId": {
      "_id": "67cc6e66bad0d96a6d3da851",
      "name": "Introduction to Programming 2",
      "description": "Basic programming concepts",
      "professorId": "67cc6e52bad0d96a6d3da839",
      "scheduleId": "67cc6e66bad0d96a6d3da84f",
      "createdAt": "2025-03-08T16:20:54.857Z",
      "updatedAt": "2025-03-08T16:20:54.857Z",
      "__v": 0
    },
    "prerequisiteCourseId": {
      "_id": "67cc6e69bad0d96a6d3da858",
      "name": "Advanced Data Structures",
      "description": "In-depth study of data structures and algorithms",
      "professorId": "67cc6e52bad0d96a6d3da839",
      "scheduleId": "67cc6e69bad0d96a6d3da856",
      "createdAt": "2025-03-08T16:20:57.269Z",
      "updatedAt": "2025-03-08T16:20:57.269Z",
      "__v": 0
    },
    "createdAt": "2025-03-08T16:21:00.757Z",
    "updatedAt": "2025-03-08T16:21:00.757Z",
    "__v": 0
  }
]
*/
export interface Prerequisite {
  _id: string;
  courseId: CourseJustId;
  prerequisiteCourseId: CourseJustId;
  createdAt: string;
  updatedAt: string;
}

The university needs to develop a system to manage the information of its departments, professors, students, courses, and enrollments. The system must allow the administration of course schedules, conducted evaluations, and the prerequisites that a student must meet before enrolling in certain courses.
Each department has a unique code, a name, and is associated with multiple professors. A professor has a unique identifier, a name, a hiring date, and can be assigned to only one department. A professor can teach multiple courses, but each course can only be taught by a single professor.
Each course has a unique code, a name, a description, and is associated with a single professor. Some courses may require students to have completed other courses before enrolling, so the system must manage this relationship between courses. Additionally, each course can have a scheduled timetable that must be stored in the system.
Students have a unique identification number, a name, a date of birth, and can enroll in multiple courses. Student enrollments are recorded in an enrollment table, where the enrollment date and the final grade obtained in the course are stored.
During the semester, courses may have multiple evaluations, such as exams or projects. Each evaluation has a unique identifier, a completion date, and is associated with a course. Students can take multiple evaluations within a course, and the system must allow the registration of the grade obtained in each one.
The system must implement referential integrity policies to ensure data consistency.

Generate a structured boilerplate for a full-stack academic management system using NestJS for the backend and Angular with TypeScript and Tailwind CSS for the frontend. The project should follow best practices but remain simple, focusing only on the environment setup and directory structure, not the internal logic.
General Requirements:
Backend: NestJS with TypeScript
Frontend: Angular with TypeScript and Tailwind CSS
Authentication: Token-based authentication (JWT)
Code Quality: ESLint and Prettier configured for both frontend and backend
Database: MongoDB
Environment: Docker support with docker-compose for easy setup
Monorepo structure using Nx (optional)
Backend Structure (NestJS):
src/ folder with modular organization (auth, users, departments, courses, etc.)
Authentication module with JWT strategy
Configuration module to handle environment variables (@nestjs/config)
Database module with TypeORM configured
Basic REST API structure with controllers and services
Frontend Structure (Angular):
src/app/ folder with modular organization (auth, students, courses, etc.)
Angular Router configured for navigation
Authentication service handling JWT tokens and guards
Tailwind CSS configured for styling
State management using Signals (or NgRx if necessary)
Environment files for API configuration
Development Tools & Configurations:
ESLint and Prettier for linting and formatting
Husky for pre-commit hooks
Docker support with docker-compose.yml for PostgreSQL and application services
README.md with setup instructions
Generate the project with this structure, ensuring it is well-organized and follows best practices but does not include detailed business logic. The focus should be on setting up the environment, configuring essential tools, and structuring the project properly.

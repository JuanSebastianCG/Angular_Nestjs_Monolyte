Gestor Academico

La universidad necesita desarrollar un sistema para gestionar la información de sus
departamentos, profesores, estudiantes, cursos y matrículas. El sistema debe permitir administrar los horarios de los cursos, las evaluaciones realizadas y los prerrequisitos que un estudiante debe cumplir antes de inscribirse en ciertos cursos.Cada departamento tiene un código único, un nombre y está asociado con varios profesores. Un profesor tiene un identificador único, un nombre, una fecha de contratación, y puede estar asignado a un solo departamento. Un profesor puede impartir varios cursos, pero un curso solo puede ser impartido por un profesor. Cada curso tiene un código único, un nombre, una descripción, y está asociado con un único profesor. Algunos cursos pueden requerir que el estudiante haya completado otros cursos antes de inscribirse, por lo que es necesario gestionar esta relación entre los cursos. Asimismo, cada curso puede tener un horario programado que debe almacenarse en el sistema. Los estudiantes tienen un número de identificación único, un nombre, una fecha de nacimiento, y pueden inscribirse en varios cursos. La inscripción de los estudiantes se registra en una tabla de matrículas, donde se almacena la fecha de inscripción y la calificación final obtenida en el curso. Durante el semestre, los cursos pueden tener varias evaluaciones, como exámenes o proyectos. Cada evaluación tiene un identificador único, una fecha de realización y está asociada a un curso. Los estudiantes pueden realizar varias evaluaciones en un curso, y el sistema debe permitir registrar la calificación obtenida en cada una. El sistema debe implementar políticas de integridad referencial para garantizar la consistencia de los datos.

Tablas y Relaciones de la Base de Datos
1. Departamento
PK (dept_id)
name
2. Profesor
PK (professor_id)
name
FK (dept_id) → Referencia a Departamento
hiring_date
3. Curso
PK (course_id)
name
FK (professor_id) → Referencia a Profesor
description
FK (schedule_id) → Referencia a Schedule
4. Prerrequisito
PK, FK (course_id) → Referencia a Curso
PK, FK (prerequisite_course_id) → Referencia a otro Curso como prerrequisito
5. Evaluación
PK (evaluation_id)
evaluation_date
FK (course_id) → Referencia a Curso
6. Evaluación_Estudiante
PK, FK (evaluation_id) → Referencia a Evaluación
PK, FK (student_id) → Referencia a Estudiante
grade
7. Inscripción
PK, FK (student_id) → Referencia a Estudiante
PK, FK (course_id) → Referencia a Curso
enrollment_start_date
enrollment_end_date
final_grade
8. Estudiante
PK (student_id)
PK (course_code) (¿Posible error? Parece otra clave primaria sin relación)
birth_date
9. Horario (Schedule)
PK (schedule_id)
start_date
end_date
days_week
start_hour
end_hour
Relaciones Clave
Departamento → Profesor (Uno a muchos)
Un departamento tiene varios profesores.
Un profesor pertenece a un solo departamento.
Profesor → Curso (Uno a muchos)
Un profesor imparte varios cursos.
Un curso tiene un único profesor.
Curso → Prerrequisito (Auto-relación)
Un curso puede requerir otro curso como prerrequisito.
Curso → Evaluación (Uno a muchos)
Un curso tiene varias evaluaciones.
Una evaluación pertenece a un solo curso.
Evaluación → Evaluación_Estudiante (Uno a muchos)
Una evaluación puede tener muchas notas de estudiantes.
Cada entrada en Evaluación_Estudiante corresponde a una evaluación de un estudiante.
Curso → Inscripción (Uno a muchos)
Un curso puede tener muchos estudiantes inscritos.
Un estudiante puede estar inscrito en muchos cursos.
Estudiante → Evaluación_Estudiante (Uno a muchos)
Un estudiante puede tener varias calificaciones de evaluaciones.
Curso → Horario (Uno a uno)
Cada curso tiene un horario específico.




8. Estudiante
PK (student_id)
PK (course_code) (¿Posible error? Parece otra clave primaria sin relación)
birth_date
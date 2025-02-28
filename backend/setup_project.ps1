# Instalar dependencias
npm install @nestjs/mongoose mongoose @nestjs/jwt passport-jwt @nestjs/passport passport class-validator class-transformer @nestjs/swagger swagger-ui-express

# Lista de entidades
$entities = @("auth", "departments", "professors", "courses", "prerequisites", "schedules", "students", "enrollments", "evaluations", "evaluation-students")

# Crear módulos, controladores y servicios
foreach ($entity in $entities) {
    nest generate module $entity
    nest generate controller $entity
    nest generate service $entity
}

# Crear DTOs y entidades para entidades del ERD (excepto auth)
$entities = $entities[1..($entities.Length - 1)]
foreach ($entity in $entities) {
    nest generate class "$entity/dto/create-$entity.dto" --no-spec
    nest generate class "$entity/entities/$entity.entity" --no-spec
}

# Crear DTOs para auth
nest generate class "auth/dto/login.dto" --no-spec
nest generate class "auth/dto/register.dto" --no-spec

# Crear guards y estrategias para auth
nest generate class "auth/guards/jwt-auth.guard" --no-spec
nest generate class "auth/strategies/jwt.strategy" --no-spec

# Crear módulos adicionales
nest generate module config
nest generate module database

echo "Estructura del backend generada exitosamente."


nest generate module user
nest generate controller user
nest generate service user
nest generate class "user/dto/create-user.dto" --no-spec
nest generate class "user/entities/user.entity" --no-spec
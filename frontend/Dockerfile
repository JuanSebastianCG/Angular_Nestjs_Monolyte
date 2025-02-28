# Usa una imagen de Node.js (versión estable recomendada)
FROM node:23-alpine3.20

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar las dependencias
COPY package*.json ./

# Instala dependencias sin generar archivos innecesarios
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto 4200 para que pueda ser accesible
EXPOSE 4200

# Configuración para detectar cambios en Docker (opcional)
ENV CHOKIDAR_USEPOLLING=true

# Comando para iniciar Angular en modo desarrollo
CMD ["npm", "run", "start"]

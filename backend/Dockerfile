# Usa una imagen de Node.js ligera
FROM node:23-alpine3.20

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto del backend
EXPOSE 3000

# Comando para iniciar NestJS con nodemon
CMD ["npm", "run", "start:dev"]

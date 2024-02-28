# Declare build args
ARG NODE_PLATFORM
ARG API_PORT

FROM ${NODE_PLATFORM}/node:18

# Working Directory
WORKDIR /backend

# Copy Src files
COPY . . 

# Install files
RUN npm install --omit=dev

# Move to Express Gateway
WORKDIR /backend/gateway

# Install files
RUN npm install --omit=dev

RUN npm install pm2 -g

# Working Directory
WORKDIR /backend

# Expose the API port
EXPOSE ${API_PORT}

CMD ["pm2-runtime", "process.yml"]
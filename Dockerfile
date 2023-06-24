FROM node:16

RUN git clone --recursive https://github.com/kujirahand/nadesiko3.git /app
WORKDIR /app

RUN npm run hello
RUN npm install
# RUN npm run build

SHELL ["/bin/bash", "-c"]


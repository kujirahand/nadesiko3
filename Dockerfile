FROM node:22-bookworm-slim

WORKDIR /app

# Docker内ではブラウザを自動起動せず、外部からアクセスできるようにする
ENV NAKO3SERVER_OPEN=0 \
    NAKO3SERVER_HOST=0.0.0.0 \
    NAKO3EDIT_OPEN=0 \
    NAKO3EDIT_HOST=0.0.0.0 \
    NAKO3EDIT_PORT=8888 \
    PORT=3000

# 依存関係のキャッシュが効くように package.json を先にコピーする
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .
# なでしこ3をビルドして、cnako3/nako3server/nako3edit をコンテナ内コマンドとして使えるようにする
RUN npm run build && \
    chmod +x src/cnako3.mjs tools/nako3server/index.mjs tools/nako3edit/index.mjs && \
    npm link

EXPOSE 3000 8888

# 例:
#   docker build -t nadesiko3 .
#   docker run --rm nadesiko3 cnako3 -e "「こんにちは」と表示"
#   docker run --rm -p 3000:3000 nadesiko3 nako3server
#   docker run --rm -p 8888:8888 nadesiko3 nako3edit
CMD ["cnako3", "--help"]

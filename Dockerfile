FROM node:18.16-alpine

RUN apk add --update --no-cache
WORKDIR /source

ENTRYPOINT './start.sh'

FROM node:latest
MAINTAINER JJ Lau <j.y.j.j.lau@gmail.c>
LABEL version "1.0"
LABEL description="Express Server w/ Typescript + Grunt workflow"

RUN npm install typescript -g
	&& npm install grunt-cli -g
	&& npm install nodemon -g

WORKDIR /home

EXPOSE 3000

# Check every five minutes or so that a web-server is able to serve the site’s main page within three seconds:
HEALTHCHECK --interval=5m --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

# ENTRYPOINT node build/server.js

FROM node:20.9.0-slim

USER node
WORKDIR /usr/app

COPY --chown=node:node  .  .

RUN yarn

CMD ["/usr/app/start.sh" ]
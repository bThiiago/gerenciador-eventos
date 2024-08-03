#CRIA A IMAGEM LOCAL
#docker build -t fsaifsppep/gerenciador-eventos-frontend:0.0.1 .

#FAZ O LOGIN NO DOCKER HUB
#docker login -u fsaifsppep

#ENVIA A IMAGEM LOCAL PARA O DOCKER HUB
#docker push fsaifsppep/gerenciador-eventos-frontend:0.0.1

FROM nginx:1.25.3-alpine3.18-slim

ENV TZ=America/Sao_Paulo
RUN apk add --update --no-cache tzdata

COPY ./nginx/config/projeto-integrado.conf /etc/nginx/conf.d/default.conf
COPY ./build /var/www/html

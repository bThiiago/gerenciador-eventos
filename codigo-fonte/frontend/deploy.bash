# Apaga a build atual do projeto
rm -r build/
# Realiza a build do projeto, visando o ambiente de produção
NODE_ENV=production yarn build
# Apaga o deploy atual, o qual foi realizado no Nginx
sudo rm -r /var/www/html/*
# Copia a build atual, para a pasta de deploy
sudo cp -r build/* /var/www/html
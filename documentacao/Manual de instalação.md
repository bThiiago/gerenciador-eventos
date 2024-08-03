# Manual de instalação 

Para seguir este manual, é primordial que você possua acesso as permissões de gerenciamento do repositório Git devido a forma de deploy que será utilizado, pois será gerado uma chave privada/pública no servidor que será utilizada para fornecer permissão de acesso. Isso ocorre devido às recentes restrições relacionadas ao acesso de repositórios no Github, os quais são realizados apenas via SSH.
Todos os comandos citados neste manual são referentes ao sistema operacional Ubuntu, por isso recomendamos que você tenha ele instalado como sistema operacional na sua máquina, ou tenha uma máquina virtual com ele (se for instalado via máquina virtual, pode ser que seu computador fique lento, então recomendamos 12GB de memória RAM ou mais para a utilização via máquina virtual). Se você não tem conhecimento de como instalar o Ubuntu, verifique os 2 primeiros links na sessão Referências/Links complementares ao final do arquivo.

#### Observações

1. Note que durante este manual iremos usar chaves (`{` e `}`) para envolver determinado item, uma informação envolvida por chaves deve ser totalmente substituida (incluindo as chaves) pelo valor que ela indica, por exemplo:
   * `{email}` => `emailaqui@gmail.com`
   * `{ip}` => `192.168.0.31`
   * `{usuario}@{ip}` => `ifsp@192.168.0.31` 
2. Nos comandos que serão apresentados (assim como é utilizado para representar comandos no Linux na internet), os comandos executados durante a configuração são mostrados nas linhas que começam com o caractere `$`, enquanto as linhas com o caractere `>` representam as saídas destes comandos
3. Em casos onde existam palavras envolvidas por `[ ]`, deve-se notar que estas estão representando uma ação. Por exemplo `[Enter]`quer dizer que o usuário deve apertar a tecla enter, enquanto `[Digite a senha]` refere-se à inserir a senha de acesso.
4. Este manual considera que o usuário possui um conhecimento básico do sistema operacional Linux. Normalmente este conhecimento é ensinado em algumas aulas de `Redes 1~2`, `Linguagem de montagem` ou alguma outra aula dos professores Kleber, Ricardo ou Cláudio. Também é interessante possuir conhecimentos em Git, que são desenvolvidos nas matérias do professor César (`Ferramentas de Programação 1~2~3`).
5. Recomendamos realizar o processo de instalação em um Ubuntu Server LTS. A versão atual (07/06/2024) é a 22.04, confira sua versão, já que pode haver modificações nos comandos utilizados, ou outros problemas relacionados ao suporte das tecnologias utilizadas. 

<div style="page-break-after: always;"></div>

## 1. Acesso ao código fonte

No momento da atualização deste manual de instalação `(07/06/2024)`, o repositório com o código fonte do sistema pode ser acessado pela URL `https://github.com/Fabrica-de-Software-Academica-IFSP-PEP/gerenciador-eventos`. Se você não consegue acessar, pode ser que seu usuário do Github não possui as devidas permissões a organização/repositório (para acessar, converse com o professor responsável pela disciplina de Projeto Integrado I). O passo a passo a seguir informa como acessar a máquina virtual onde o sistema está hospedado e gerar uma chave SSH.

1. Acessar o servidor via SSH com o comando `ssh {usuario}@{ip}`, utilizando o usuário e endereço IP fornecido pela equipe de TI (normalmente é necessário acesso à VPN para conectar ao servidor, por favor confira o tutorial de uso enviado no e-mail pela equipe de TI).

2. Logado no sistema, devemos primeiramente garantir que algumas coisas estão instaladas. Para isso é possível utilizar o comando `sudo apt install git`.

   ```bash
   $ sudo apt install git
   > Saída do processo de instalação
   [Pressionar Y e enter para confirmar a instalação]
   ```

3. Gerar chave SSH

   1. Gerar uma chave SSH com o comando `ssh-keygen -t ed25519 -C "{email}"`.

      ```bash
      $ ssh-keygen -t ed25519 -C "{email}"
      > Generating public/private algorithm key pair.
      > Enter a file in which to save the key (/home/you/.ssh/algorithm): [Pressionar enter]
      > Enter passphrase (empty for no passphrase): [Digite uma senha]
      > Enter same passphrase again: [Digite uma senha]
      ```

      * Ao requerer um local para inserir o arquivo, deve apenas apertar enter
      * Caso deseje, digite uma senha e confirme, ou apenas aperte enter para deixar sem nenhuma senha

   2. Iniciar o `ssh-agent` em segundo plano com o comando `eval "$(ssh-agent -s)"`.

      ````bash
      $ eval "$(ssh-agent -s)"
      > Agent pid 59566
      ````

   3. Adicionar a chave SSH privada com o código `ssh-add ~/.ssh/id_ed25519`. Caso a chave tenha sido criada criado com um nome diferente, deve substituir `id_ed25519` no comando com o nome da chave.

      ```bash
      $ ssh-add ~/.ssh/id_ed25519
      ```

4. Copiar a chave pública localizada no seu computador no arquivo em `~/.ssh/id_ed25519.pub`. O comando para exibir a chave é `cat ~/.ssh/id_ed25519.pub` e basta copiar a saída do comando.

   - **LEMBRE DE COPIAR A CHAVE PÚBLICA (ARQUIVO QUE TERMINA COM `.PUB`)**

   <div style="page-break-after: always;"></div>

5. Com a chave SSH gerada, deve-se realizar o cadastro da chave no Github. Para isso, siga a sequência de passos demonstrada na imagem a seguir:

   ![image-20211214004058016](./imagens/image-20211214004058016.png)

6. Nesta segunda página, deve se preenchar as informações da seguinte maneira:

   ![image-20211214004613558](./imagens/image-20211214004613558.png)

7. Após preencher as informações, a chave SSH  pode ser adicionada apenas ao clicar no botão verte `Add key`, ou em português `Adicionar chave`.

<div style="page-break-after: always;"></div>

Apartir deste momento, já deve ser possível realizar o clone do projeto no servidor através do comando abaixo.

```bash
$ git clone git@github.com:Fabrica-de-Software-Academica-IFSP-PEP/gerenciador-eventos.git
ou
$ git clone {urlSSH}
> Cloning into 'gerenciador-eventos'...
> The authenticity of host 'github.com (20.201.28.151)' can't be established.
> ECDSA key fingerprint is SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM.
> Are you sure you want to continue connecting (yes/no/[fingerprint])? [Digitar yes]
Warning: Permanently added 'github.com,20.201.28.151' (ECDSA) to the list of known hosts.
> remote: Enumerating objects: 12245, done.
> emote: Counting objects: 100% (5847/5847), done.
> remote: Compressing objects: 100% (2737/2737), done.
> remote: Total 12245 (delta 3671), reused 4641 (delta 2678), pack-reused 6398
> Receiving objects: 100% (12245/12245), 9.40 MiB | 4.42 MiB/s, done.
> Resolving deltas: 100% (7578/7578), done.
```


## 2. Instalação do Docker e PostgresSQL

Por questões de flexibilidade, estamos realizando a instalação do PostgresSQL através de um container docker. Caso necessário, o PostgresSQL pode ser instalado através do gerenciador de pacotes.

## 2.1 Instalar Docker

Para instalar o Docker, devem ser executados os seguintes comandos:

```bash
# Comados fornecidos pela documentação oficial do Docker
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
$ echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
$ sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Adicionar ao usuário a permissão de usar comandos do docker, sem precisar usar sudo
sudo usermod -aG docker "$(whoami)"
```

## 2.2 Instalar PostgresSQL

Use o comando abaixo para instalar o PostgresSQL:

```bash
$ docker run --name postgres -e "POSTGRES_PASSWORD=ProjetoIntegrador2021" -p 5432:5432 -v /var/lib/postgresql/data:/var/lib/postgresql/data -d --restart unless-stopped postgres
```

Alguns comandos úteis estão descritos abaixo:

```bash
$ docker ps # Lista os containers em execução
$ docker ps --all # Lista todos os containers existentes
$ docker start postgres # Inicia o PostgresSQL
$ docker stop postgres # Para a execução do PostgresSQL
$ docker exec -it postgres psql -h localhost -U postgres # Acessa o cli client do postgres
```

<div style="page-break-after: always;"></div>

## 3. Instalação do projeto

A instalação do projeto atualmente é feita via SSH, usando um projeto no GitHub criado especialmente para isso. 

## 3.1 Instalar Node.js

No momento da atualização deste manual (07/06/2024), estamos utilizando o Node.js na versão `18.19.1`.

```bash
$ curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
$ sudo apt-get install -y nodejs gcc g++ make
```

- Para outras versões, consulte este link https://github.com/nodesource/distributions/blob/master/README.md.

1. Instalar o gerenciador de pacote yarn com os comandos abaixo.

   ```bash
   $ curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg > /dev/null
   $ echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
   $ sudo apt-get update && sudo apt-get -y install yarn
   ```

2. Instalar as dependências

   - Para instalar as dependências do projeto deve ser executado o comando `yarn` nas pastas `backend`e `frontend`. Execute os comando abaixo para garantir a instalação correta.

     ```bash
     $ cd ~/gerenciador-eventos/
     $ ls
     > backend  documentacao  frontend  README.md
     $ cd backend/
     $ yarn
     > yarn install v1.22.15
     > warning package.json: No license field
     > warning new-typeorm-project@0.0.1: No license field
     > [1/4] Resolving packages...
     > [2/4] Fetching packages...
     ... infos ...
     > [3/4] Linking dependencies...
     ... warnings ...
     > [4/4] Building fresh packages...
     > Done in 45.07s.
     $ cd ../frontend/
     $ yarn
     yarn install v1.22.15
     > [1/4] Resolving packages...
     ... infos ...
     ... warnings ...
     [4/4] Building fresh packages...
     Done in 91.45s.
     ```


## 3.2 Configuração do projeto

## 3.2.1 **Configurar Backend**

1. Acessar o arquivo `backend.env_exemplo` e renomear para `backend.env`. 
2. Preencher as informações do arquivo `.env` com dados que serão utilizados e estão logo abaixo.
3. Na tabela temos alguns exemplos para facilitar o entendimento das variáveis.

| Nome da variável  | Utilização                                                   | Exemplo do valor                                  |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| DATABASE_URL      | URL de conexão com o PostgresSQL, no banco de dados de produção | postgres://{usuario}:{senha}@{ip}:{porta}/eventos |
| TEST_DATABASE_URL | URL de conexão com o PostgresSQL, no banco de dados de teste | postgres://{usuario}:{senha}@{ip}:{porta}/eventos |
| JWT               | Chave para ser usada no token jwt, pode ser um conjunto de caracteres aleatórios | algum token aleatório, ou chave gerada            |
| NODE_ENV          | Sinaliza o ambiente que esta executando um código no Node.js | production                                        |
| SYNCHRONIZE_DB    | Se o Typeorm irá realizar a sincronização do banco de dados  | true                                              |
| ROOTPATH          | URL base do sistema                                          | /api/v1                                           |
| RECAPTCHA_SECRET  | Chave Secreta (Ver seção 3.2.3 )                             | 0AA542AAJsIoyLhGAfhJ                              |
| EMAIL             | Endereço de email do qual será enviado os e-mails            | envioteste@teste.com                              |
| EMAIL_HOST        | Endereço da host do serviço de e-mail                        | smtp.serviço.com                                  |
| EMAIL_PORT        | Porta da host de serviço de email                            | 2525                                              |
| EMAIL_AUTH_USER   | Usuário para autentificar no serviço de email                | usuario                                           |
| EMAIL_AUTH_PASS   | Senha para autenticar no serviço de email                    | senhatop                                          |



<div style="page-break-after: always;"></div>

Exemplo das variáveis de desenvolvimento:

```bash
DATABASE_URL=postgres://postgres:ifsp@localhost:5432/eventos
TEST_DATABASE_URL=postgres://postgres:ifsp@localhost:5432/eventos_test
JWT=256 bit key
NODE_ENV=development
SYNCHRONIZE_DB=true

EMAIL=sge@test.com
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_AUTH_USER=usuario
EMAIL_AUTH_PASS=senha

BASE_EMAIL_URL=http://localhost:3000%        
```

Variáveis usadas no projeto, neste momento (substituir no arquivo):

```bash
DATABASE_URL=postgres://ifsp:ifsp@localhost:5432/eventos
TEST_DATABASE_URL=postgres://ifsp:ifsp@localhost:5432/eventos
JWT=256 bit key
NODE_ENV=development
SYNCHRONIZE_DB=true
ROOTPATH=/api/v1
RECAPTCHA_SECRET=6LeibfgpAAAAAAdquS3LTNvEsmJDxKIHnCaSrOkj

EMAIL=eventos.pep@nao-responda.ifsp.edu.br
EMAIL_HOST=nao-responda.ifsp.edu.br
EMAIL_PORT=587
EMAIL_AUTH_USER=eventos.pep
EMAIL_AUTH_PASS=#9zoXO

BASE_EMAIL_URL=https://gerenciadoreventos/
```


## 3.2.2 **Configurar Frontend**

Seguindo a mesma lógica do backend, iremos alterar as informações presentes no `frontend.env_exemplo` e renomeá-lo apenas para `frontend.env`. As configurações são as seguintes:

Exemplo das variáveis de desenvolvimento:

```bash
PUBLIC_URL=http://localhost
AXIOSURL=http://localhost/api/v1
REACT_APP_SERVICES_API_URL=http://localhost:3333/api/v1
REACT_APP_SITE_KEY=SUA_CHAVE
```

Variáveis usadas no projeto, neste momento (substituir no arquivo):

```bash
PUBLIC_URL=http://localhost
AXIOSURL=http://localhost/api/v1
REACT_APP_SERVICES_API_URL=http://localhost:3333/api/v1
REACT_APP_SITE_KEY=6LcaHOEpAAAAADhkFPeAGn48zAtH6rBq2jaDIac6
```
## 3.2.3 **Gerar Chave do Google reCAPTCHA**

Para gerar uma chave do Google reCAPTCHA, siga os passos abaixo:

1. Acesse o link [Google reCAPTCHA](https://www.google.com/recaptcha/admin/create) e faça o login.

2. **Preencha o formulário**:

      * **Rótulo:** Dê um nome ao seu site. Ex: Eventos .
      * **Tipo de reCAPTCHA:** Escolha entre reCAPTCHA v2 ou v3 (Atualmente está sendo utilizado o v2).
      * **Domínios:** Insira os domínios onde o reCAPTCHA será usado.Ex: localhost ou eventos.pep2.ifsp.edu.br.

3. Clique em "Enviar" para gerar as chaves.

4. Use a ***Chave de Site*** para alterar a variavel `REACT_APP_SITE_KEY` no `frontend.env`.
5. Use a ***Chave de Secreta*** para alterar a variavel `RECAPTCHA_SECRET` no `backend.env`.
## 3.3 **Executar Projeto Localmente**

Para finalmente executar o projeto no seu computador, devemos aplicar os seguintes comandos:

1. Finalizar o PostgreSQL que pode estar executando

```bash
sudo systemctl stop postgresql
```

2. Dentro da pasta `/gerenciador-eventos`, inicializar o container do docker.

```bash
sudo docker compose up -d
```

3. Dentro das pastas `/gerenciador-eventos/backend` e `/gerenciador-eventos/frontend` executar o comando abaixo para instalar dependências:

```bash
sudo yarn
```

4. Dentro da pasta `/gerenciador-eventos/backend` executar o seguinte comando para criar o banco de dados:

```bash
yarn createdb
```

5. Dentro das pastas `/gerenciador-eventos/backend` e `/gerenciador-eventos/frontend` executar o comando abaixo para inicializar o backend e o frontend (primeiro executar o comando no backend, utilizando 2 terminais diferentes):

```bash
yarn start
```

**OBSERVAÇÃO**: essa lista de comandos deve ser executada apenas na primeira execução. A partir da segunda, execute apenas os comandos 1, 2 e 5. Em caso de mudança de dependências, execute novamente o comando 3. Em caso de mudanças no banco de dados, convém criá-lo novamente (com o comando 4).


# Referências/Links complementares

- [Dual Boot - Windows 10 e Ubuntu](https://www.youtube.com/watch?v=6D6L9Wml1oY)
- [Instalar Ubuntu via Virtual Box](https://www.youtube.com/watch?v=XxZ8BTCBDis)
- [Docker](https://docs.docker.com/engine/install/ubuntu/)
- [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js](https://nodejs.org/en/download/)

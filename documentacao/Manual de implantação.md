# Manual de implantação 

Este manual foi criado para aqueles que desejam instalar o sistema localmente para utilizá-lo. Consideramos que não há outros sistemas sendo executados no computador. A instalação é feita via docker image.

#### Observações

1. Note que durante este manual iremos usar chaves (`{` e `}`) para envolver determinado item, uma informação envolvida por chaves deve ser totalmente substituida (incluindo as chaves) pelo valor que ela indica, por exemplo:
   * `{email}` => `emailaqui@gmail.com`
   * `{ip}` => `192.168.0.31`
   * `{usuario}@{ip}` => `ifsp@192.168.0.31` 
2. Nos comandos que serão apresentados (assim como é utilizado para representar comandos no Linux na internet), os comandos executados durante a configuração são mostrados nas linhas que começam com o caractere `$`, enquanto as linhas com o caractere `>` representam as saídas destes comandos
3. Em casos onde existam palavras envolvidas por `[ ]`, deve-se notar que estas estão representando uma ação. Por exemplo `[Enter]`quer dizer que o usuário deve apertar a tecla enter, enquanto `[Digite a senha]` refere-se à inserir a senha de acesso.
4. Este manual considera que o usuário possui um conhecimento básico do sistema operacional Linux. Normalmente este conhecimento é ensinado em algumas aulas de `Redes 1~2`, `Linguagem de montagem` ou alguma outra aula dos professores Kleber, Ricardo ou Cláudio. Também é interessante possuir conhecimentos em Git, que são desenvolvidos nas matérias do professor César (`Ferramentas de Programação 1~2~3`).
5. Recomendamos realizar o processo de instalação em um Ubuntu Server LTS. A versão atual (17/03/2024) é a 22.04, confira sua versão, já que pode haver modificações nos comandos utilizados, ou outros problemas relacionados ao suporte das tecnologias utilizadas. 

<div style="page-break-after: always;"></div>

## 1. Acesso repositório de instalação

No momento da atualização deste manual de instalação `(07/06/2024)`, o repositório para instalação do sistema pode ser acessado pela URL `https://github.com/Fabrica-de-Software-Academica-IFSP-PEP/gerenciador-eventos-instalacao`. Trata-se de um repositório público que contém as configurações de arquivos de banco de dados, backend, frontend e do docker compose.

## 2. Instalação do Docker

Como explicado anteriormente, a instalação é feita via docker image, então é fundamental que você possua o docker instalado em sua máquina.

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

## 3. Instalação do projeto

A instalação do projeto nada mais é do que a configuração dos arquivos `backend.env`, `db.env` e `frontend.env`. 

## 3.1 Configuração do projeto

Para baixar a imagem do projeto no seu computador, use o comando abaixo:

```bash
$ git@github.com:Fabrica-de-Software-Academica-IFSP-PEP/gerenciador-eventos-instalacao.git
```

## 3.3.1 **Configurar Backend**

1. Acessar o arquivo `backend.env_exemplo` e renomear para `backend.env`. 
2. O arquivo já está particalmente configurado, sendo necessário adicionar apenas as informações do servidor de e-mail utilizado pelo sistema de eventos (as informações estão logo abaixo).
3. Algumas explicações do que as variáveis significam estão na tabela abaixo.

| Nome da variável  | Utilização                                                   | Exemplo do valor                                  |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| DATABASE_URL      | URL de conexão com o PostgresSQL, no banco de dados de produção | postgres://{usuario}:{senha}@{ip}:{porta}/eventos |
| TEST_DATABASE_URL | URL de conexão com o PostgresSQL, no banco de dados de teste | postgres://{usuario}:{senha}@{ip}:{porta}/eventos |
| JWT               | Chave para ser usada no token jwt, pode ser um conjunto de caracteres aleatórios | algum token aleatório, ou chave gerada            |
| NODE_ENV          | Sinaliza o ambiente que esta executando um código no Node.js | production                                        |
| SYNCHRONIZE_DB    | Se o Typeorm irá realizar a sincronização do banco de dados  | true                                              |
| ROOTPATH          | URL base do sistema                                          | /api/v1                                           |
| RECAPTCHA_SECRET  | Chave Secreta (Ver seção 3.3.3 )                             | 0AA542AAJsIoyLhGAfhJ                              |
| EMAIL             | Endereço de email do qual será enviado os e-mails            | envioteste@teste.com                              |
| EMAIL_HOST        | Endereço da host do serviço de e-mail                        | smtp.serviço.com                                  |
| EMAIL_PORT        | Porta da host de serviço de email                            | 2525                                              |
| EMAIL_AUTH_USER   | Usuário para autentificar no serviço de email                | usuario                                           |
| EMAIL_AUTH_PASS   | Senha para autenticar no serviço de email                    | senhatop                                          |

<div style="page-break-after: always;"></div>

Variáveis usadas para implementação, neste momento (substituir no arquivo backend.env):

```bash
DATABASE_URL=postgres://ifsp:ifsp@db:5432/eventos
TEST_DATABASE_URL=postgres://ifsp:ifsp@db:5432/eventos
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

## 3.3.2 **Configurar Frontend**

Seguindo a mesma lógica do backend, iremos alterar as informações presentes no `frontend.env_exemplo` e renomeá-lo apenas para `frontend.env`. As configurações são as seguintes:

```bash
PUBLIC_URL=http://eventos.pep2.ifsp.edu.br
AXIOSURL=http://eventos.pep2.ifsp.edu.br/api/v1
REACT_APP_SERVICES_API_URL=http://localhost:3333/api/v1
REACT_APP_SITE_KEY=6LcaHOEpAAAAADhkFPeAGn48zAtH6rBq2jaDIac6
```

Execute o comando abaixo para subir o container do docker. Observe que teremos 3 containers: 1 para o backend, 1 para o frontend e 1 para o banco de dados. Todos eles devem estar em execução para que o sistema funcione corretamente. 

```bash
docker compose up -d
```

Depois disso, o sistema pode ser acessado diretamente do link: [http://localhost:80/](http://localhost:80/)

## 3.3.3 **Gerar Chave do Google reCAPTCHA**

Para gerar uma chave do Google reCAPTCHA, siga os passos abaixo:

1. Acesse o link [Google reCAPTCHA](https://www.google.com/recaptcha/admin/create) e faça o login.

2. **Preencha o formulário**:

      * **Rótulo:** Dê um nome ao seu site. Ex: Eventos .
      * **Tipo de reCAPTCHA:** Escolha entre reCAPTCHA v2 ou v3 (Atualmente está sendo utilizado o v2).
      * **Domínios:** Insira os domínios onde o reCAPTCHA será usado.Ex: localhost ou eventos.pep2.ifsp.edu.br.

3. Clique em "Enviar" para gerar as chaves.

4. Use a ***Chave de Site*** para alterar a variavel `REACT_APP_SITE_KEY` no `frontend.env`.
5. Use a ***Chave de Secreta*** para alterar a variavel `RECAPTCHA_SECRET` no `backend.env`.

# Referências/Links complementares

- [Docker](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Image](https://docs.docker.com/reference/cli/docker/image/)

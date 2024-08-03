# Preparando o Ambiente no Windows com WSL

## 1.1 Instalando o WSL e Ubuntu

### Instalar o WSL
  Abra o PowerShell como administrador e execute o comando:

```powershell
wsl --install
```
O comando --install executa as seguintes ações:

  * Habilita os componentes opcionais WSL e Plataforma de Máquina Virtual
  * Baixa e instala o kernel do Linux mais recente
  * Define WSL 2 como o padrão
  * Faz download e instala uma distribuição do Linux

### Verificar a instalação
 
  Após a instalação, reinicie seu computador e abra o PowerShell novamente para verificar a instalação:

```powershell
  wsl --list --verbose
```

Você deve ver uma lista de distribuições instaladas e sua versão do WSL. Certifique-se de que está utilizando o WSL 2. Caso contrário, você pode definir o WSL 2 como padrão com o comando:

```powershell
wsl --set-default-version 2
```

### Configurar o Ubuntu
#### Configurar seu nome de usuário e senha do Linux
  Depois que o processo de instalação da distribuição do Linux com o WSL for concluído, abra a distribuição (Ubuntu por padrão) usando o menu Iniciar. Você será solicitado a criar um Nome de Usuário e Senha para sua distribuição do Linux.

O Nome de Usuário e a Senha são específicos de cada distribuição do Linux separada que você instala e não têm nenhuma influência sobre o seu nome de usuário do Windows.
Observe que, ao inserir a Senha, nada aparecerá na tela. Isso é chamado de digitação cega. Você não verá o que está digitando. Isso é completamente normal.
Depois de criar um Nome de Usuário e uma Senha, a conta será o usuário padrão para a distribuição e será conectada automaticamente ao iniciar.
Essa conta será considerada o administrador do Linux, com a capacidade de executar comandos administrativos sudo (Super User Do).

## 1.2 Instalando Ferramentas Necessárias
### Atualizar pacotes
  Abra o terminal do Ubuntu e execute o comando:

```bash
sudo apt update && sudo apt upgrade -y
```
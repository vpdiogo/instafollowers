# Insta Followers

Aplicação local para comparar as listas do export do Instagram. Os dados são lidos no navegador e não são enviados a nenhum servidor.

## Como usar

```bash
npm install
npm start
```

Abra [http://localhost:3000](http://localhost:3000).

### Abrir em outro dispositivo da mesma rede Wi-Fi

O servidor já aceita conexões da rede local. Com ele rodando, descubra o IP local deste computador:

```bash
hostname -I
```

No celular ou outro computador conectado ao **mesmo Wi-Fi**, abra `http://SEU-IP-LOCAL:3000` — por exemplo, `http://192.168.1.42:3000`.

Se o Ubuntu perguntar sobre o firewall, permita conexões na porta 3000 somente para sua rede privada. Não exponha essa porta na internet/roteador. Cada navegador processa o seu próprio arquivo do Instagram; o ZIP não é enviado para o computador que está rodando o servidor.

Na Central de Contas do Instagram, solicite o download das informações em formato **JSON**. No app, envie o ZIP completo ou os arquivos `followers_*.json` e `following.json`.

## O que ela mostra

- Contas que você segue e não seguem você de volta.
- Contas que seguem você, mas que você não segue.
- Totais, busca por usuário e cópia da lista exibida.

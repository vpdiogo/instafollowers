# Insta Followers

Uma ferramenta estática para comparar seguidores e contas seguidas a partir do export oficial do Instagram.

## Privacidade

O ZIP/JSON é lido no navegador. Nenhum arquivo, nome de usuário ou credencial é enviado a um servidor. O site não pede login do Instagram e não é afiliado à Meta ou ao Instagram.

## Como usar

1. Na Central de Contas do Instagram, solicite o download em formato **JSON**.
2. Abra o site e envie o ZIP completo ou os arquivos `followers_*.json` e `following.json`.
3. Veja quem não segue você de volta ou quem você não segue.

## Publicação

O projeto não exige Node.js, banco de dados ou backend. Publique o conteúdo deste repositório como site estático em GitHub Pages, Cloudflare Pages ou Vercel.

O arquivo inicial é `index.html`. Para testar localmente, abra-o em um navegador ou sirva esta pasta com qualquer servidor estático.

## Recursos

- Importação do ZIP oficial ou dos JSONs individuais.
- Contas que não seguem você de volta.
- Contas que você não segue.
- Busca, links para perfis e cópia da lista exibida.

Na Central de Contas do Instagram, solicite o download das informações em formato **JSON**. No app, envie o ZIP completo ou os arquivos `followers_*.json` e `following.json`.

## O que ela mostra

- Contas que você segue e não seguem você de volta.
- Contas que seguem você, mas que você não segue.
- Totais, busca por usuário e cópia da lista exibida.

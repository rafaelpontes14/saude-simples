# Saude Simples

Crie uma aplicação web acadêmica chamada Simplificando o Atendimento de Saúde, com design moderno, simples e responsivo, utilizando tons de verde e branco.

Implemente as seguintes funcionalidades:

Login e cadastro: permitir que usuários criem conta e acessem o sistema.

Área do paciente: permitir solicitar consultas, visualizar suas solicitações e acompanhar o status.

Área do médico: permitir visualizar solicitações e alterar o status para pendente, confirmada ou concluída.

Integração com Supabase: salvar os usuários e as solicitações em um banco de dados real, com autenticação e permissões adequadas para cada perfil.

Mantenha o projeto simples, sem chat, pagamentos ou funcionalidades extras. Utilize dados fictícios e impeça que pacientes acessem solicitações de outros pacientes. Não permita que usuários se atribuam o perfil de médico livremente.

Quero conseguir testar as funcionalidades pelo próprio Lovable e obter quatro capturas de tela reais para meu relatório acadêmico:

Tela de login ou cadastro.

Área do paciente com uma solicitação registrada.

Área do médico com as solicitações.

Consulta com status atualizado.

Priorize fazer as funcionalidades funcionarem, não apenas criar telas bonitas. Configure a integração com o Supabase e as políticas de segurança. Se precisar de alguma configuração externa, explique o que devo fazer.

Comece criando a aplicação e, ao terminar, informe como testar cada funcionalidade e tirar as quatro capturas de tela. Não afirme que algo funciona sem verificar.


**Live app**: https://saude-simples.lovable.app


## Sobre o arquivo `.env`

Este repositório é público por ser um trabalho acadêmico, e o arquivo `.env` está incluído nele. Ele contém apenas três valores: o endereço do backend do projeto, o identificador público do projeto e a chave pública de acesso.

Esses valores são públicos por natureza — os três são embutidos no código que o navegador de qualquer visitante recebe ao abrir o site publicado. A chave do `.env` é a chave pública, a mesma usada pelo navegador: ela não concede acesso administrativo e não permite ler dados de outros usuários, porque quem pode ver o quê é decidido pelas políticas de segurança do banco de dados (RLS), e não pela chave.

Credenciais privadas de verdade (chave administrativa e senha do banco) não estão neste repositório e não são acessíveis neste ambiente. O `.env` é mantido versionado porque a publicação do site é montada a partir dos arquivos commitados.

Para executar o projeto em outro lugar, aponte essas variáveis para o seu próprio backend.


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# Saúde Simples — Simplificando o Atendimento de Saúde

## Apresentação

O **Saúde Simples** é uma aplicação web acadêmica desenvolvida com o objetivo de facilitar o gerenciamento de solicitações de consultas médicas e contribuir para a organização do atendimento entre pacientes e profissionais de saúde

A plataforma permite que pacientes solicitem consultas, acompanhem o andamento dos atendimentos e visualizem suas solicitações. Os profissionais de saúde, por sua vez, podem visualizar as solicitações recebidas e atualizar seus respectivos status

O projeto busca demonstrar como a tecnologia pode contribuir para a simplificação e a melhoria dos processos de atendimento em saúde por meio de uma solução digital acessível e responsiva

## Objetivos do projeto

- Desenvolver uma plataforma web para gerenciamento de solicitações de consultas médicas
- Permitir que pacientes solicitem consultas e acompanhem seus atendimentos
- Disponibilizar aos médicos recursos para visualizar e atualizar as solicitações
- Implementar autenticação e controle de acesso conforme os perfis dos usuários
- Utilizar um banco de dados para armazenar e gerenciar as informações da aplicação

## Funcionalidades

- **Autenticação:** cadastro e login de usuários
- **Área do paciente:** solicitação de consultas e acompanhamento dos respectivos status
- **Área do médico:** visualização das solicitações e atualização dos status para pendente, confirmada ou concluída
- **Controle de acesso:** separação de permissões entre pacientes e médicos
- **Integração com banco de dados:** armazenamento das informações utilizando Supabase e PostgreSQL

## Tecnologias utilizadas

- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Vitest
- ESLint

## Aplicação publicada

A versão funcional do projeto está disponível para acesso:

**[Acessar Saúde Simples](https://saude-simples.lovable.app/)**

## Repositório

O código-fonte da aplicação está disponibilizado publicamente no GitHub:

**[Acessar repositório Saúde Simples](https://github.com/rafaelpontes14/saude-simples)**

## Observação sobre as variáveis de ambiente

O arquivo `.env` contém informações de configuração e chaves públicas utilizadas na conexão com o Supabase. Não são incluídas credenciais administrativas ou senhas privadas no repositório. As permissões de acesso aos dados são controladas pelas políticas de segurança (RLS) configuradas no banco de dados.

## Finalidade acadêmica

O projeto foi desenvolvido no contexto da **Atividade Extensionista III**, do curso de Bacharelado em Engenharia de Software, com a proposta de aplicar conhecimentos de desenvolvimento de sistemas na criação de uma solução tecnológica voltada à organização e à melhoria dos processos de atendimento em saúde.

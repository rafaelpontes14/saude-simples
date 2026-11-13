# Saúde Simples — Simplificando o Atendimento de Saúde

## Apresentação

O **Saúde Simples** é uma aplicação web acadêmica desenvolvida com o objetivo de facilitar o gerenciamento de solicitações de consultas médicas e contribuir para a organização do atendimento entre pacientes e profissionais de saúde.

A plataforma permite que pacientes solicitem consultas, acompanhem o andamento dos atendimentos em tempo real e troquem mensagens diretamente com a equipe médica. Os profissionais de saúde, por sua vez, podem visualizar as solicitações recebidas, gerenciar os status de atendimento, consultar o histórico de consultas concluídas e interagir via chat.

O projeto busca demonstrar como a tecnologia pode contribuir para a simplificação e a melhoria dos processos de atendimento em saúde por meio de uma solução digital moderna, segura, acessível e responsiva.

---

## Objetivos do Projeto

- Desenvolver uma plataforma web para gerenciamento e triagem de solicitações de consultas médicas.
- Permitir que pacientes solicitem consultas, acompanhem seus atendimentos e recebam notificações de atualização.
- Disponibilizar aos médicos recursos para visualização, atualização de status e consulta ao histórico de atendimentos.
- Implementar um canal de comunicação direta e segura (chat por consulta) entre médico e paciente.
- Implementar autenticação e controle de acesso conforme os perfis dos usuários (*Role-Based Access Control* - RBAC + RLS).
- Garantir a persistência e a integridade das informações em banco de dados relacional com políticas de segurança ativas.

---

## Funcionalidades Principais

- **Autenticação e Segurança:**
  - Cadastro e login de usuários via Supabase Auth.
  - Fluxo de recuperação de senha por e-mail (*Esqueci minha senha*).
  - Validação de senhas com mensagens de erro traduzidas e localizadas para Português (pt-BR).
  - Controle de perfis (*Role-Based Access Control*): pacientes por padrão no cadastro; perfil médico atribuído de forma protegida no banco de dados.

- **Área do Paciente:**
  - Solicitação de consultas com especialidade médica, data/horário preferencial e descrição do motivo.
  - Acompanhamento do status de cada solicitação (`Pendente`, `Confirmada` ou `Concluída`).
  - Chat em tempo real em cada consulta para alinhamentos com o profissional de saúde.
  - Notificações em tempo real sobre mudanças de status das consultas.

- **Área do Médico:**
  - Fila de atendimentos ativos com atualização de status (`Confirmada`, `Concluída` ou retorno para `Pendente`).
  - Chat integrado para atendimento e esclarecimento de dúvidas com o paciente.
  - **Histórico de atendimentos:** aba dedicada para consulta de atendimentos concluídos, com busca rápida por nome de paciente e data de conclusão.
  - Notificações instantâneas a cada nova solicitação recebida.

---

## Tecnologias Utilizadas

- **Front-end:**
  - [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [TanStack Start](https://tanstack.com/start/) / [TanStack Router](https://tanstack.com/router/) (Roteamento baseado em arquivos, SSR e tipagem estrita)
  - [TanStack Query](https://tanstack.com/query/) (Gerenciamento de estado assíncrono e cache)
  - [Tailwind CSS v4](https://tailwindcss.com/) (Estilização utilitária e responsiva)
  - [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
  - [Lucide React](https://lucide.dev/) (Ícones)
  - [Sonner](https://sonner.emilkowal.ski/) (Notificações em toast)
  - [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Validação de formulários)

- **Back-end e Banco de Dados (BaaS):**
  - [Supabase / Lovable Cloud](https://supabase.com/)
  - [PostgreSQL](https://www.postgresql.org/) (Banco de dados relacional)
  - **Row Level Security (RLS)** para controle de acesso nativo no banco de dados.
  - **Supabase Realtime** (Comunicação via WebSockets para chat e notificações instantâneas).
  - Funções `SECURITY DEFINER` em PL/pgSQL (`has_role`, `can_access_appointment`).
  - Função `notify_doctors` para geração de notificações automáticas aos profissionais de saúde quando novas solicitações são recebidas.

- **Qualidade e Testes:**
  - [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (Testes automatizados unitários e de rotas)
  - [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) (Padronização e formatação de código)

---

## Arquitetura e Banco de Dados

A aplicação adota uma arquitetura baseada no modelo BaaS (*Backend-as-a-Service*). O front-end se comunica com os serviços gerenciados da plataforma Supabase — **Supabase Auth (GoTrue)** para autenticação, PostgREST para consultas RESTful e Supabase Realtime via WebSockets. Esses serviços intermedeiam o acesso ao banco de dados relacional PostgreSQL.

O cliente Supabase é tipado com base nas definições geradas do schema PostgreSQL (`Database`), enquanto componentes e páginas utilizam interfaces TypeScript sincronizadas com a estrutura das tabelas. Essa abordagem proporciona maior consistência na manipulação das informações e suporte à verificação de tipos durante o desenvolvimento.

### Estrutura de Tabelas (PostgreSQL)

- **`public.profiles`:** Armazena dados cadastrais dos usuários (`id`, `full_name`, `created_at`), vinculados à tabela `auth.users`.
- **`public.user_roles`:** Tabela isolada para controle de privilégios (`user_id`, `role`), com valores restritos ao enum (`paciente`, `medico`). Evita que metadados editáveis pelo usuário sejam utilizados para adulterar privilégios.
- **`public.appointments`:** Registra as consultas (`id`, `patient_id`, `specialty`, `preferred_date`, `reason`, `status`, `created_at`, `updated_at`), utilizando o enum (`pendente`, `confirmada`, `concluida`).
- **`public.messages`:** Registra as mensagens trocadas no chat por consulta (`id`, `appointment_id`, `sender_id`, `content`, `created_at`).
- **`public.notifications`:** Armazena as notificações dos usuários (`id`, `user_id`, `appointment_id`, `title`, `body`, `read`, `created_at`).

### Segurança e Controle de Acesso (Row Level Security - RLS)

Todas as cinco tabelas do schema público possuem Row Level Security (RLS) ativado. As requisições realizadas por meio da API do Supabase com credenciais de cliente estão sujeitas à camada de autorização do PostgreSQL, que controla o acesso aos registros conforme as políticas definidas para cada tabela.

As principais regras de acesso implementadas são:

- **Isolamento de Pacientes:** Pacientes conseguem visualizar (`SELECT`) e criar (`INSERT`) exclusivamente consultas vinculadas ao seu próprio `auth.uid()`, respeitando também as condições definidas para a criação de solicitações, como o status inicial `pendente` e a role `paciente`.
- **Acesso Médico:** Usuários com a role `medico`, validada por meio da função `has_role(auth.uid(), 'medico')`, possuem permissão para visualizar as solicitações e atualizar seus status.
- **Privacidade do Chat:** As operações de leitura e envio de mensagens são protegidas pela função `can_access_appointment(auth.uid(), appointment_id)`, permitindo o acesso ao paciente proprietário da consulta ou a usuários com a role `medico`.
- **Proteção de Notificações:** As operações de leitura (`SELECT`), atualização (`UPDATE`) e exclusão (`DELETE`) são restritas às notificações vinculadas ao `auth.uid()` do usuário autenticado.
- **Proteção de Perfis:** Os usuários podem consultar o próprio perfil, enquanto profissionais com a role `medico` também podem visualizar perfis de pacientes. A atualização de perfis é restrita ao próprio usuário.
- **Proteção de Papéis:** A tabela `user_roles` possui política de leitura restrita ao próprio usuário autenticado, sem políticas públicas de inserção ou atualização, evitando a autoatribuição de privilégios pelo cliente.

### Funções do Banco de Dados

A aplicação utiliza funções em PL/pgSQL para centralizar verificações de permissões e controlar o acesso aos registros.

- **`public.has_role(_user_id uuid, _role app_role)`:** Verifica se determinado usuário possui uma função específica cadastrada na tabela `user_roles`.

- **`public.can_access_appointment(_user_id uuid, _appointment_id uuid)`:** Verifica se o usuário possui a role `medico` ou se é o paciente proprietário da consulta. Essa função é utilizada nas políticas de acesso às mensagens.

- **`public.notify_doctors`:** Função responsável por disparar notificações automáticas aos profissionais de saúde quando novas solicitações de consulta são recebidas.

As funções de verificação de permissões utilizam mecanismos do PostgreSQL para realizar consultas controladas às informações de usuários, papéis e consultas.

---

## Estrutura de Pastas

```text
├── src/
│   ├── components/            # Componentes reutilizáveis (AppointmentChat, NotificationBell, StatusBadge, UI)
│   ├── integrations/          # Cliente Supabase, tipos gerados e middlewares de autenticação
│   ├── lib/                   # Utilitários, regras de agendamento e tradução de erros de autenticação
│   ├── routes/                # Rotas do TanStack Router
│   │   ├── __root.tsx         # Layout raiz, provedores e cabeçalho global
│   │   ├── index.tsx          # Página inicial, login, cadastro e recuperação de senha
│   │   ├── painel.tsx         # Painel principal integrado (Visão Paciente e Visão Médico)
│   │   └── reset-password.tsx # Página de definição de nova senha pós-recuperação
│   ├── test/                  # Testes automatizados (roteamento e validações)
│   ├── router.tsx             # Instância e configuração do TanStack Router
│   └── styles.css             # Tema global e variáveis do Tailwind CSS v4
├── public/                    # Favicons e manifestos estáticos
├── supabase/                  # Configurações do ambiente de banco
└── package.json               # Dependências e scripts do projeto
```

---

## Considerações sobre o Projeto

O Saúde Simples foi desenvolvido como parte de uma atividade acadêmica de extensão, buscando aplicar conhecimentos de Engenharia de Software na construção de uma solução tecnológica voltada à organização do atendimento em saúde.

O projeto contempla funcionalidades de gerenciamento de consultas, comunicação entre pacientes e profissionais e controle de acesso aos dados, utilizando tecnologias modernas de desenvolvimento web e recursos de segurança disponibilizados pelo Supabase.

A aplicação também foi apresentada à comunidade, permitindo demonstrar suas funcionalidades e coletar percepções sobre sua utilização.

---

## Links do Projeto

- **Aplicação funcional:** [Acessar Saúde Simples](https://saude-simples.lovable.app/)
- **Código-fonte:** [Acessar repositório no GitHub](https://github.com/rafaelpontes14/saude-simples)


## Autor

Desenvolvido por **Rafael Fernandes Pontes** como parte da Atividade Extensionista III do curso de Bacharelado em Engenharia de Software.

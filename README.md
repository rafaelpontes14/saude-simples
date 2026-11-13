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
- Implementar canal de comunicação direta e segura (chat por consulta) entre médico e paciente.
- Implementar autenticação robusta e controle de acesso estrito conforme os perfis dos usuários (RBAC + RLS).
- Garantir a persistência e a integridade das informações em banco de dados relacional com políticas de segurança ativas.

---

## Funcionalidades Principais

- **Autenticação e Segurança:**
  - Cadastro e login de usuários via Supabase Auth.
  - Fluxo de recuperação de senha por e-mail (*Esqueci minha senha*).
  - Validação de senhas com mensagens de erro traduzidas e localizadas para Português (pt-BR).
  - Controle de perfis (*Role-Based Access Control*): pacientes por padrão no cadastro; perfil médico atribuído de forma protegida no banco.

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
  - [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router) (Roteamento baseado em arquivos com SSR/tipagem estrita)
  - [TanStack Query](https://tanstack.com/query) (Gerenciamento de estado assíncrono e cache)
  - [Tailwind CSS v4](https://tailwindcss.com/) (Estilização utilitária e responsiva)
  - [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
  - [Lucide React](https://lucide.dev/) (Ícones)
  - [Sonner](https://sonner.emilkowal.ski/) (Notificações em toast)
  - [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Validação de formulários)

- **Back-end e Banco de Dados (BaaS):**
  - [Supabase / Lovable Cloud](https://supabase.com/)
  - [PostgreSQL](https://www.postgresql.org/) (Banco de dados relacional)
  - **Row Level Security (RLS)** para autorização nativa no banco
  - **Supabase Realtime** (WebSockets para chat e notificações instantâneas)
  - Funções `SECURITY DEFINER` em PL/pgSQL (`has_role`, `can_access_appointment`)

- **Qualidade e Testes:**
  - [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (Testes automatizados unitários e de rotas)
  - [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) (Padronização e formatação de código)

---

## Arquitetura e Banco de Dados

A aplicação utiliza uma arquitetura baseada em microsserviços integrados via BaaS (*Backend-as-a-Service*), onde o front-end consome diretamente o PostgreSQL via cliente autenticado do Supabase, com validação de tipos de ponta a ponta gerados automaticamente pelo schema.

### Estrutura de Tabelas (PostgreSQL)

- **`public.profiles`:** Armazena dados cadastrais dos usuários (`id`, `full_name`, `email`, `created_at`, `updated_at`), vinculados ao `auth.users`.
- **`public.user_roles`:** Tabela isolada para controle de privilégios (`user_id`, `role`), com valores restritos ao enum (`paciente`, `medico`). Evita que metadados editáveis pelo usuário adulterem privilégios.
- **`public.appointments`:** Registra as consultas (`id`, `patient_id`, `doctor_id`, `specialty`, `scheduled_for`, `reason`, `status`, `created_at`, `updated_at`, `completed_at`), utilizando o enum (`pendente`, `confirmada`, `concluida`).
- **`public.messages`:** Registra as mensagens trocadas no chat por consulta (`id`, `appointment_id`, `sender_id`, `content`, `created_at`).
- **`public.notifications`:** Fila de notificações dos usuários (`id`, `user_id`, `appointment_id`, `title`, `message`, `read`, `created_at`).

### Segurança e Controle de Acesso (Row Level Security - RLS)

Todas as tabelas do schema público possuem RLS ativado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), garantindo que nenhuma requisição acesse dados sem política explícita:

- **Isolamento de Pacientes:** Pacientes conseguem visualizar (`SELECT`) e criar (`INSERT`) exclusivamente consultas vinculadas ao seu próprio `auth.uid()`.
- **Acesso Médico:** Usuários com a role `medico` validada via função `has_role('medico')` têm permissão para ler consultas e atualizar seus status.
- **Privacidade do Chat e Notificações:** Mensagens e notificações são blindadas pela função `can_access_appointment(appointment_id)`, garantindo que apenas o paciente dono da consulta ou o médico autorizado leiam ou enviem mensagens.

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

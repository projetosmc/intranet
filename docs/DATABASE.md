# Arquitetura do Banco de Dados - MC Hub

Este documento descreve a arquitetura do banco de dados do sistema MC Hub, incluindo convenções de nomenclatura, estrutura das tabelas e políticas de segurança.

## Convenções de Nomenclatura

### Prefixos de Tabelas
| Prefixo | Descrição |
|---------|-----------|
| `tab_` | Tabelas de dados |

### Prefixos de Colunas
| Prefixo | Tipo | Descrição |
|---------|------|-----------|
| `cod_` | UUID | Chave primária |
| `seq_` | UUID | Chave estrangeira (FK) |
| `des_` | TEXT | Campos de texto/descrição |
| `ind_` | BOOLEAN | Indicadores (sim/não) |
| `num_` | INTEGER | Campos numéricos |
| `dta_` | DATE/TIMESTAMP | Campos de data |
| `hra_` | TIME | Campos de hora |

---

## Tabelas do Sistema

### tab_perfil_usuario
Perfis de usuários do sistema.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_usuario` | UUID | Não | - | PK - Referência ao auth.users |
| `des_nome_completo` | TEXT | Sim | NULL | Nome completo |
| `des_email` | TEXT | Sim | NULL | E-mail |
| `des_avatar_url` | TEXT | Sim | NULL | URL do avatar |
| `des_unidade` | TEXT | Sim | NULL | Unidade/setor |
| `des_departamento` | TEXT | Sim | NULL | Departamento |
| `des_cargo` | TEXT | Sim | NULL | Cargo |
| `des_telefone` | TEXT | Sim | NULL | Telefone |
| `des_ad_object_id` | TEXT | Sim | NULL | ID do Active Directory |
| `dta_aniversario` | DATE | Sim | NULL | Data de aniversário |
| `dta_sincronizacao_ad` | TIMESTAMP | Sim | NULL | Última sincronização AD |
| `ind_ativo` | BOOLEAN | Sim | true | Usuário ativo |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Usuários podem inserir/atualizar próprio perfil
- Todos podem visualizar perfis

---

### tab_usuario_role
Roles/permissões dos usuários.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_usuario_role` | UUID | Não | gen_random_uuid() | PK |
| `seq_usuario` | UUID | Não | - | FK para usuário |
| `des_role` | app_role | Não | - | Role (admin/moderator/user) |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |

**Enum app_role:** `'admin' | 'moderator' | 'user'`

**RLS:**
- Admins podem gerenciar todos os roles
- Usuários podem ver próprios roles

---

### tab_comunicado
Comunicados e anúncios do sistema.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_comunicado` | UUID | Não | gen_random_uuid() | PK |
| `des_titulo` | TEXT | Não | - | Título |
| `des_resumo` | TEXT | Não | - | Resumo breve |
| `des_conteudo` | TEXT | Não | - | Conteúdo completo (markdown) |
| `des_tipo_template` | TEXT | Sim | 'simple' | Tipo: simple/banner/poll |
| `des_imagem_url` | TEXT | Sim | NULL | URL da imagem (banner) |
| `des_tipo_enquete` | TEXT | Sim | NULL | Tipo enquete: single/multiple |
| `ind_ativo` | BOOLEAN | Sim | true | Comunicado ativo |
| `ind_fixado` | BOOLEAN | Sim | false | Fixado no topo |
| `dta_publicacao` | TIMESTAMP | Sim | now() | Data de publicação |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar comunicados
- Usuários autenticados podem ver ativos

---

### tab_enquete_opcao
Opções de enquetes/votações.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_opcao` | UUID | Não | gen_random_uuid() | PK |
| `seq_comunicado` | UUID | Não | - | FK para tab_comunicado |
| `des_texto_opcao` | TEXT | Não | - | Texto da opção |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |

**RLS:**
- Todos podem visualizar opções
- Usuários autenticados podem gerenciar

---

### tab_enquete_voto
Votos em enquetes.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_voto` | UUID | Não | gen_random_uuid() | PK |
| `seq_opcao` | UUID | Não | - | FK para tab_enquete_opcao |
| `seq_usuario` | UUID | Não | - | ID do usuário que votou |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data do voto |

**RLS:**
- Usuários podem votar (auth.uid() = seq_usuario)
- Usuários podem remover próprio voto
- Todos podem ver contagem de votos

---

### tab_evento_calendario
Eventos do calendário.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_evento` | UUID | Não | gen_random_uuid() | PK |
| `des_titulo` | TEXT | Não | - | Título do evento |
| `des_descricao` | TEXT | Sim | NULL | Descrição |
| `des_tipo_evento` | TEXT | Sim | 'general' | Tipo do evento |
| `dta_evento` | DATE | Não | - | Data do evento |
| `seq_criado_por` | UUID | Sim | NULL | Usuário criador |
| `dta_cadastro` | TIMESTAMP | Não | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Não | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar eventos
- Usuários autenticados podem visualizar

---

### tab_menu_item
Itens do menu de navegação.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_menu_item` | UUID | Não | gen_random_uuid() | PK |
| `des_nome` | TEXT | Não | - | Nome do item |
| `des_caminho` | TEXT | Não | - | Caminho/URL |
| `des_icone` | TEXT | Sim | 'Circle' | Ícone (Lucide) |
| `seq_menu_pai` | UUID | Sim | NULL | FK para item pai |
| `num_ordem` | INTEGER | Sim | 0 | Ordem de exibição |
| `ind_admin_only` | BOOLEAN | Sim | false | Apenas para admins |
| `ind_nova_aba` | BOOLEAN | Sim | false | Abrir em nova aba |
| `ind_ativo` | BOOLEAN | Sim | true | Item ativo |
| `dta_cadastro` | TIMESTAMP | Não | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Não | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar itens
- Todos podem visualizar itens ativos

---

### tab_sistema
Sistemas para monitoramento de status.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_sistema` | UUID | Não | gen_random_uuid() | PK |
| `des_nome` | TEXT | Não | - | Nome do sistema |
| `des_status` | TEXT | Não | 'operational' | Status atual |
| `num_ordem` | INTEGER | Sim | 0 | Ordem de exibição |
| `ind_ativo` | BOOLEAN | Sim | true | Sistema ativo |
| `dta_ultima_verificacao` | TIMESTAMP | Sim | now() | Última verificação |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar sistemas
- Usuários autenticados podem ver ativos

---

### tab_faq
Perguntas frequentes.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_faq` | UUID | Não | gen_random_uuid() | PK |
| `des_pergunta` | TEXT | Não | - | Pergunta |
| `des_resposta` | TEXT | Não | - | Resposta |
| `num_ordem` | INTEGER | Sim | 0 | Ordem de exibição |
| `ind_ativo` | BOOLEAN | Sim | true | FAQ ativo |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar FAQs
- Usuários autenticados podem ver ativos

---

### tab_sala_reuniao
Salas de reunião disponíveis.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_sala` | UUID | Não | gen_random_uuid() | PK |
| `des_nome` | TEXT | Não | - | Nome da sala |
| `num_capacidade` | INTEGER | Não | 10 | Capacidade máxima |
| `des_roles_permitidos` | TEXT[] | Sim | ['all'] | Roles que podem reservar |
| `num_ordem` | INTEGER | Sim | 0 | Ordem de exibição |
| `ind_ativo` | BOOLEAN | Sim | true | Sala ativa |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar salas
- Usuários autenticados podem ver ativas

---

### tab_tipo_reuniao
Tipos de reunião para reservas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_tipo_reuniao` | UUID | Não | gen_random_uuid() | PK |
| `des_nome` | TEXT | Não | - | Nome do tipo |
| `num_ordem` | INTEGER | Sim | 0 | Ordem de exibição |
| `ind_ativo` | BOOLEAN | Sim | true | Tipo ativo |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar tipos
- Usuários autenticados podem ver ativos

---

### tab_reserva_sala
Reservas de salas de reunião.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_reserva` | UUID | Não | gen_random_uuid() | PK |
| `seq_sala` | UUID | Não | - | FK para tab_sala_reuniao |
| `seq_usuario` | UUID | Não | - | Usuário que reservou |
| `seq_tipo_reuniao` | UUID | Sim | NULL | FK para tab_tipo_reuniao |
| `des_nome_solicitante` | TEXT | Não | - | Nome do solicitante |
| `des_observacao` | TEXT | Sim | NULL | Observações |
| `num_participantes` | INTEGER | Sim | 1 | Número de participantes |
| `dta_reserva` | DATE | Não | - | Data da reserva |
| `hra_inicio` | TIME | Não | - | Hora de início |
| `hra_fim` | TIME | Não | - | Hora de término |
| `ind_notificado` | BOOLEAN | Sim | false | Notificação enviada |
| `dta_cadastro` | TIMESTAMP | Sim | now() | Data de criação |
| `dta_atualizacao` | TIMESTAMP | Sim | now() | Data de atualização |

**RLS:**
- Admins podem gerenciar todas as reservas
- Usuários podem criar/editar/deletar próprias reservas
- Todos podem visualizar reservas

---

### tab_log_auditoria
Logs de auditoria do sistema.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `cod_log` | UUID | Não | gen_random_uuid() | PK |
| `seq_usuario` | UUID | Sim | NULL | Usuário que realizou ação |
| `seq_usuario_alvo` | UUID | Sim | NULL | Usuário afetado |
| `des_acao` | TEXT | Não | - | Ação realizada |
| `des_tipo_entidade` | TEXT | Não | - | Tipo da entidade |
| `des_id_entidade` | TEXT | Sim | NULL | ID da entidade |
| `des_valor_anterior` | JSONB | Sim | NULL | Valor anterior |
| `des_valor_novo` | JSONB | Sim | NULL | Novo valor |
| `des_user_agent` | TEXT | Sim | NULL | User agent |
| `des_ip` | TEXT | Sim | NULL | Endereço IP |
| `dta_cadastro` | TIMESTAMP | Não | now() | Data do registro |

**RLS:**
- Admins podem visualizar logs
- Sistema pode inserir logs (usuário autenticado)

---

## Funções do Banco

### has_role(_user_id UUID, _role app_role)
Verifica se um usuário possui determinada role.

```sql
SELECT has_role(auth.uid(), 'admin'::app_role);
```

### handle_new_user()
Trigger function que cria perfil automaticamente ao criar usuário.

### setup_first_admin(admin_user_id UUID)
Configura o primeiro admin do sistema.

---

## Storage Buckets

| Bucket | Público | Descrição |
|--------|---------|-----------|
| `announcements` | Sim | Imagens de banners/comunicados |

---

## Diagrama de Relacionamentos

```
auth.users
    │
    ├──< tab_perfil_usuario (1:1)
    │
    └──< tab_usuario_role (1:N)

tab_comunicado
    │
    └──< tab_enquete_opcao (1:N)
            │
            └──< tab_enquete_voto (1:N)

tab_sala_reuniao
    │
    └──< tab_reserva_sala (1:N)
            │
            └──> tab_tipo_reuniao (N:1)
```

---

## Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 2025-12-29 | 1.0.0 | Migração para nova nomenclatura (tab_, cod_, des_, ind_, num_, dta_, hra_, seq_) |

---

*Última atualização: 29/12/2025*

# LogiPilot TCC

Versão do LogiPilot reconstruída em **React + JavaScript puro** (sem TypeScript) no front-end e
**Spring Boot + MySQL** no back-end, seguindo a arquitetura e os conceitos do curso: Vite,
`react-router-dom` (HashRouter), Bootstrap 5, CSS Modules e Axios do lado do navegador; Spring MVC,
Spring Data JPA, Flyway e Spring Security (BCrypt) do lado do servidor. O diagnóstico é gerado por uma
chamada real à API da Groq através de um pequeno servidor Express dedicado. A aplicação também possui
uma landing page responsiva para apresentação da solução.

Esta é uma reconstrução educacional do projeto original `logipilot/` (Next.js + TypeScript + Supabase),
mantendo o mesmo propósito e as funcionalidades essenciais, mas usando a stack ensinada em aula.

## Stack

- React + Vite (JavaScript, `.jsx`)
- react-router-dom (`HashRouter`)
- Bootstrap 5 + CSS Modules
- Axios
- **Spring Boot 3.5 (Java 21)** — API REST de usuários, clientes, projetos, entregas e análises
- **MySQL 8+** com **Flyway** (esquema versionado em SQL) e **Spring Data JPA**
- **Spring Security** apenas para o BCrypt das senhas e o CORS
- Express + Groq (servidor dedicado para a análise multimodal, o chat e a otimização de rota)

## Pré-requisitos

| O quê | Versão | Instalação no macOS |
|---|---|---|
| Node | 20+ | `brew install node` |
| JDK | 21 | `brew install openjdk@21` |
| Maven | 3.9+ | `brew install maven` (o projeto também traz o `mvnw`) |
| MySQL | 8+ | `brew install mysql && brew services start mysql` |

> O JDK do Homebrew é *keg-only* e não entra no PATH do sistema. O script `backend/iniciar.sh`
> resolve o `JAVA_HOME` sozinho, então não é preciso configurar nada à mão.

### Banco de dados

Crie o banco e o usuário uma única vez:

```sql
CREATE DATABASE logipilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'logipilot'@'localhost' IDENTIFIED BY 'logipilot';
GRANT ALL PRIVILEGES ON logipilot.* TO 'logipilot'@'localhost';
```

As **tabelas não precisam ser criadas à mão**: na primeira subida da API o Flyway executa os scripts de
`backend/src/main/resources/db/migration` e cria tudo, já com os dados iniciais. Para apontar para outro
banco, use as variáveis `DB_HOST`, `DB_PORTA`, `DB_NOME`, `DB_USUARIO` e `DB_SENHA`.

## Como rodar

O projeto precisa de **três processos rodando ao mesmo tempo**, em três terminais (ou usando `npm run dev:all`):

```bash
npm install

# Terminal 1 - front-end (Vite, porta 5173)
npm run dev

# Terminal 2 - API REST (Spring Boot, porta 8080)
npm run api

# Terminal 3 - servidor de IA (Groq, porta 3333)
npm run ia
```

Ou tudo de uma vez:

```bash
npm run dev:all
```

Acesse `http://localhost:5173`. O Vite faz o proxy de `/api` para o Spring, então o front-end nunca
precisa saber a porta do back-end.

Para usar o diagnóstico pela Groq, copie `server/.env.example` para `server/.env` e coloque sua chave
(gerada em [console.groq.com/keys](https://console.groq.com/keys)):

```bash
cp server/.env.example server/.env
```

Sem a chave, o servidor continua funcionando e gera um diagnóstico local determinístico a partir da série
numérica encontrada nos arquivos. Isso permite demonstrar o fluxo completo sem depender de um serviço externo.

## Acesso

O primeiro acesso é criado pela tela de **Criar conta**, que cadastra o **gestor** da operação. Os demais
perfis (operador e motorista) são cadastrados depois pelo gestor, em **Dashboard → Acessos** — onde também
é possível trocar a senha de um acesso existente.

A senha trafega em texto apenas entre o navegador e o servidor; no banco fica **somente o hash BCrypt**
(com salt), gerado pelo `BCryptPasswordEncoder` do Spring Security. A API nunca devolve esse hash: o DTO
`UsuarioResposta` simplesmente não tem o campo.

> Os acessos que vieram do `db.json` foram recriados pela migração com a mesma senha de desenvolvimento
> que já valia lá (`123456`). **Troque essa senha em Dashboard → Acessos antes de qualquer uso real.**

## O back-end Spring

```
backend/
  pom.xml
  iniciar.sh                    resolve o JAVA_HOME e chama o Maven Wrapper
  ferramentas/
    migrar-db-json.py           gerou o script de dados a partir do antigo db.json
  src/main/java/br/com/logipilot/
    dominio/                    entidades JPA (Usuario, Cliente, Projeto, Entrega, Analise)
    repositorio/                interfaces Spring Data
    servico/                    regras de negócio e exceções
    web/                        controllers REST, DTOs e o tratador de erros
    config/                     BCrypt, CORS e a cadeia de filtros do Security
  src/main/resources/
    application.yml
    db/migration/
      V1__esquema.sql           DDL das tabelas
      V2__dados_iniciais.sql    dados migrados do db.json
```

### Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/auth/login` | Confere e-mail e senha; devolve o usuário sem o hash |
| `GET/POST/PUT/DELETE` | `/usuarios` | Acessos. Aceita `?email=` e `?papel=` |
| `GET/POST/PUT/DELETE` | `/clientes` | Cadastro de clientes |
| `GET/POST/PUT/DELETE` | `/projetos` | Projetos. Aceita `?clienteId=` |
| `GET/POST/PATCH/DELETE` | `/entregas` | Entregas. Aceita `?motoristaId=` e `?data=` |
| `GET/POST/DELETE` | `/analises` | Análises. Aceita `?criadoPorId=` |

O `PATCH /entregas/{id}` é a atualização parcial usada em dois momentos: quando o motorista fecha a parada
(status, observações e horário) e quando a otimização de rota reescreve só o campo `ordem`.

Erros saem sempre no formato `{"erro": "..."}` — 400 para validação, 401 para login, 404 para id inexistente
e 409 para conflito (e-mail repetido, cliente com projeto ligado, ausência sem observação).

### Modelagem

O que no `db.json` era campo repetido virou chave estrangeira:

| Tabela | Referências |
|---|---|
| `projeto` | `cliente_id` → `cliente` |
| `entrega` | `motorista_id` → `usuario`, `cliente_id` → `cliente` |
| `analise` | `projeto_id` → `projeto`, `criado_por_id` → `usuario` |

O retorno da IA (`serie_temporal`, `fontes`, `resultado`) não tem forma fixa, então fica em **colunas JSON**
do MySQL em vez de virar dezenas de tabelas. O Hibernate sobe com `ddl-auto: validate`: quem cria o esquema
é o Flyway, e o JPA apenas confere se as entidades batem com as tabelas — divergência derruba a aplicação
na subida, em vez de dar erro só na primeira consulta.

### Testes

```bash
cd backend && ./mvnw test
```

São testes de unidade com Mockito, sem banco: cobrem a autenticação (senha certa, senha errada, e-mail
inexistente) e as regras das entregas (posição na rota, janela invertida, entrega designada a quem não é
motorista, ausência sem observação, desfazer e reordenação).

## Clientes, projetos e entregas

O cadastro de **clientes** fica em **Dashboard → Clientes** (só o gestor acessa) e guarda nome, documento,
responsável, contato, endereço de entrega e cidade. Um cliente com projeto ligado não pode ser excluído.

O **projeto** não tem mais campo livre de cliente: em *Cadastro de Projeto* o cliente é escolhido num
`select` alimentado pelos clientes cadastrados, e o endereço dele aparece como apoio logo abaixo.

O **motorista entra sempre com a página vazia**. Quem monta a rota é o operador, em
**Operador → Motoristas → Designar entregas**, informando cliente (o endereço vem preenchido do cadastro
e pode ser ajustado), cidade, janela de entrega, distância estimada, prioridade, data e instruções.
Na mesma tela o operador acompanha a rota do dia, o status de cada parada e as observações escritas
pelo motorista.

### Página do motorista

Os KPIs não são mais estimativas: todos saem das entregas registradas no dia (`src/services/entregas.js`).

| KPI | Como é calculado |
|---|---|
| Entregas registradas | paradas concluídas sobre o total designado |
| Pontualidade | entregas marcadas como "Entregue" dentro da janela ÷ total de entregues |
| Km rodados | soma da distância das paradas visitadas, inclusive as sem ninguém no local |
| Pendentes | paradas que ainda não foram registradas |

Ao registrar uma parada o motorista escolhe o desfecho — **Entregue** ou **Não havia ninguém no local**
(neste caso a observação é obrigatória) — e pode escrever observações em qualquer um dos dois. Cada parada
tem link para abrir o endereço no mapa e pode ser desfeita caso o registro tenha sido errado.

### Otimizar entregas

O botão **Otimizar entregas** envia as paradas pendentes para `POST /otimizar-rota` (servidor da Groq) e
recebe a sequência em que o motorista deve visitá-las, junto com a justificativa. A IA agrupa endereços da
mesma região, respeita as janelas que fecham mais cedo e põe a prioridade alta na frente.

A resposta só é aceita se trouxer exatamente os mesmos ids enviados, sem repetir nem perder parada. Sem a
chave da Groq — ou se a IA devolver uma sequência inválida — a ordem vem do cálculo determinístico em
`server/rotaLocal.js`, então o botão nunca deixa o motorista sem resposta.

## Análise multimodal

Em "Nova Análise" é possível enviar **vários arquivos de uma vez**, de formatos diferentes, e ainda
escrever um contexto em texto livre. Formatos aceitos:

| Formato | Extensões | Como é lido |
|---|---|---|
| Excel | `.xlsx` `.xlsm` | O arquivo é um zip de XML; as células e os textos compartilhados são lidos direto |
| CSV | `.csv` `.tsv` | Texto, com detecção automática do separador |
| PDF | `.pdf` | Extração de texto via `pdf-parse` |
| PowerPoint | `.pptx` | Textos de cada slide, lidos do XML |
| Word | `.docx` | Parágrafos lidos do XML |
| Imagens e prints | `.png` `.jpg` `.jpeg` `.webp` | Enviados a um modelo de visão, que transcreve os números |
| Texto | `.txt` `.md` | Texto direto |
| Power BI / exportações | `.json` `.xml` | Texto direto |

Planilhas grandes não são enviadas inteiras para a IA. O módulo `server/resumo.js` detecta tabelas e envia
cabeçalho, uma amostra de linhas e as **estatísticas de cada coluna numérica calculadas sobre todas as
linhas** (soma, média, mediana, mínimo e máximo). Isso mantém os números corretos e cabe no limite de tokens
do modelo.

## O que a análise devolve

- **Resumo executivo** — visão geral, período e destaques
- **Dashboard** — gráfico gerado a partir da série numérica encontrada
- **Diagnóstico** — score de saúde operacional, fatos observados e hipóteses (separados)
- **Gargalos** — classificados por severidade, com evidência e impacto
- **Oportunidades** — com impacto potencial e esforço
- **Plano de ação** — priorizado, com prazo e resultado esperado
- **Previsão** — regressão linear + média móvel, calculada localmente, sem IA
- **Chat com os dados** — perguntas sobre a análise já gerada

## Estrutura

```
src/
  components/    CredentialUser, Modal, Sidebar, StatCard, Grafico
  pages/         uma pasta por página, com o .jsx e o .module.css
  routes/        AppRoutes.jsx
  services/      api, iaApi, sessao, arquivos, previsao, formatadores, entregas
server/            (Node — só a IA)
  index.js           rotas /analisar, /perguntar e /otimizar-rota
  extratores.js      leitura de cada formato
  resumo.js          resumo estatístico de tabelas grandes
  diagnosticoLocal.js  diagnóstico sem IA e detecção da série temporal
  rotaLocal.js       sequência de rota sem IA
  prompts.js         instruções enviadas ao modelo
backend/           (Java — API REST e banco)
db.json            arquivo do antigo json-server; fica no repositório apenas
                   como origem da migração para o MySQL, não é mais lido em execução
```

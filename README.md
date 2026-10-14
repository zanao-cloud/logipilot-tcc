# LogiPilot TCC

Versão do LogiPilot reconstruída em **React + JavaScript puro** (sem TypeScript) no front-end e
**Spring Boot + Microsoft SQL Server** no back-end, seguindo a arquitetura e os conceitos do curso: Vite,
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
- **Microsoft SQL Server** com **Flyway** (esquema versionado em T-SQL) e **Spring Data JPA**
- **Spring Security** apenas para o BCrypt das senhas e o CORS
- Express + Groq (servidor dedicado para a análise multimodal, o chat e a otimização de rota)

## Para avaliação

O projeto não roda só com `npm install && npm run dev`: além do front-end em React, ele tem uma API
própria em Java e um banco SQL Server. São **quatro coisas para instalar** e **três processos para
subir**. O caminho mais curto, do zero:

```bash
# 1. Ferramentas (macOS; no Windows, ver a seção do banco mais abaixo)
brew install node openjdk@21 maven colima docker sqlcmd

# 2. Banco: sobe o container do SQL Server
colima start --vm-type=vz --vz-rosetta --cpu 4 --memory 6
docker run -d --name logipilot-sqlserver \
  -e "ACCEPT_EULA=1" -e "MSSQL_SA_PASSWORD=LogiPilot!2026" \
  -p 1433:1433 --restart unless-stopped \
  mcr.microsoft.com/azure-sql-edge:latest

# 3. Cria o banco e o login (uma vez só)
sqlcmd -S localhost,1433 -U sa -P 'LogiPilot!2026' -N disable -Q "
CREATE DATABASE logipilot;
CREATE LOGIN logipilot WITH PASSWORD = 'LogiPilot!2026', CHECK_POLICY = OFF;"
sqlcmd -S localhost,1433 -U sa -P 'LogiPilot!2026' -N disable -d logipilot -Q "
CREATE USER logipilot FOR LOGIN logipilot;
ALTER ROLE db_owner ADD MEMBER logipilot;"

# 4. Projeto
npm install
npm run dev:all
```

Abra `http://localhost:5173`. As tabelas e os dados iniciais são criados sozinhos pelo Flyway na
primeira subida da API — não há script para rodar à mão.

**Acesso para teste:** qualquer um dos cadastros abaixo, senha `123456`.

| Perfil | E-mail | O que ele vê |
|---|---|---|
| Gestor | `joaozanao7@gmail.com` | Painel com indicadores, clientes, projetos, acessos e as análises |
| Operador | `th1@gmail.com` | Designação de entregas, etiquetas e reagendamentos |
| Motorista | `th@gmail.com` | Rota do dia, conferência de carga e registro das entregas |

**O que dá para testar sem a chave da IA:** tudo, menos a qualidade do texto gerado. Sem a chave da Groq
em `server/.env`, as rotas de análise e de otimização continuam respondendo — o servidor cai num cálculo
local determinístico (`server/diagnosticoLocal.js`, `server/rotaLocal.js`, `server/operacaoLocal.js`).

**Onde está cada coisa:** o front-end em React está em `src/` e segue a estrutura vista em aula
(`pages/<Nome>/<Nome>.jsx`, `components/`, `services/api.js`, `routes/AppRoutes.jsx`). A API em Java está
em `backend/`. O servidor de IA está em `server/`. O documento `GUIA_DE_DEFESA.md` explica, peça por peça,
o que foi além do material da disciplina e por quê.

## Pré-requisitos

| O quê | Versão | Instalação no macOS |
|---|---|---|
| Node | 20+ | `brew install node` |
| JDK | 21 | `brew install openjdk@21` |
| Maven | 3.9+ | `brew install maven` (o projeto também traz o `mvnw`) |
| SQL Server | 2019+ | container — ver abaixo |

> O JDK do Homebrew é *keg-only* e não entra no PATH do sistema. O script `backend/iniciar.sh`
> resolve o `JAVA_HOME` sozinho, então não é preciso configurar nada à mão.

### Banco de dados

O SQL Server roda num container. **No Mac com chip Apple (M1–M4)** a Microsoft não publica
imagem ARM do SQL Server, e a imagem x86 não funciona nem sob emulação — ela aborta com
*"Invalid mapping of address ... in reserved address space"*. A saída é o **Azure SQL Edge**,
que é o mesmo motor e o mesmo T-SQL, com build ARM nativo:

```bash
brew install colima docker sqlcmd
colima start --vm-type=vz --vz-rosetta --cpu 4 --memory 6

docker run -d --name logipilot-sqlserver \
  -e "ACCEPT_EULA=1" -e "MSSQL_SA_PASSWORD=LogiPilot!2026" \
  -p 1433:1433 --restart unless-stopped \
  mcr.microsoft.com/azure-sql-edge:latest
```

Em **Windows ou Linux x86**, use a imagem oficial no lugar — o resto é idêntico:

```bash
docker run -d --name logipilot-sqlserver \
  -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=LogiPilot!2026" \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
```

Depois, crie o banco e o login da aplicação uma única vez:

```bash
sqlcmd -S localhost,1433 -U sa -P 'LogiPilot!2026' -N disable -Q "
CREATE DATABASE logipilot;
CREATE LOGIN logipilot WITH PASSWORD = 'LogiPilot!2026', CHECK_POLICY = OFF;"

sqlcmd -S localhost,1433 -U sa -P 'LogiPilot!2026' -N disable -d logipilot -Q "
CREATE USER logipilot FOR LOGIN logipilot;
ALTER ROLE db_owner ADD MEMBER logipilot;"
```

> `-N disable` desliga a criptografia da conexão. O certificado do container é autoassinado e o
> cliente moderno o rejeita; em desenvolvimento local, sem rede no meio, isso não é um problema.

As **tabelas não precisam ser criadas à mão**: na primeira subida da API o Flyway executa os scripts de
`backend/src/main/resources/db/migration` e cria tudo, já com os dados iniciais. Para apontar para outro
banco, use as variáveis `DB_HOST`, `DB_PORTA`, `DB_NOME`, `DB_SENHA` e `DB_USUARIO`.

> **Não edite uma migração que já rodou.** O Flyway guarda um checksum de cada script; mexer num arquivo
> já aplicado — mesmo que só num comentário — faz a API recusar subir com *"Migration checksum mismatch"*.
> Para mudar o esquema, crie um `V3__descricao.sql` novo. Se precisar mesmo corrigir um script antigo,
> rode o `repair` para reescrever o checksum:
>
> ```bash
> cd backend && ./mvnw org.flywaydb:flyway-maven-plugin:11.14.0:repair \
>   -Dflyway.url="jdbc:sqlserver://localhost:1433;databaseName=logipilot;encrypt=false;trustServerCertificate=true" \
>   -Dflyway.user=logipilot -Dflyway.password='LogiPilot!2026' \
>   -Dflyway.locations=filesystem:src/main/resources/db/migration
> ```

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

> Os acessos herdados das versões anteriores do banco usam a senha de desenvolvimento `123456`.
> **Troque em Dashboard → Acessos antes de qualquer uso real.**

### Esqueci minha senha

A tela de login tem **Esqueci minha senha**. Como o projeto não tem servidor de e-mail, a verificação é
feita pelo **telefone do cadastro**: informando e-mail e telefone que conferem, a pessoa define a senha
nova na hora.

⚠️ **Limitação conhecida, e deliberada:** quem souber o e-mail e o telefone de alguém consegue trocar a
senha dessa pessoa. Numa aplicação de verdade isso seria um link por e-mail com token que expira. A
escolha aqui foi por algo demonstrável sem depender de SMTP e de internet na hora da apresentação.
Quem não lembra o telefone cadastrado continua dependendo do gestor, em Dashboard → Acessos.

## Formatos do cadastro

Placa e telefone seguem o padrão brasileiro, para o cadastro não aceitar valor inventado. A regra é a
mesma em três camadas: máscara e aviso na tela (`src/services/formatos.js`), validação no serviço
(`dominio/Formatos.java`) e `CHECK` no banco — assim nem um `INSERT` feito direto no SQL Server passa com
dado fora do padrão. Como o SQL Server não tem expressão regular, o `CHECK` usa as classes de caracteres
do `LIKE`, com collation binária na placa para exigir maiúsculas.

| Campo | Aceita | Guardado como |
|---|---|---|
| Placa | Mercosul `ABC1D23` e antiga `ABC1234`, com ou sem traço, em qualquer caixa | `ABC1D23` (maiúsculas, sem separador) |
| Telefone | celular com DDD e 9 dígitos, fixo com DDD e 8, com ou sem máscara | `11939369341` (só dígitos) |
| CEP | 8 dígitos, com ou sem traço | `06454000` (só dígitos) |

O DDD precisa começar de 1 a 9 e o celular precisa ter o nono dígito, então `999999`, `01912345678` e
`11123456789` são recusados. A exibição volta formatada (`(11) 93936-9341`, `ABC-1234`). A placa só é
guardada para motoristas: ao mudar o papel do acesso, ela é descartada.

### Endereço do cliente

O endereço deixou de ser um texto solto. O cadastro pede **CEP, logradouro, número, complemento,
bairro, cidade e UF**, e o CEP preenche o resto sozinho: assim que os 8 dígitos ficam completos, o
formulário consulta o **ViaCEP** (`src/services/cep.js`) e preenche logradouro, bairro, cidade e UF.
Número e complemento continuam por conta de quem cadastra, porque o CEP não os informa.

O ViaCEP é público e não precisa de chave. Se ele não responder, ou se o CEP não existir, a tela avisa
e deixa preencher à mão — a consulta é uma conveniência, não uma dependência.

O campo `endereco` de uma linha continua existindo no banco, montado a partir de logradouro, número e
complemento. É ele que a entrega copia e que aparece nas listagens.

> Os clientes cadastrados antes dessa mudança ficaram com o endereço antigo no campo `logradouro` e
> sem CEP. Ao editar um deles, o formulário avisa e pede o CEP para completar.

## O back-end Spring

```
backend/
  pom.xml
  iniciar.sh                    resolve o JAVA_HOME e chama o Maven Wrapper
  src/main/java/br/com/logipilot/
    dominio/                    entidades JPA (Usuario, Cliente, Projeto, Entrega, Analise)
    repositorio/                interfaces Spring Data
    servico/                    regras de negócio e exceções
    web/                        controllers REST, DTOs e o tratador de erros
    config/                     BCrypt, CORS e a cadeia de filtros do Security
  src/main/resources/
    application.yml
    db/migration/
      V1__esquema.sql           DDL das tabelas, em T-SQL
      V2__dados_iniciais.sql    dados migrados do banco anterior
```

### Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/auth/login` | Confere e-mail e senha; devolve o usuário sem o hash |
| `GET/POST/PUT/DELETE` | `/usuarios` | Acessos. Aceita `?email=` e `?papel=` |
| `GET/POST/PUT/DELETE` | `/clientes` | Cadastro de clientes |
| `GET/POST/PUT/DELETE` | `/projetos` | Projetos. Aceita `?clienteId=` |
| `GET/POST/PATCH/DELETE` | `/entregas` | Entregas. Aceita `?motoristaId=` e `?data=` |
| `GET/POST/PUT/DELETE` | `/pacotes` | Estoque. Aceita `?status=em_estoque` |
| `POST` | `/auth/recuperar-senha` | Redefine a senha conferindo o telefone do cadastro |
| `GET` | `/entregas/reagendamento` | Fila de paradas ausentes ainda não reagendadas |
| `POST` | `/entregas/{id}/reagendar` | Cria a nova tentativa |
| `POST/GET` | `/entregas/{id}/comprovante` | Envia e devolve a foto do comprovante |
| `GET` | `/relatorios/entregas` | Indicadores do período (`?de=`, `?ate=`) |
| `GET/POST/DELETE` | `/analises` | Análises. Aceita `?criadoPorId=` |

O `PATCH /entregas/{id}` é a atualização parcial usada em dois momentos: quando o motorista fecha a parada
(status, observações e horário) e quando a otimização de rota reescreve só o campo `ordem`.

Erros saem sempre no formato `{"erro": "..."}` — 400 para validação, 401 para login, 404 para id inexistente
e 409 para conflito (e-mail repetido, cliente com projeto ligado, ausência sem observação).

### Modelagem

O que antes era campo de texto repetido virou chave estrangeira:

| Tabela | Referências |
|---|---|
| `projeto` | `cliente_id` → `cliente` |
| `entrega` | `motorista_id` → `usuario`, `cliente_id` → `cliente` |
| `analise` | `projeto_id` → `projeto`, `criado_por_id` → `usuario` |

O retorno da IA (`serie_temporal`, `fontes`, `resultado`) não tem forma fixa, então fica em
**NVARCHAR(MAX) com `CHECK (ISJSON(...) = 1)`** em vez de virar dezenas de tabelas — o SQL Server não tem
tipo JSON, mas valida e consulta JSON guardado em texto. O Hibernate sobe com `ddl-auto: validate`: quem cria o esquema
é o Flyway, e o JPA apenas confere se as entidades batem com as tabelas — divergência derruba a aplicação
na subida, em vez de dar erro só na primeira consulta.

### Testes

```bash
cd backend && ./mvnw test
```

São 43 testes de unidade, sem banco: cobrem a autenticação (senha certa, senha errada, e-mail
inexistente), as regras das entregas (posição na rota, janela invertida, entrega designada a quem não é
motorista, código de pacote repetido, ausência sem observação, desfazer e reordenação) e os formatos de
placa e telefone.

## Estoque de pacotes

O pacote existe **antes** da entrega. Em **Operador → Estoque** o volume dá entrada no galpão com a
identificação da etiqueta, o cliente destinatário, a quantidade de volumes e, opcionalmente, peso,
conteúdo e observações. Ele fica ali até alguém decidir para onde e com quem vai.

O ciclo é controlado pelo campo `status` e muda sozinho conforme a entrega anda:

| Status | Quando |
|---|---|
| `em_estoque` | deu entrada e ainda não foi designado |
| `designado` | entrou na rota de um motorista |
| `entregue` | a entrega foi concluída |

Desfazer o registro de uma entrega devolve o pacote para `designado`; **excluir** a entrega devolve
para `em_estoque`, a menos que outra entrega do mesmo pacote continue de pé — é o caso do
reagendamento, em que as duas tentativas apontam para o mesmo volume.

Enquanto está designado, o pacote não pode ser editado nem excluído: a entrega já registrou aquele
código e aquela quantidade, e mudar o cadastro deixaria a rota mentindo.

Na tela há busca por código, cliente ou conteúdo, filtro por situação e quatro indicadores — incluindo
quantos **volumes** estão parados, que é o número que interessa a quem olha o galpão. Cada item mostra
há quantos dias está ali.

## Clientes, projetos e entregas

O cadastro de **clientes** fica em **Dashboard → Clientes** (só o gestor acessa) e guarda nome, documento,
responsável, contato, endereço de entrega e cidade. Um cliente com projeto ligado não pode ser excluído.

O **projeto** não tem mais campo livre de cliente: em *Cadastro de Projeto* o cliente é escolhido num
`select` alimentado pelos clientes cadastrados, e o endereço dele aparece como apoio logo abaixo.

O **motorista entra sempre com a página vazia**. Quem monta a rota é o operador, em
**Operador → Motoristas → Designar entregas**, escolhendo um **pacote que está em estoque** — com busca
por código, cliente ou conteúdo — e informando cidade, janela de entrega, distância estimada,
prioridade, data e instruções. O código, os volumes e o endereço do destinatário vêm do pacote; o
endereço continua editável, porque a entrega pode ser numa filial.

A identificação do pacote é o que está escrito na etiqueta da caixa — é por ela que o motorista sabe qual
volume da van pertence a qual parada. O código é gravado em maiúsculas e **não pode se repetir na rota do
mesmo motorista no mesmo dia** (há um índice único em `motorista_id + data + codigo`); em datas diferentes
o mesmo código é aceito. Na tela do motorista ele aparece em destaque, em fonte monoespaçada, para não
confundir `0` com `O`.
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

### Conferência de carga

Antes de sair, o motorista marca cada pacote ao colocar na van — pelo checkbox ou **bipando o QR da
etiqueta** com a câmera. O painel mostra quantos faltam, então uma caixa esquecida aparece na garagem e
não na porta do cliente. A leitura usa a `BarcodeDetector` nativa do navegador; onde ela não existe
(Safari, por exemplo), o leitor avisa e aceita o código digitado.

### Etiquetas

Em **Designar entregas → Etiquetas** sai uma folha imprimível com uma etiqueta por parada: QR do código,
cliente, endereço, janela e número de volumes, na ordem da rota. É o mesmo código que o motorista lê no
aplicativo.

### Comprovante de entrega

Ao registrar uma entrega o motorista informa **quem recebeu** e pode anexar uma **foto** (canhoto assinado
ou fachada). A imagem fica no disco do servidor — `backend/comprovantes/`, configurável por
`COMPROVANTES_DIR` — e no banco guarda-se só o nome do arquivo; coluna com imagem incha o dump e deixa
qualquer consulta lenta. O operador vê o nome e a foto na rota do dia.

### Reagendamento

Toda parada fechada como "não havia ninguém no local" cai na fila de **Operador → Reagendamentos**. Ao
reagendar, o sistema cria uma **nova entrega** apontando para a original (`reagendada_de_id`): a tentativa
anterior continua no histórico, e dá para contar quantas visitas um pacote precisou. Um índice único
garante que a mesma tentativa não gere duas paradas.

### Otimizar entregas

O botão **Otimizar entregas** envia as paradas pendentes para `POST /otimizar-rota` (servidor da Groq) e
recebe a sequência em que o motorista deve visitá-las, junto com a justificativa. A IA agrupa endereços da
mesma região, respeita as janelas que fecham mais cedo e põe a prioridade alta na frente.

A resposta só é aceita se trouxer exatamente os mesmos ids enviados, sem repetir nem perder parada. Sem a
chave da Groq — ou se a IA devolver uma sequência inválida — a ordem vem do cálculo determinístico em
`server/rotaLocal.js`, então o botão nunca deixa o motorista sem resposta.

## Painel do gestor

O painel mostra os indicadores calculados sobre as entregas registradas — entregas no período,
pontualidade, ausências e km rodados — mais o desempenho por motorista e os clientes em que o motorista
mais encontrou a porta fechada. Tudo vem de `GET /relatorios/entregas?de=&ate=` (sem datas, os últimos
30 dias).

O botão **Analisar entregas com IA** fecha o ciclo entre os dois módulos do sistema: em vez de pedir uma
planilha, ele manda esses indicadores para `POST /analisar-operacao` e salva o retorno como uma análise
comum — com resumo, diagnóstico, gargalos, plano de ação, previsão e chat, as mesmas telas da análise de
arquivos. Sem chave da Groq, o diagnóstico vem de `server/operacaoLocal.js`.

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
  operacaoLocal.js   diagnóstico da operação sem IA
  prompts.js         instruções enviadas ao modelo
backend/           (Java — API REST e banco)
```

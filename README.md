# LogiPilot TCC

Versão do LogiPilot reconstruída em **React + JavaScript puro** (sem TypeScript), seguindo a arquitetura e os
conceitos do curso: Vite, `react-router-dom` (HashRouter), Bootstrap 5, CSS Modules, Axios e um back-end fake
com `json-server`. O diagnóstico é gerado por uma chamada real à API da Groq através de um pequeno servidor
Express dedicado. A aplicação também possui uma landing page responsiva para apresentação da solução.

Esta é uma reconstrução educacional do projeto original `logipilot/` (Next.js + TypeScript + Supabase),
mantendo o mesmo propósito e as funcionalidades essenciais, mas usando a stack ensinada em aula.

## Stack

- React + Vite (JavaScript, `.jsx`)
- react-router-dom (`HashRouter`)
- Bootstrap 5 + CSS Modules
- Axios
- json-server (simula a API REST de dados: usuários, clientes, projetos, entregas e análises)
- Express + Groq (servidor dedicado para a análise multimodal e o chat)

## Como rodar

O projeto precisa de **três processos rodando ao mesmo tempo**, em três terminais (ou usando `npm run dev:all`):

```bash
npm install

# Terminal 1 - front-end (Vite)
npm run dev

# Terminal 2 - back-end de dados (json-server, porta 3001)
npm run api

# Terminal 3 - servidor de IA (Groq, porta 3333)
npm run ia
```

Ou tudo de uma vez:

```bash
npm run dev:all
```

Acesse `http://localhost:5173`.

Para usar o diagnóstico pela Groq, copie `server/.env.example` para `server/.env` e coloque sua chave
(gerada em [console.groq.com/keys](https://console.groq.com/keys)):

```bash
cp server/.env.example server/.env
```

Sem a chave, o servidor continua funcionando e gera um diagnóstico local determinístico a partir da série
numérica encontrada nos arquivos. Isso permite demonstrar o fluxo completo sem depender de um serviço externo.

## Acesso

O sistema **não vem com contas prontas**. Na primeira execução, o `db.json` está vazio e o primeiro acesso é
criado pela própria tela de **Criar conta**, que cadastra o **gestor** da operação.

Os demais perfis (operador e motorista) são cadastrados depois pelo gestor, em **Dashboard → Acessos**.

As senhas nunca são gravadas em texto puro: o `db.json` guarda apenas o hash SHA-256 delas
(`src/services/senha.js`, usando a Web Crypto API do navegador).

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
  services/      api, iaApi, sessao, senha, arquivos, previsao, formatadores, entregas
server/
  index.js           rotas /analisar, /perguntar e /otimizar-rota
  extratores.js      leitura de cada formato
  resumo.js          resumo estatístico de tabelas grandes
  diagnosticoLocal.js  diagnóstico sem IA e detecção da série temporal
  rotaLocal.js       sequência de rota sem IA
  prompts.js         instruções enviadas ao modelo
```

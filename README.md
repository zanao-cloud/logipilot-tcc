# LogiPilot TCC

Versão do LogiPilot reconstruída em **React + JavaScript puro** (sem TypeScript), seguindo a arquitetura e os
conceitos do curso: Vite, `react-router-dom` (HashRouter), Bootstrap 5, CSS Modules, Axios e um back-end fake
com `json-server`. O diagnóstico de IA é gerado por uma chamada real à API da Groq através de um pequeno
servidor Express dedicado.

Esta é uma reconstrução educacional do projeto original `logipilot/` (Next.js + TypeScript + Supabase),
mantendo o mesmo propósito e as funcionalidades essenciais, mas usando a stack ensinada em aula.

## Stack

- React + Vite (JavaScript, `.jsx`)
- react-router-dom (`HashRouter`)
- Bootstrap 5 + CSS Modules
- Axios
- json-server (simula a API REST de dados: usuários, projetos e análises)
- Express + Groq (servidor dedicado só para gerar o diagnóstico de IA)

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

Antes de rodar o servidor de IA, copie `server/.env.example` para `server/.env` e coloque sua chave da Groq
(gerada em [console.groq.com/keys](https://console.groq.com/keys)):

```bash
cp server/.env.example server/.env
```

## Contas de teste (senha: `123456`)

| Papel      | E-mail                      |
|------------|------------------------------|
| Gestor     | gestor@logipilot.com         |
| Operador   | operador@logipilot.com       |
| Motorista  | motorista@logipilot.com      |

## Fluxo de análise

Em "Nova Análise", envie um arquivo `.csv` em que a primeira coluna seja o período (ex: data) e a segunda
coluna o indicador principal (ex: entregas). O servidor de IA usa esses dados para gerar o diagnóstico
(resumo, indicadores, plano de ação), e a previsão de tendência é calculada localmente (regressão linear +
média móvel, sem IA).

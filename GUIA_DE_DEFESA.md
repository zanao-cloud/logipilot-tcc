# Guia de defesa — LogiPilot

Este documento existe para **você estudar antes da apresentação**, não para ser lido pelo avaliador.

O LogiPilot foi construído sobre a estrutura ensinada em *Projeto Pizzaria Front-End com React*
(Prof. Rogério Caetano), mas foi além dela em alguns pontos. Aqui está, peça por peça: **o que é,
por que foi preciso, e a que conceito da aula aquilo se liga**.

Uma regra para a apresentação: **não diga que algo é simples se você não sabe explicar.** É melhor
responder "essa parte eu usei a biblioteca X, que resolve Y; o que eu entendi dela é isto" do que
fingir domínio e travar na pergunta seguinte.

---

## 1. O que veio direto da aula

Comece por aqui se ele perguntar "o que você aproveitou do que vimos?". Esta parte é a maior do
front-end e é idêntica ao material:

| Da aula | Onde está no LogiPilot |
|---|---|
| `src/pages/<Nome>/<Nome>.jsx` | as 20 páginas seguem esse padrão |
| `src/services/api` com `axios.create` | `src/services/api.js` |
| `src/routes/AppRoutes.jsx` | mesmo arquivo, mesmo papel |
| Componente `CredentialUser` | `src/components/CredentialUser.jsx` |
| Componente `Modal` + `Modal.module.css` | `src/components/Modal.jsx` |
| CRUD Listar / Novo / Editar / Excluir | Cliente, Projeto e Acesso |
| `useState`, `useEffect`, `useNavigate`, `useParams` | em praticamente toda página |
| `props` | `CredentialUser` recebe `title`; `StatCard` recebe `titulo`, `valor`, `icone`, `cor` |
| `map()` para montar tabelas | todas as listagens |
| `try / catch` com `async/await` | todas as chamadas à API |
| Bootstrap 5 + CSS Modules | em todo o projeto |
| Font Awesome por CDN no `index.html` | mesma tag `<link>` |

**Como dizer:** "a estrutura de pastas, o `services/api`, o `AppRoutes`, o `CredentialUser`, o `Modal`
e o padrão de CRUD são exatamente os da disciplina. O que mudou foi o domínio: em vez de produto e
categoria, é cliente, projeto e entrega."

---

## 2. Front-end — o que foge pouco

### 2.1 `HashRouter` em vez de `BrowserRouter`

**O que é:** o endereço fica `localhost:5173/#/dashboard`, com `#`.

**Por quê:** com `BrowserRouter`, recarregar a página numa rota interna faz o servidor procurar um
arquivo `/dashboard` que não existe, e dá 404. O `HashRouter` resolve isso sem configuração de
servidor, porque tudo depois do `#` fica no navegador.

**Se ele perguntar:** "é o mesmo react-router-dom da aula, só a estratégia de URL que muda."

### 2.2 `ProtectedRoute`

**O que é:** um componente que embrulha as rotas e checa quem está logado antes de deixar passar.

```jsx
<Route path="/dashboard" element={
  <ProtectedRoute papeis={['gestor']}><HomeGestor /></ProtectedRoute>
} />
```

**Por quê:** o sistema tem três perfis (gestor, operador, motorista) e cada um vê telas diferentes.
Sem isso, bastava digitar a URL para entrar na tela de outro perfil.

**Como funciona:** ele lê o usuário salvo, e se não houver, devolve `<Navigate to="/login" />`. Se
houver mas o papel não estiver na lista, manda para a tela inicial daquele papel.

**Liga com a aula:** é o mesmo `Route` do material, só que com um componente no meio. A redireção usa
`Navigate`, primo do `useNavigate` que você já viu.

⚠️ **Seja honesto sobre o limite disto:** essa proteção é só de interface. Ela impede o usuário de
navegar para a tela errada, mas **não protege a API** — quem souber o endereço consegue chamar o
back-end direto. Num sistema real isso seria feito com token no servidor. Se ele apontar isso, a
resposta certa é "sim, é uma limitação conhecida; a proteção real teria que estar na API".

### 2.3 `services/sessao.js` e o `localStorage`

**O que é:** três funções — `salvarUsuarioLogado`, `getUsuarioLogado`, `logout` — que guardam o
usuário no `localStorage` do navegador.

**Por quê:** sem isso, recarregar a página desloga.

**Se ele perguntar "por que não usou Context?":** daria para usar; o `localStorage` foi escolhido
porque o dado precisa sobreviver ao recarregamento, o que o Context sozinho não faz.

### 2.4 `components/Grafico.jsx`

**O que é:** o gráfico de barras da análise, desenhado com SVG escrito à mão (sem biblioteca).

**Por quê:** era um gráfico só, e trazer uma biblioteca de charts para isso adicionaria dependência
e peso ao projeto.

**Como funciona:** recebe um array de `{ rotulo, valor }`, acha o maior valor e calcula a altura de
cada barra como proporção dele. É `map()` sobre array — o mesmo da aula — gerando `<rect>` em vez
de `<tr>`.

### 2.5 `services/previsao.js`

**O que é:** a aba "Previsão" da análise. Calcula uma **regressão linear** e uma **média móvel** sobre
a série de números.

**Por quê:** para projetar a tendência dos próximos períodos.

**Como funciona (o essencial):** a regressão linear acha a reta que melhor passa pelos pontos — é a
fórmula de `y = a·x + b` do ensino médio, com `a` e `b` calculados a partir das somas dos valores. A
média móvel suaviza a curva fazendo a média dos últimos N pontos.

**Importante:** isto é matemática, não IA. Se ele perguntar "a IA que faz a previsão?", a resposta é
**não** — a previsão é calculada no próprio navegador, sem chamar modelo nenhum.

### 2.6 `components/LeitorDeCodigo.jsx`

**O que é:** o leitor de QR da conferência de carga, que abre a câmera.

**Por quê:** o motorista confere a caixa bipando a etiqueta, em vez de procurar o código na lista.

**Como funciona:** usa duas APIs nativas do navegador — `getUserMedia` (abre a câmera) e
`BarcodeDetector` (lê o código do quadro de vídeo). **Não é biblioteca**, é recurso do próprio
navegador.

⚠️ **Limitação que você deve declarar antes de ele descobrir:** a `BarcodeDetector` não existe no
Safari. O componente detecta isso, avisa na tela e oferece um campo para digitar o código à mão. Ou
seja: funciona em todo lugar, mas a câmera só no Chrome e no Android.

### 2.7 Biblioteca `qrcode`

**O que é:** gera a imagem do QR nas etiquetas imprimíveis.

**Por quê:** desenhar um QR à mão exige implementar correção de erro Reed-Solomon — totalmente fora
de proporção para o problema.

**Como funciona:** `QRCode.toDataURL(texto)` devolve a imagem como string embutida, que vai direto no
`src` de um `<img>`. Por isso a folha de etiquetas imprime sem internet.

### 2.8 Upload de foto com `FormData`

**O que é:** o envio da foto do comprovante de entrega.

**Por quê:** `JSON.stringify` não transporta arquivo. Para enviar binário, o padrão da web é
`multipart/form-data`.

**Como funciona:** monta um `FormData`, dá `append` no arquivo e manda com o mesmo `axios` da aula.
É `api.post` igual aos outros, só muda o corpo.

### 2.9 `window.print()`

Uma linha, na página de etiquetas. Abre a janela de impressão do navegador. O CSS tem um bloco
`@media print` que esconde a barra de botões e organiza as etiquetas em duas colunas na folha.

---

## 3. Back-end — o que foge muito

### 3.1 Primeiro: por que não usamos a API do professor

Na disciplina, o back-end era uma API pronta (`172.19.0.49/pizzariateste/api/v1`) e o trabalho era
consumi-la com axios. O LogiPilot precisa de regras que não existem naquela API: três perfis de
acesso, entrega com janela de horário e desfecho, reagendamento, relatório agregado. Não havia como
consumir — era preciso construir.

**Como dizer:** "a disciplina me ensinou a consumir uma API; aqui eu precisei construir a minha,
porque as regras do meu domínio não existiam em nenhuma API pronta."

### 3.2 Spring Boot

**O que é:** o framework Java para construir APIs REST. É o equivalente, no mundo Java, ao que o
Express é no Node.

**O que ele faz no projeto:** recebe as requisições HTTP que o axios manda, executa a regra, fala com
o banco e devolve JSON.

**A estrutura em camadas** — e aqui está o paralelo mais útil com a aula:

| Camada | Arquivo de exemplo | O que faz | Análogo no front |
|---|---|---|---|
| **Controller** | `ClienteController.java` | recebe a requisição e devolve a resposta | a página `.jsx`, que lida com a tela |
| **Service** | `ClienteServico.java` | a regra de negócio (validações, decisões) | as funções dentro da página |
| **Repository** | `ClienteRepository.java` | conversa com o banco | o `services/api.js`, que conversa com fora |
| **DTO** | `ClienteResposta.java` | define o formato do JSON que entra e sai | o objeto que você monta antes do `api.post` |

**Por que separar assim:** a mesma razão de separar `pages` de `services` no front — cada arquivo tem
uma responsabilidade, e dá para mudar uma camada sem mexer nas outras.

### 3.3 JPA / Hibernate e as entidades

**O que é:** a ferramenta que liga classe Java a tabela do banco. Uma classe `Cliente` vira a tabela
`cliente`; cada atributo vira uma coluna.

**Onde o material encosta nisso:** o professor explicou relacionamento **1:1 e 1:N** entre Produto e
Categoria. É exatamente o que acontece aqui:

```java
@ManyToOne                       // muitos projetos para um cliente → 1:N
@JoinColumn(name = "cliente_id") // a coluna que guarda a chave estrangeira
private Cliente cliente;
```

**Como dizer:** "é o relacionamento 1:N que vimos, declarado no código em vez de só no banco. Um
cliente tem vários projetos; cada projeto aponta para um cliente."

### 3.4 Flyway

**O que é:** controle de versão para o banco. Os arquivos `V1__esquema.sql` e `V2__dados_iniciais.sql`
são SQL puro, executados em ordem na primeira subida.

**Por quê:** sem ele, quem clonasse o projeto teria que criar as tabelas à mão. Com ele, o banco se
monta sozinho.

**Como funciona:** o Flyway cria uma tabela `flyway_schema_history` e anota o que já rodou, para não
repetir. Ele também guarda um *checksum* de cada script — por isso **não se edita uma migração que já
rodou**; cria-se uma nova.

**Como dizer:** "é o `CREATE TABLE` de sempre, só que versionado e executado automaticamente."

### 3.5 Microsoft SQL Server

Banco relacional, com as tabelas, chaves estrangeiras e constraints. O que vale saber explicar:

- **Chave estrangeira:** `projeto.cliente_id` aponta para `cliente.id`. É o 1:N da aula, no banco.
- **`CHECK`:** regra que o banco recusa sozinho. A placa, por exemplo, só entra se bater com o padrão
  Mercosul ou o antigo.
- **Índice único:** impede dois pacotes com o mesmo código na rota do mesmo motorista no mesmo dia.

**Por que SQL Server e não MySQL:** foi exigência do trabalho.

⚠️ **Ponto honesto que vale declarar:** no Mac com chip Apple, a Microsoft não publica imagem do SQL
Server, então o projeto roda sobre o **Azure SQL Edge** — mesmo motor e mesmo T-SQL, build ARM. Num
Windows, troca-se a imagem do container pela oficial e não muda mais nada. Isso está documentado no
README.

### 3.6 Spring Security e o BCrypt

**O que é:** no projeto, o Spring Security entra só por dois motivos: gerar o hash da senha e liberar
o CORS.

**O problema que resolve:** se o banco guardasse a senha legível, quem abrisse a tabela veria a senha
de todo mundo.

**Como funciona o BCrypt:** transforma a senha em um hash que **não tem volta** — não existe como
desfazer. Para conferir o login, o sistema aplica a mesma função na senha digitada e compara os
hashes. Ele também usa *salt*: um valor aleatório por senha, que faz duas pessoas com a mesma senha
terem hashes diferentes.

**Detalhe que mostra cuidado:** a API nunca devolve o hash. O DTO `UsuarioResposta` simplesmente não
tem o campo `senha`.

**CORS:** o navegador bloqueia, por padrão, uma página na porta 5173 chamar um servidor na 8080. O
CORS é a liberação explícita disso.

### 3.7 Docker e Colima

**O que é:** container é uma caixa isolada com um programa pronto para rodar. Em vez de instalar o
SQL Server na máquina, baixa-se uma imagem com ele dentro.

**Por quê:** o SQL Server não tem instalador para macOS. O container é o único caminho.

**Colima:** no Mac, containers precisam de uma máquina virtual Linux. O Colima é quem sobe essa VM —
é a alternativa livre ao Docker Desktop.

**Como dizer:** "não precisei instalar o banco; subi um container com ele pronto."

### 3.8 Testes com JUnit e Mockito

**O que é:** 43 testes automatizados, rodando com `./mvnw test`.

**O que eles testam:** autenticação (senha certa, senha errada, e-mail inexistente), as regras das
entregas (janela invertida, código repetido, ausência sem observação) e os formatos de placa e
telefone.

**O que é o Mockito:** os testes não tocam o banco. O Mockito cria um "dublê" do repositório que
devolve o que o teste mandar. Assim o teste verifica **a regra**, não o banco, e roda em
milissegundos.

**Bom argumento de defesa:** "se eu quebrar uma regra sem perceber, o teste acusa antes de chegar na
tela."

---

## 4. O servidor de IA (`server/`)

**O que é:** um servidor Node com Express, separado da API Java, com quatro rotas.

**Por que separado:** a leitura de PDF, Excel e imagem e a chamada ao modelo são tarefas de uma
natureza diferente do CRUD. Mantê-las fora deixa a API Java focada nos dados.

**O que cada rota faz:**

| Rota | Função |
|---|---|
| `/analisar` | recebe arquivos, extrai o conteúdo e pede o diagnóstico ao modelo |
| `/perguntar` | o chat sobre uma análise já gerada |
| `/otimizar-rota` | recebe as paradas pendentes e devolve a ordem de visita |
| `/analisar-operacao` | analisa as entregas que o próprio sistema registrou |

**Qual IA:** a API da **Groq**, com o modelo `gpt-oss-120b`. A chave fica em `server/.env`, que **não
vai para o Git**.

**O detalhe mais importante de defender:** cada rota tem um **cálculo local de reserva**. Sem a chave,
ou se a chamada falhar, o sistema não quebra — ele responde com um resultado calculado por regra
determinística (`rotaLocal.js`, `diagnosticoLocal.js`, `operacaoLocal.js`). Isso é o que permite
demonstrar o fluxo inteiro sem depender de serviço externo.

**Como a resposta é validada:** na otimização de rota, a ordem devolvida pelo modelo só é aceita se
contiver exatamente os mesmos ids enviados, sem repetir nem perder parada. Se vier errada, cai no
cálculo local. **Nunca se confia cegamente na saída do modelo.**

---

## 5. Perguntas prováveis

**"Por que não usou a API do professor?"**
As regras do meu domínio não existiam nela — perfis de acesso, janela de entrega, reagendamento. Eu
precisava de endpoints que nenhuma API pronta tinha.

**"Você escreveu todo esse código Java?"**
Diga a verdade sobre como trabalhou. Se usou apoio de ferramenta, diga — e mostre que entende o que
cada camada faz, que é o que ele está realmente medindo.

**"Onde está o CRUD que pedi?"**
Cliente, Projeto e Acesso, em `src/pages/`. Mesmo padrão da aula: `Listar`, `Novo`, `Editar`, com o
`Modal` de confirmação na exclusão.

**"Cadê o 1:N?"**
`projeto.cliente_id → cliente.id`. E também `entrega → motorista` e `entrega → cliente`. Dá para
mostrar no diagrama do VS Code com a extensão MSSQL.

**"A IA faz a previsão?"**
Não. A previsão é regressão linear calculada no navegador. A IA entra no diagnóstico em texto e na
ordem da rota.

**"E se a internet cair na apresentação?"**
Tudo funciona, menos o texto gerado pelo modelo — que cai no cálculo local. O Font Awesome vem de CDN,
então os ícones somem; o resto roda.

**"Como você garante que a senha está segura?"**
Hash BCrypt com salt no banco, e a API nunca devolve esse campo. A senha só trafega entre o navegador
e o servidor.

**"Me mostra você alterando alguma coisa aqui."**
Essa é a pergunta mais provável de pegar você. Treine antes **pelo menos um fluxo completo de ponta a
ponta**: adicionar um campo novo no cadastro de cliente, por exemplo — coluna no SQL (migração nova),
atributo na entidade, campo no DTO, campo no formulário React. É o caminho que prova que você entende
a arquitetura.

---

## 6. Limitações conhecidas

Declarar isto antes de ser perguntado passa mais segurança do que ser pego:

- A proteção de rotas é **só no front**; a API não exige autenticação.
- A leitura de QR pela câmera **não funciona no Safari** (tem alternativa digitando).
- A quilometragem é **estimativa digitada pelo operador**, não medida por GPS.
- O projeto depende de **três processos** rodando ao mesmo tempo.
- As senhas dos cadastros de exemplo são `123456` — **senha de desenvolvimento**, não de uso real.

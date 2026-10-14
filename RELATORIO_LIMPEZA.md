# Relatório de limpeza de código morto

Branch: `limpeza-codigo-morto` · Base: `main` (`92259a0`)

## Resumo numérico

| Métrica | Antes | Depois |
|---|---|---|
| Arquivos removidos | — | **5** |
| Páginas removidas | — | **0** |
| Linhas removidas | — | **1 843** (6 inseridas) |
| Dependências removidas | — | **0** |
| Módulos no build | 161 | 161 |
| Bundle JS | 459,27 kB (gzip 136,81) | 459,27 kB (gzip 136,81) |
| Bundle CSS | 255,06 kB (gzip 36,18) | 255,06 kB (gzip 36,18) |
| `dist/` | 856 KB | 836 KB |
| Erros de build | 0 | 0 |
| Erros de lint | 0 | 0 |

**O bundle não mudou** porque nada do que saiu entrava nele: eram arquivos que ninguém importava.
A economia foi de repositório, não de runtime. Os 20 KB a menos no `dist/` são os dois SVG que
estavam em `public/` e eram copiados crus para o build.

## Arquivos removidos

| Arquivo | Linhas | Motivo |
|---|---|---|
| `db.json` | 1 622 | Banco do antigo json-server. Substituído por MySQL e depois por SQL Server. Nenhum código o lia em execução — serviu só como origem das migrações, que já estão versionadas em `backend/src/main/resources/db/migration`. |
| `backend/ferramentas/migrar-mysql-para-sqlserver.mjs` | 128 | Ferramenta de uso único que gerou o `V2__dados_iniciais.sql` na troca de banco. O resultado está versionado e o MySQL saiu do projeto; o script não roda em nenhum fluxo. |
| `src/services/csv.js` | 57 | Não era importado por nenhum arquivo. Seu único export, `extrairSerieTemporalDoCsv`, não era chamado em lugar nenhum. Ficou morto quando a leitura de CSV passou para o servidor, em `server/extratores.js`. |
| `public/icons.svg` | 24 | Zero referências em JSX, CSS ou HTML. Os ícones do projeto vêm do Font Awesome por CDN. |
| `public/favicon.svg` | 1 | Zero referências. O ícone da aba é `/logo.png`, declarado no `index.html`. |

## Alterações de apoio

| Arquivo | O que mudou |
|---|---|
| `README.md` | Removidas as citações ao `db.json` e à ferramenta de migração; corrigida a URL do `flyway repair`, que ainda apontava para o MySQL; acrescentada a seção **Para avaliação**. |
| `V2__dados_iniciais.sql` | Comentário de cabeçalho que citava a ferramenta removida. Exigiu `flyway repair` para reescrever o checksum. |

## Dependências

Nenhuma removida. O `depcheck` não encontrou nada em `dependencies` sem uso.

## A CONFIRMAR — itens suspeitos que **não** foram removidos

| Item | Por que ficou |
|---|---|
| `@types/react`, `@types/react-dom` | O `depcheck` aponta como sem uso, e de fato o projeto é JavaScript puro — build e lint não dependem deles. **Mas** são eles que dão autocomplete de JSX no VS Code. Removê-los não quebra nada e degrada a edição. Decisão do autor. |
| `.entrar` duplicado em `Landing.module.css` (linhas 84 e 88) | Duas declarações seguidas, sem conflito entre si. Daria para fundir, mas é refatoração cosmética sem ganho funcional. |
| 5 `console.log` / `console.warn` em `server/index.js` | Não são depuração esquecida: avisam que a chave da Groq não está configurada (e que o sistema vai cair no cálculo local) e informam a porta na subida. São log operacional. |
| 45 `console.error` | Todos dentro de blocos `catch`. São tratamento de erro legítimo. |
| `.botaoClaro` e `.rodape` em `Landing.module.css` | Aparecem duas vezes, mas é cascata intencional: a primeira declaração é regra compartilhada ou de container, a segunda especializa. |

## Falso positivo importante

`backend/src/main/java/br/com/logipilot/config/ConfiguracaoWeb.java` aparece como "sem referência" em
qualquer busca textual, porque nenhum arquivo o importa. **Não é código morto:** é uma
`@Configuration` carregada pelo component scan do Spring, e é ela que registra os conversores de enum.
Sem ela, `?papel=motorista` volta a responder 400 e a tela de Reagendamentos quebra.

Foi o único item que uma limpeza automática teria apagado por engano.

## O que foi verificado e estava limpo

Varridos, com zero ocorrências: imports não usados · estados, variáveis e constantes declarados e
nunca usados · funções e handlers nunca chamados · código comentado · `debugger` · código inalcançável
(`if (false)`, trechos após `return`) · mocks e dados fictícios embutidos · classes mortas nos
`*.module.css` · classes mortas no `index.css` · regras CSS vazias · componentes duplicados ou versões
antigas (`*Old`, `*Copy`, `*v2`, `*.bak`) · sobras do template do Vite · arquivos órfãos em `server/` ·
rotas do servidor sem consumo no front · scripts do `package.json` apontando para arquivo inexistente ·
métodos de repositório, serviços e DTOs sem uso no back-end Java.

Das 22 rotas registradas em `AppRoutes.jsx`, **todas** estão linkadas por `Link` ou `navigate()`.
Dos 8 componentes em `src/components/`, **todos** são importados.

## Problemas que já existiam antes da limpeza

Nenhum. O build e o lint já passavam sem erro nem warning no estado base (`92259a0`).

## Commits

| Commit | O quê |
|---|---|
| `6a6479b` | Remove serviço de CSV sem uso |
| `effe2d3` | Remove ícones não referenciados do `public/` |
| `fa75416` | Remove o `db.json` |
| (correção) | Corrige a URL do `flyway repair` no README |
| `75df23f` | Remove a ferramenta de migração entre bancos |

Cada etapa foi seguida de `npm run build` e `npm run lint`, ambos passando. Após a remoção da
ferramenta de migração, a API Java também foi reiniciada para confirmar que o Flyway continua
subindo normalmente.

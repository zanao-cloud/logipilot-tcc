import { Link } from 'react-router-dom'
import { FORMATOS_ACEITOS } from '../../services/arquivos'
import styles from './Landing.module.css'

const numeros = [
  ['8+', 'Formatos suportados'],
  ['< 3min', 'Análise completa'],
  ['6', 'Módulos de diagnóstico'],
  ['100%', 'Baseado nos seus dados'],
]

const recursos = [
  {
    icone: 'fa-file-lines',
    titulo: 'Resumo executivo',
    texto: 'Visão consolidada da operação, com os destaques principais e o período analisado.',
  },
  {
    icone: 'fa-stethoscope',
    titulo: 'Diagnóstico com IA',
    texto: 'Score de saúde operacional separando fatos observados de hipóteses, sem inventar números.',
  },
  {
    icone: 'fa-chart-column',
    titulo: 'Dashboard automático',
    texto: 'Gráficos gerados a partir dos dados estruturados, sem precisar montar painel nenhum.',
  },
  {
    icone: 'fa-triangle-exclamation',
    titulo: 'Gargalos e riscos',
    texto: 'Pontos críticos mapeados automaticamente e classificados por severidade e impacto.',
  },
  {
    icone: 'fa-list-check',
    titulo: 'Plano de ação',
    texto: 'Ações priorizadas com prazo e resultado esperado, transformando diagnóstico em execução.',
  },
  {
    icone: 'fa-comments',
    titulo: 'Chat com os dados',
    texto: 'Pergunte diretamente sobre a análise gerada, sem precisar de conhecimento técnico.',
  },
]

const etapas = [
  ['01', 'Envie os dados', 'Planilhas, PDFs, apresentações, prints ou texto solto — tudo junto, na mesma análise.'],
  ['02', 'A IA processa', 'Cada formato tem o conteúdo extraído; prints e fotos passam por visão computacional.'],
  ['03', 'Aja com prioridade', 'Receba diagnóstico, gargalos, oportunidades e um plano de ação priorizado.'],
]

const Landing = () => {
  const navegarPara = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <Link to="/" className={styles.marca} aria-label="LogiPilot - início">
          <img src="/logo.png" alt="" className={styles.logo} />
          <span>LogiPilot AI</span>
        </Link>

        <nav className={styles.navegacao} aria-label="Navegação principal">
          <button type="button" onClick={() => navegarPara('recursos')}>Funcionalidades</button>
          <button type="button" onClick={() => navegarPara('como-funciona')}>Como funciona</button>
          <button type="button" onClick={() => navegarPara('formatos')}>Formatos</button>
        </nav>

        <div className={styles.acoesTopo}>
          <Link to="/login" className={styles.entrar}>Entrar</Link>
          <Link to="/criar-conta" className={styles.botaoPrimario}>Criar conta</Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <h1>
            Você não está enviando arquivos.
            <span className={styles.destaque}> Está ativando um analista operacional com IA.</span>
          </h1>
          <p>
            O LogiPilot transforma planilhas, PDFs, prints, relatórios e dados soltos em diagnóstico,
            indicadores, gargalos, oportunidades e plano de ação — em minutos.
          </p>

          <div className={styles.acoesHero}>
            <Link to="/criar-conta" className={styles.botaoPrimario}>
              Analisar meus dados <i className="fas fa-arrow-right" />
            </Link>
            <button type="button" className={styles.botaoSecundario} onClick={() => navegarPara('como-funciona')}>
              Ver como funciona
            </button>
          </div>

          <ul className={styles.selos}>
            <li><i className="fas fa-circle-check" /> Sem necessidade de BI</li>
            <li><i className="fas fa-circle-check" /> Excel, PDF, imagens e relatórios</li>
            <li><i className="fas fa-circle-check" /> IA baseada nos seus dados</li>
          </ul>
        </section>

        <section className={styles.faixaNumeros} aria-label="Resumo da solução">
          {numeros.map(([valor, rotulo]) => (
            <div key={rotulo}>
              <strong>{valor}</strong>
              <span>{rotulo}</span>
            </div>
          ))}
        </section>

        <section id="recursos" className={styles.secao}>
          <div className={styles.cabecalhoSecao}>
            <span className={styles.sobrelinha}>FUNCIONALIDADES</span>
            <h2>Seis módulos de diagnóstico em uma análise só.</h2>
            <p>Do resumo executivo ao plano de ação, sem depender de time de dados.</p>
          </div>

          <div className={styles.grade}>
            {recursos.map((recurso) => (
              <article key={recurso.titulo} className={styles.card}>
                <span className={styles.icone}><i className={`fas ${recurso.icone}`} /></span>
                <h3>{recurso.titulo}</h3>
                <p>{recurso.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className={styles.secaoProcesso}>
          <div className={styles.cabecalhoSecao}>
            <span className={styles.sobrelinha}>COMO FUNCIONA</span>
            <h2>Dos arquivos à ação em três passos.</h2>
          </div>

          <div className={styles.etapas}>
            {etapas.map(([numero, titulo, texto]) => (
              <article key={numero} className={styles.etapa}>
                <span>{numero}</span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="formatos" className={styles.secao}>
          <div className={styles.cabecalhoSecao}>
            <span className={styles.sobrelinha}>COMPATIBILIDADE</span>
            <h2>Aceita qualquer formato de dados.</h2>
            <p>Processamento multimodal: a plataforma entende tanto texto quanto imagem.</p>
          </div>

          <div className={styles.formatos}>
            {FORMATOS_ACEITOS.map((formato) => (
              <span key={formato.rotulo} className={styles.formato}>
                <i className={`fas ${formato.icone}`} style={{ color: formato.cor }} />
                {formato.rotulo}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Faça sua logística avançar com dados.</h2>
            <p>Crie sua conta e acompanhe a operação com mais clareza.</p>
          </div>
          <Link to="/criar-conta" className={styles.botaoClaro}>
            Criar conta <i className="fas fa-arrow-right" />
          </Link>
        </section>
      </main>

      <footer className={styles.rodape}>
        <div className={styles.marca}>
          <img src="/logo.png" alt="" className={styles.logo} />
          <span>LogiPilot AI</span>
        </div>
        <span>Projeto acadêmico • Gestão logística orientada por dados</span>
      </footer>
    </div>
  )
}

export default Landing

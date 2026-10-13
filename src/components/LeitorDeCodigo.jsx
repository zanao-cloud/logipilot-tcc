import { useEffect, useRef, useState } from 'react'
import styles from './LeitorDeCodigo.module.css'

/**
 * Lê o QR da etiqueta pela câmera do aparelho, usando a BarcodeDetector nativa
 * do navegador (sem biblioteca de leitura). Nem todo navegador a implementa —
 * no Safari, por exemplo, ela não existe — então o componente avisa e deixa o
 * motorista digitar o código à mão, que é o caminho que sempre funciona.
 */
const LeitorDeCodigo = ({ onLer, onFechar }) => {
  const videoRef = useRef(null)
  const [erro, setErro] = useState('')
  const [digitado, setDigitado] = useState('')
  const [suportado, setSuportado] = useState(true)

  useEffect(() => {
    let parar = false
    let fluxo = null
    let temporizador = null

    const ler = async () => {
      if (!('BarcodeDetector' in window)) {
        setSuportado(false)
        return
      }

      try {
        fluxo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })

        if (parar) {
          fluxo.getTracks().forEach((faixa) => faixa.stop())
          return
        }

        if (videoRef.current) {
          videoRef.current.srcObject = fluxo
          await videoRef.current.play()
        }

        const leitor = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] })

        const procurar = async () => {
          if (parar || !videoRef.current) return

          try {
            const codigos = await leitor.detect(videoRef.current)
            if (codigos.length > 0 && codigos[0].rawValue) {
              onLer(codigos[0].rawValue.trim())
              return
            }
          } catch {
            // Um quadro ilegível não é erro: a próxima tentativa resolve.
          }

          temporizador = setTimeout(procurar, 350)
        }

        procurar()
      } catch (excecao) {
        console.error('Não foi possível abrir a câmera.', excecao)
        setErro('Não foi possível abrir a câmera. Autorize o acesso ou digite o código.')
      }
    }

    ler()

    return () => {
      parar = true
      if (temporizador) clearTimeout(temporizador)
      if (fluxo) fluxo.getTracks().forEach((faixa) => faixa.stop())
    }
  }, [onLer])

  const enviarDigitado = (e) => {
    e.preventDefault()
    if (digitado.trim()) onLer(digitado.trim())
  }

  return (
    <div className={styles.fundo} role="dialog" aria-modal="true" aria-label="Ler etiqueta do pacote">
      <div className={styles.caixa}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong className="small">Aponte a câmera para a etiqueta</strong>
          <button type="button" className="btn-close" aria-label="Fechar leitor" onClick={onFechar}></button>
        </div>

        {suportado && !erro && (
          <div className={styles.moldura}>
            <video ref={videoRef} className={styles.video} muted playsInline />
            <div className={styles.alvo} aria-hidden="true"></div>
          </div>
        )}

        {!suportado && (
          <div className="alert alert-warning py-2 small mb-2" role="alert">
            Este navegador não lê códigos pela câmera. Digite a identificação do pacote abaixo.
          </div>
        )}

        {erro && <div className="alert alert-warning py-2 small mb-2" role="alert">{erro}</div>}

        <form onSubmit={enviarDigitado} className="mt-2">
          <label className="form-label small" htmlFor="codigoDigitado">Ou digite o código</label>
          <div className="d-flex gap-2">
            <input
              id="codigoDigitado"
              className="form-control"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              placeholder="Ex: CX-1042"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary flex-shrink-0">Conferir</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeitorDeCodigo

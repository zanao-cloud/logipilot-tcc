import { useEffect } from 'react'
import styles from './Modal.module.css'

const Modal = ({ isOpen, onClose, onConfirm }) => {
  useEffect(() => {
    if (!isOpen) return undefined

    const fecharComEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', fecharComEscape)
    return () => document.removeEventListener('keydown', fecharComEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose} role="presentation">
      <div className={styles.modalContent} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-exclusao-titulo">
        <p id="modal-exclusao-titulo" className={styles.modalHeader}>Tem certeza que deseja excluir este item?</p>
        <div className={styles.modalButtons}>
          <button type="button" className={`${styles.button} ${styles.cancel}`} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={`${styles.button} ${styles.confirm}`} onClick={onConfirm} autoFocus>
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal

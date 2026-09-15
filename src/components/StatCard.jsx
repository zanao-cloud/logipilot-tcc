const StatCard = ({ titulo, valor, icone, cor }) => {
  return (
    <div className="col-6 col-md-3 mb-3">
      <div className="card shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0"
            style={{ width: 48, height: 48, backgroundColor: cor }}
          >
            <i className={`fas ${icone}`}></i>
          </div>
          <div>
            <div className="text-muted small">{titulo}</div>
            <div className="h4 mb-0">{valor}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatCard

import { HashRouter, Routes, Route } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<h1 className="text-center mt-5">LogiPilot TCC em construção</h1>} />
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes

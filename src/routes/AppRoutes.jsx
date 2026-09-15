import { HashRouter, Routes, Route } from 'react-router-dom'

import Login from '../pages/Login/Login'
import HomeGestor from '../pages/HomeGestor/HomeGestor'
import HomeOperador from '../pages/HomeOperador/HomeOperador'
import HomeMotorista from '../pages/HomeMotorista/HomeMotorista'

import ListarProjeto from '../pages/ListarProjeto/ListarProjeto'
import NovoProjeto from '../pages/NovoProjeto/NovoProjeto'
import EditarProjeto from '../pages/EditarProjeto/EditarProjeto'

import ListarAcesso from '../pages/ListarAcesso/ListarAcesso'
import NovoAcesso from '../pages/NovoAcesso/NovoAcesso'
import EditarAcesso from '../pages/EditarAcesso/EditarAcesso'

import ListarAnalise from '../pages/ListarAnalise/ListarAnalise'
import NovaAnalise from '../pages/NovaAnalise/NovaAnalise'
import DetalheAnalise from '../pages/DetalheAnalise/DetalheAnalise'

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<HomeGestor />} />
        <Route path="/dashboard/projetos" element={<ListarProjeto />} />
        <Route path="/dashboard/projetos/novo" element={<NovoProjeto />} />
        <Route path="/dashboard/projetos/editar/:id" element={<EditarProjeto />} />
        <Route path="/dashboard/acessos" element={<ListarAcesso />} />
        <Route path="/dashboard/acessos/novo" element={<NovoAcesso />} />
        <Route path="/dashboard/acessos/editar/:id" element={<EditarAcesso />} />

        <Route path="/analises" element={<ListarAnalise />} />
        <Route path="/analises/nova" element={<NovaAnalise />} />
        <Route path="/analises/:id" element={<DetalheAnalise />} />

        <Route path="/operador" element={<HomeOperador />} />
        <Route path="/motorista" element={<HomeMotorista />} />
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes

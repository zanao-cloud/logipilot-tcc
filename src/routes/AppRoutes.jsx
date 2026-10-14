import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'

import Landing from '../pages/Landing/Landing'
import Login from '../pages/Login/Login'
import CriarConta from '../pages/CriarConta/CriarConta'
import EsqueciSenha from '../pages/EsqueciSenha/EsqueciSenha'
import HomeGestor from '../pages/HomeGestor/HomeGestor'
import HomeOperador from '../pages/HomeOperador/HomeOperador'
import HomeMotorista from '../pages/HomeMotorista/HomeMotorista'

import ListarCliente from '../pages/ListarCliente/ListarCliente'
import NovoCliente from '../pages/NovoCliente/NovoCliente'
import EditarCliente from '../pages/EditarCliente/EditarCliente'

import ListarProjeto from '../pages/ListarProjeto/ListarProjeto'
import NovoProjeto from '../pages/NovoProjeto/NovoProjeto'
import EditarProjeto from '../pages/EditarProjeto/EditarProjeto'

import ListarAcesso from '../pages/ListarAcesso/ListarAcesso'
import NovoAcesso from '../pages/NovoAcesso/NovoAcesso'
import EditarAcesso from '../pages/EditarAcesso/EditarAcesso'

import ListarMotorista from '../pages/ListarMotorista/ListarMotorista'
import DesignarEntregas from '../pages/DesignarEntregas/DesignarEntregas'
import Reagendamentos from '../pages/Reagendamentos/Reagendamentos'
import Estoque from '../pages/Estoque/Estoque'
import Etiquetas from '../pages/Etiquetas/Etiquetas'

import ListarAnalise from '../pages/ListarAnalise/ListarAnalise'
import NovaAnalise from '../pages/NovaAnalise/NovaAnalise'
import DetalheAnalise from '../pages/DetalheAnalise/DetalheAnalise'
import { ProtectedRoute, PublicOnlyRoute } from '../components/ProtectedRoute'

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/criar-conta" element={<PublicOnlyRoute><CriarConta /></PublicOnlyRoute>} />
        <Route path="/esqueci-senha" element={<PublicOnlyRoute><EsqueciSenha /></PublicOnlyRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute papeis={['gestor']}><HomeGestor /></ProtectedRoute>} />
        <Route path="/dashboard/clientes" element={<ProtectedRoute papeis={['gestor']}><ListarCliente /></ProtectedRoute>} />
        <Route path="/dashboard/clientes/novo" element={<ProtectedRoute papeis={['gestor']}><NovoCliente /></ProtectedRoute>} />
        <Route path="/dashboard/clientes/editar/:id" element={<ProtectedRoute papeis={['gestor']}><EditarCliente /></ProtectedRoute>} />
        <Route path="/dashboard/projetos" element={<ProtectedRoute papeis={['gestor']}><ListarProjeto /></ProtectedRoute>} />
        <Route path="/dashboard/projetos/novo" element={<ProtectedRoute papeis={['gestor']}><NovoProjeto /></ProtectedRoute>} />
        <Route path="/dashboard/projetos/editar/:id" element={<ProtectedRoute papeis={['gestor']}><EditarProjeto /></ProtectedRoute>} />
        <Route path="/dashboard/acessos" element={<ProtectedRoute papeis={['gestor']}><ListarAcesso /></ProtectedRoute>} />
        <Route path="/dashboard/acessos/novo" element={<ProtectedRoute papeis={['gestor']}><NovoAcesso /></ProtectedRoute>} />
        <Route path="/dashboard/acessos/editar/:id" element={<ProtectedRoute papeis={['gestor']}><EditarAcesso /></ProtectedRoute>} />

        <Route path="/analises" element={<ProtectedRoute papeis={['gestor', 'operador']}><ListarAnalise /></ProtectedRoute>} />
        <Route path="/analises/nova" element={<ProtectedRoute papeis={['gestor', 'operador']}><NovaAnalise /></ProtectedRoute>} />
        <Route path="/analises/:id" element={<ProtectedRoute papeis={['gestor', 'operador']}><DetalheAnalise /></ProtectedRoute>} />

        <Route path="/operador" element={<ProtectedRoute papeis={['operador']}><HomeOperador /></ProtectedRoute>} />
        <Route path="/operador/motoristas" element={<ProtectedRoute papeis={['operador']}><ListarMotorista /></ProtectedRoute>} />
        <Route path="/operador/motoristas/:id" element={<ProtectedRoute papeis={['operador']}><DesignarEntregas /></ProtectedRoute>} />
        <Route path="/operador/motoristas/:id/etiquetas" element={<ProtectedRoute papeis={['operador']}><Etiquetas /></ProtectedRoute>} />
        <Route path="/operador/estoque" element={<ProtectedRoute papeis={['operador']}><Estoque /></ProtectedRoute>} />
        <Route path="/operador/reagendamentos" element={<ProtectedRoute papeis={['operador']}><Reagendamentos /></ProtectedRoute>} />
        <Route path="/motorista" element={<ProtectedRoute papeis={['motorista']}><HomeMotorista /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes

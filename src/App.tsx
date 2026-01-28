import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';

// Importação das Páginas
import { Home } from './pages/Home';
import { Estoque } from './pages/Estoque';
import { Despesas } from './pages/Despesas';
import { Faturamento } from './pages/Faturamento';
import { Servicos } from './pages/Servicos';
import { Login } from './pages/Login';
import { Usuarios } from './pages/Usuarios'; // <--- O Importe que faltava

// Componente que protege as rotas verificando se tem token
function RotaProtegida() {
  const token = localStorage.getItem('vs_token');
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');
  const cargo = String(user.cargo || '').toUpperCase();

  if (!token) return <Navigate to="/login" replace />;

  if (cargo === 'FUNCIONARIO') {
    const allowed = new Set(['/estoque', '/servicos']);
    if (!allowed.has(location.pathname)) return <Navigate to="/estoque" replace />;
  }

  return <Layout />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública (Login) */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas (Dentro do Layout com Menu) */}
        <Route element={<RotaProtegida />}>
            <Route path="/" element={<Home />} />
            <Route path="/usuarios" element={<Usuarios />} /> {/* <--- A Rota Nova */}
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/servicos" element={<Servicos />} />
        </Route>

        {/* Qualquer rota desconhecida joga para a Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

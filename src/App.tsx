import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home'; // <--- Nova página
import { Estoque } from './pages/Estoque';
import { Despesas } from './pages/Despesas';
import { Faturamento } from './pages/Faturamento';
import { Servicos } from './pages/Servicos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* A Rota "index" agora aponta para Home, não mais redireciona */}
          <Route index element={<Home />} />
          
          <Route path="estoque" element={<Estoque />} />
          <Route path="despesas" element={<Despesas />} />
          <Route path="faturamento" element={<Faturamento />} />
          <Route path="servicos" element={<Servicos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
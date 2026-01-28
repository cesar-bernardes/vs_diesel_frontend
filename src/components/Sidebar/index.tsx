import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, 
  DollarSign, 
  FileText, 
  Wrench, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Menu, // <--- Ícone do Hamburger
  X     // <--- Ícone de Fechar
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado para controlar se o menu mobile está aberto ou fechado
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lógica de Permissões
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');
  const isAdmin = user.cargo === 'ADMIN';

  function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
      localStorage.removeItem('vs_token');
      localStorage.removeItem('vs_user');
      navigate('/login');
    }
  }

  // Função auxiliar de estilo
  const isActive = (path: string) => {
    const baseStyle = "flex items-center gap-3 p-3 rounded transition-all font-medium";
    const activeStyle = "bg-slate-800 text-white shadow-md pl-4 border-l-4 border-blue-500";
    const inactiveStyle = "text-gray-400 hover:bg-slate-800/50 hover:text-white hover:pl-4";
    return location.pathname === path ? `${baseStyle} ${activeStyle}` : `${baseStyle} ${inactiveStyle}`;
  };

  // Fecha o menu mobile quando clica em um link
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* --- BOTÃO MOBILE (Só aparece em telas pequenas) --- */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 text-white p-4 z-50 flex justify-between items-center shadow-md">
          <div className="font-bold text-yellow-500 tracking-wider">VR DIESEL</div>
          <button onClick={() => setMobileMenuOpen(true)}>
              <Menu size={28} />
          </button>
      </div>

      {/* --- OVERLAY (Fundo escuro quando menu abre no celular) --- */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR PRINCIPAL --- */}
      {/* - md:translate-x-0: No Desktop, sempre visível (posição 0)
         - -translate-x-full: No Mobile, escondido para a esquerda por padrão
         - mobileMenuOpen ? 'translate-x-0' : ... : Se aberto, desliza para a tela
      */}
      <aside className={`
          bg-slate-900 w-64 h-screen fixed left-0 top-0 text-white flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300
          md:translate-x-0 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-2">
              <h1 className="text-xl font-bold tracking-wider text-yellow-500 w-full text-center md:text-left">VR DIESEL</h1>
              
              {/* Botão de Fechar (Só no mobile) */}
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              <Link to="/" className={isActive('/')} onClick={handleLinkClick}>
                <LayoutDashboard size={20} className="text-blue-400" />
                <span>Visão Geral</span>
              </Link>

              <div className="border-t border-slate-800 my-2 pt-2"></div>

              {isAdmin && (
                  <Link to="/usuarios" className={isActive('/usuarios')} onClick={handleLinkClick}>
                      <Settings size={20} className="text-gray-400" /> 
                      <span>Config. Usuários</span>
                  </Link>
              )}

              <Link to="/estoque" className={isActive('/estoque')} onClick={handleLinkClick}>
                <Package size={20} className="text-emerald-400" />
                <span>Estoque</span>
              </Link>

              <Link to="/servicos" className={isActive('/servicos')} onClick={handleLinkClick}>
                <Wrench size={20} className="text-orange-400" />
                <span>Serviços (OS)</span>
              </Link>

              <Link to="/faturamento" className={isActive('/faturamento')} onClick={handleLinkClick}>
                <FileText size={20} className="text-indigo-400" />
                <span>Faturamento</span>
              </Link>

              <Link to="/despesas" className={isActive('/despesas')} onClick={handleLinkClick}>
                <DollarSign size={20} className="text-red-400" />
                <span>Despesas</span>
              </Link>
            </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
            <div className="mb-4 text-center">
                <span className="text-xs uppercase font-bold text-slate-500">Logado como:</span>
                <p className="font-bold text-yellow-500">{user.nome}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-all font-bold cursor-pointer"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
        </div>

      </aside>
    </>
  );
}
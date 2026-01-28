import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  DollarSign, 
  FileText, 
  Wrench, 
  LayoutDashboard, 
  LogOut,
  Settings,
  Menu, 
  X
} from 'lucide-react';

// --- NÃO PRECISA MAIS IMPORTAR A LOGO ---
// Quando usamos a pasta public, chamamos direto no HTML abaixo

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');
  const isAdmin = user.cargo === 'ADMIN';
  const isFuncionario = user.cargo === 'FUNCIONARIO';

  function handleLogout() {
    const confirmacao = confirm('Tem certeza que deseja sair do sistema?');
    if (confirmacao) {
      localStorage.removeItem('vs_token');
      localStorage.removeItem('vs_user');
      navigate('/login');
    }
  }

  const handleLinkClick = () => {
      setMobileMenuOpen(false);
  }

  const isActive = (path: string) => {
    const baseStyle = "flex items-center gap-3 p-3 rounded transition-all font-medium";
    const activeStyle = "bg-slate-800 text-white shadow-md pl-4 border-l-4 border-blue-500";
    const inactiveStyle = "text-gray-400 hover:bg-slate-800/50 hover:text-white hover:pl-4";

    return location.pathname === path 
      ? `${baseStyle} ${activeStyle}` 
      : `${baseStyle} ${inactiveStyle}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 text-white p-4 z-40 flex justify-between items-center shadow-md h-16">
          <span className="font-bold text-yellow-500 tracking-wider text-lg">VR DIESEL</span>
          <button onClick={() => setMobileMenuOpen(true)}>
              <Menu size={28} />
          </button>
      </div>

      {/* OVERLAY ESCURO */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:h-screen
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* LOGO */}
        <div className="mb-6 border-b border-slate-800 pb-6 flex items-center justify-center relative">
            {/* AQUI ESTÁ A MÁGICA: src="/logo.png" busca automático na pasta public */}
            <img 
              src="/logo.png" 
              alt="Logo VR Diesel" 
              className="w-full h-auto max-h-24 object-contain" 
            />
            
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="md:hidden absolute top-0 right-0 text-gray-400 hover:text-white"
            >
                <X size={24} />
            </button>
        </div>
        
        <nav className="space-y-2 flex-1 flex flex-col overflow-y-auto">
          {!isFuncionario && (
            <Link to="/" className={isActive('/')} onClick={handleLinkClick}>
              <LayoutDashboard size={20} className="text-blue-400" /> 
              <span>Visão Geral</span>
            </Link>
          )}

          <div className="border-t border-slate-800 my-2 pt-2"></div>

          <Link to="/estoque" className={isActive('/estoque')} onClick={handleLinkClick}>
            <Package size={20} className="text-emerald-400" /> 
            <span>Estoque</span>
          </Link>
          
          <Link to="/servicos" className={isActive('/servicos')} onClick={handleLinkClick}>
            <Wrench size={20} className="text-orange-400" /> 
            <span>Serviços (OS)</span>
          </Link>

          {!isFuncionario && (
            <>
              <Link to="/faturamento" className={isActive('/faturamento')} onClick={handleLinkClick}>
                <FileText size={20} className="text-indigo-400" /> 
                <span>Faturamento</span>
              </Link>

              <Link to="/despesas" className={isActive('/despesas')} onClick={handleLinkClick}>
                <DollarSign size={20} className="text-red-400" /> 
                <span>Despesas</span>
              </Link>
            </>
          )}
           
           <div className="mt-auto pt-4 border-t border-slate-800"></div>
           
           {isAdmin && !isFuncionario && (
             <Link to="/usuarios" className={isActive('/usuarios')} onClick={handleLinkClick}>
                <Settings size={20} className="text-gray-400" /> 
                <span>Usuários</span>
             </Link>
           )}

          <div className="pt-2">
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-900/20 rounded transition-all text-gray-400 hover:text-red-400 hover:pl-4 cursor-pointer"
            >
                <LogOut size={20} className="text-red-500" />
                <span className="font-medium">Sair</span>
            </button>
          </div>
        </nav>

        <div className="text-xs text-slate-600 text-center mt-4">
          Versão 3.1
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-auto w-full pt-20 md:pt-8">
        <Outlet /> 
      </main>
    </div>
  );
}

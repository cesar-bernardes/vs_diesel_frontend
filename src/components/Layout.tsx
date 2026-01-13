import { Link, Outlet } from 'react-router-dom';
import { Package, DollarSign, FileText, Wrench, LayoutDashboard } from 'lucide-react'; // <--- Adicionei LayoutDashboard aqui

export function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar / Menu Lateral */}
      <aside className="w-64 bg-slate-900 text-white p-6 shadow-2xl flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-yellow-500 tracking-wider text-center border-b border-slate-800 pb-4">
          VS DIESEL
        </h1>
        
        <nav className="space-y-2 flex-1">
          {/* Link NOVO da Home */}
          <Link to="/" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-all text-gray-300 hover:text-white hover:pl-4">
            <LayoutDashboard size={20} className="text-blue-400" /> 
            <span className="font-medium">Visão Geral</span>
          </Link>

          <div className="border-t border-slate-800 my-2 pt-2"></div>

          <Link to="/estoque" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-all text-gray-300 hover:text-white hover:pl-4">
            <Package size={20} className="text-emerald-400" /> 
            <span className="font-medium">Estoque</span>
          </Link>
          
          <Link to="/servicos" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-all text-gray-300 hover:text-white hover:pl-4">
            <Wrench size={20} className="text-orange-400" /> 
            <span className="font-medium">Serviços (OS)</span>
          </Link>

          <Link to="/faturamento" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-all text-gray-300 hover:text-white hover:pl-4">
            <FileText size={20} className="text-indigo-400" /> 
            <span className="font-medium">Faturamento</span>
          </Link>

          <Link to="/despesas" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-all text-gray-300 hover:text-white hover:pl-4">
            <DollarSign size={20} className="text-red-400" /> 
            <span className="font-medium">Despesas</span>
          </Link>
        </nav>

        <div className="text-xs text-slate-600 text-center mt-auto pt-4 border-t border-slate-800">
          Versão 1.0.0
        </div>
      </aside>

      {/* Conteúdo da Página */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet /> 
      </main>
    </div>
  );
}
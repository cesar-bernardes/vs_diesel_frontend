import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatMoney } from '../../utils/format'; 
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  AlertTriangle,
  Clock,
  Wrench, 
  Calendar, 
  CheckCircle2 
  // Removi o 'Package' daqui pois não estava sendo usado
} from 'lucide-react';

interface DashboardResumo {
  mes: string;
  recebidoMes: number;
  pendenteMes: number;
  despesasOperacionaisMes: number;
  comprasEstoqueMes: number;
  lucroReal: number;
  osAbertas: number;
  osAbertasTotalValor: number;
  osFechadasTotalValor: number;
  osAbertasMesQtd: number;
  osFechadasMesQtd: number;
  osAbertasMesValor: number;
  osFechadasMesValor: number;
  aReceberHoje: number;
  aReceberVencido: number;
  aVencerProximos7Dias: number;
  osAbertasAtrasadas: number;
}

export function Home() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);

  // Filtro de Mês (Padrão: Mês Atual)
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const carregarResumo = useCallback(() => {
    setLoading(true);
    setErro(null);
    api.get(`/dashboard/resumo?mes=${filtroMes}`)
      .then((res) => setResumo(res.data))
      .catch(() => setErro('Não foi possível carregar a Visão Geral.'))
      .finally(() => setLoading(false));
  }, [filtroMes]);

  useEffect(() => {
    Promise.resolve().then(() => carregarResumo());
  }, [carregarResumo]);

  if (loading && !resumo && !erro) return <div className="p-8 text-gray-500">Carregando indicadores...</div>;

  return (
    <div className="space-y-8">
      
      {/* CABEÇALHO E FILTRO */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Visão Geral</h2>
            <p className="text-gray-500">Fluxo de caixa real ({new Date(filtroMes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})</p>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border flex items-center gap-2 w-full sm:w-auto">
            <Calendar size={20} className="text-slate-500" />
            <span className="font-bold text-slate-700 text-sm">Período:</span>
            <input 
                type="month" 
                className="outline-none font-bold text-slate-800 bg-transparent cursor-pointer min-w-0"
                value={filtroMes}
                onChange={e => setFiltroMes(e.target.value)}
            />
        </div>
      </div>

      {erro && (
        <div className="bg-white border border-red-200 text-red-700 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-bold">{erro}</div>
          <button onClick={carregarResumo} className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700">
            Tentar novamente
          </button>
        </div>
      )}

      {/* --- BIG NUMBERS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: RECEITA */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-sm border border-green-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={100} className="text-green-600" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                    <div className="bg-green-200 p-2 rounded-full"><CheckCircle2 size={20}/></div>
                    <span>Recebido (Real)</span>
                </div>
                <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-green-700 break-words">{formatMoney(resumo?.recebidoMes || 0)}</p>
                    <p className="text-sm text-green-600 mt-1">
                        + {formatMoney(resumo?.pendenteMes || 0)} pendente no mês
                    </p>
                </div>
            </div>
        </div>

        {/* CARD 2: SAÍDAS TOTAIS (APENAS DESPESAS OPERACIONAIS) */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-sm border border-red-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown size={100} className="text-red-600" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                    <div className="bg-red-200 p-2 rounded-full"><TrendingDown size={20}/></div>
                    <span>Total de Saídas</span>
                </div>
                <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-red-700 break-words">
                        {formatMoney(resumo?.despesasOperacionaisMes || 0)}
                    </p>
                </div>
            </div>
        </div>

        {/* CARD 3: LUCRO REAL */}
        <div className={`p-6 rounded-2xl shadow-lg border-2 relative overflow-hidden text-white transition-colors
            ${(resumo?.lucroReal || 0) >= 0 
                ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600' 
                : 'bg-gradient-to-br from-orange-600 to-red-700 border-red-600'}`
        }>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-2 font-bold mb-2 opacity-90">
                    <div className="bg-white/20 p-2 rounded-full"><Wallet size={20}/></div>
                    <span>Lucro Real (Caixa)</span>
                </div>
                <div>
                    <p className="text-4xl sm:text-5xl font-extrabold tracking-tight break-words leading-tight">{formatMoney(resumo?.lucroReal || 0)}</p>
                    <p className="text-sm opacity-80 mt-2">
                        {(resumo?.lucroReal || 0) >= 0 ? 'Resultado positivo 🎉' : 'Atenção: Prejuízo no período ⚠️'}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- ALERTAS OPERACIONAIS --- */}
      <h3 className="text-lg font-bold text-gray-700 mt-8 mb-4">Ordens de Serviço</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">Valor Total OS Abertas</p>
                  <p className="text-3xl font-bold text-slate-800">{formatMoney(resumo?.osAbertasTotalValor || 0)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Wrench size={32} />
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">Valor Total OS Fechadas</p>
                  <p className="text-3xl font-bold text-green-700">{formatMoney(resumo?.osFechadasTotalValor || 0)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <CheckCircle2 size={32} />
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">Valor OS Abertas (Mês)</p>
                  <p className="text-3xl font-bold text-indigo-700">{formatMoney(resumo?.osAbertasMesValor || 0)}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                  <Wallet size={32} />
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">Valor OS Fechadas (Mês)</p>
                  <p className="text-3xl font-bold text-emerald-700">{formatMoney(resumo?.osFechadasMesValor || 0)}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                  <TrendingUp size={32} />
              </div>
          </div>
      </div>

      <h3 className="text-lg font-bold text-gray-700 mt-8 mb-4">Painel de Alertas (Hoje)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* OS ABERTAS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">Ordens de Serviço Abertas</p>
                  <p className="text-3xl font-bold text-slate-800">{resumo?.osAbertas || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Wrench size={32} />
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-cyan-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">OS Atrasadas (+7 dias)</p>
                  <p className="text-3xl font-bold text-cyan-700">{resumo?.osAbertasAtrasadas || 0}</p>
              </div>
              <div className="bg-cyan-100 p-3 rounded-full text-cyan-600">
                  <Clock size={32} />
              </div>
          </div>

          {/* VENCENDO HOJE */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">A Receber Hoje ({new Date().toLocaleDateString('pt-BR')})</p>
                  <p className="text-3xl font-bold text-orange-600">{formatMoney(resumo?.aReceberHoje || 0)}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                  <AlertCircle size={32} />
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-600 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">A Receber Vencido</p>
                  <p className="text-3xl font-bold text-red-600">{formatMoney(resumo?.aReceberVencido || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">Próximos 7 dias: {formatMoney(resumo?.aVencerProximos7Dias || 0)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full text-red-600">
                  <AlertTriangle size={32} />
              </div>
          </div>
      </div>
    </div>
  );
}

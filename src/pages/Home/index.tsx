import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  Wrench, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';

export function Home() {
  const [loading, setLoading] = useState(true);
  
  // Dados brutos
  const [faturamentos, setFaturamentos] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [listaOS, setListaOS] = useState<any[]>([]);

  // Filtro de Mês (Padrão: Mês Atual)
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    try {
      const [resFat, resDesp, resOS] = await Promise.all([
        api.get('/faturamentos'),
        api.get('/despesas'),
        api.get('/os')
      ]);
      setFaturamentos(resFat.data);
      setDespesas(resDesp.data);
      setListaOS(resOS.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  // --- CÁLCULOS DO MÊS SELECIONADO ---

  // 1. Receita Real (Só o que está PAGO neste mês)
  // Nota: Consideramos a data de vencimento/pagamento dentro do mês selecionado
  const entradasMes = faturamentos
    .filter(f => f.status === 'PAGO' && f.data_vencimento.startsWith(filtroMes))
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  // 2. Despesas do Mês
  const saidasMes = despesas
    .filter(d => d.data_despesa.startsWith(filtroMes))
    .reduce((acc, d) => acc + Number(d.valor), 0);

  // 3. Saldo (Lucro/Prejuízo Operacional)
  const saldo = entradasMes - saidasMes;

  // --- OUTROS INDICADORES (EM TEMPO REAL) ---
  
  const osAbertas = listaOS.filter(os => os.status === 'ABERTA').length;
  
  const hoje = new Date().toISOString().split('T')[0];
  const aReceberHoje = faturamentos
    .filter(f => f.data_vencimento.startsWith(hoje) && f.status === 'PENDENTE')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  const aReceberMes = faturamentos
    .filter(f => f.data_vencimento.startsWith(filtroMes) && f.status !== 'PAGO')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  if (loading) return <div className="p-8 text-gray-500">Carregando indicadores...</div>;

  return (
    <div className="space-y-8">
      
      {/* CABEÇALHO E FILTRO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Visão Geral</h2>
            <p className="text-gray-500">Acompanhe a saúde financeira da oficina.</p>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border flex items-center gap-2">
            <Calendar size={20} className="text-slate-500" />
            <span className="font-bold text-slate-700 text-sm">Período:</span>
            <input 
                type="month" 
                className="outline-none font-bold text-slate-800 bg-transparent cursor-pointer"
                value={filtroMes}
                onChange={e => setFiltroMes(e.target.value)}
            />
        </div>
      </div>

      {/* --- BIG NUMBERS (CARDS PRINCIPAIS) --- */}
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
                    <p className="text-4xl font-extrabold text-green-700">R$ {entradasMes.toFixed(2)}</p>
                    <p className="text-sm text-green-600 mt-1">
                        + R$ {aReceberMes.toFixed(2)} pendente no mês
                    </p>
                </div>
            </div>
        </div>

        {/* CARD 2: DESPESAS */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-sm border border-red-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown size={100} className="text-red-600" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                    <div className="bg-red-200 p-2 rounded-full"><TrendingDown size={20}/></div>
                    <span>Gastos / Despesas</span>
                </div>
                <div>
                    <p className="text-4xl font-extrabold text-red-700">R$ {saidasMes.toFixed(2)}</p>
                    <p className="text-sm text-red-600 mt-1">Custos operacionais e compras</p>
                </div>
            </div>
        </div>

        {/* CARD 3: SALDO / LUCRO */}
        <div className={`p-6 rounded-2xl shadow-lg border-2 relative overflow-hidden text-white transition-colors
            ${saldo >= 0 
                ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600' 
                : 'bg-gradient-to-br from-orange-600 to-red-700 border-red-600'}`
        }>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center gap-2 font-bold mb-2 opacity-90">
                    <div className="bg-white/20 p-2 rounded-full"><Wallet size={20}/></div>
                    <span>Saldo do Período</span>
                </div>
                <div>
                    <p className="text-5xl font-extrabold tracking-tight">R$ {saldo.toFixed(2)}</p>
                    <p className="text-sm opacity-80 mt-2">
                        {saldo >= 0 ? 'Lucro Operacional 🎉' : 'Atenção: Prejuízo no período ⚠️'}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- ALERTAS OPERACIONAIS --- */}
      <h3 className="text-lg font-bold text-gray-700 mt-8 mb-4">Painel de Alertas (Hoje)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* OS ABERTAS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">Ordens de Serviço Abertas</p>
                  <p className="text-3xl font-bold text-slate-800">{osAbertas}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Wrench size={32} />
              </div>
          </div>

          {/* VENCENDO HOJE */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 font-medium">A Receber Hoje ({new Date().toLocaleDateString('pt-BR')})</p>
                  <p className="text-3xl font-bold text-orange-600">R$ {aReceberHoje.toFixed(2)}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                  <AlertCircle size={32} />
              </div>
          </div>
      </div>
    </div>
  );
}
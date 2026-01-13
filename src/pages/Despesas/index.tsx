import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PlusCircle, Calendar, BarChart3 } from 'lucide-react';

interface Despesa {
  id: number;
  data_despesa: string;
  numero_nf: string;
  tipo_nf: string;
  valor: number;
  fornecedor: string;
  departamento: string;
  observacoes: string;
}

export function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  // Removi o loading que não estava sendo usado para evitar erro no build
  const [modalAberto, setModalAberto] = useState(false);
  
  // FILTROS
  const [filtroDepto, setFiltroDepto] = useState('Todos');
  const [filtroData, setFiltroData] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // ESTADO DO FORMULÁRIO
  const [novaDespesa, setNovaDespesa] = useState({
    dataDespesa: new Date().toISOString().split('T')[0],
    numeroNf: '',
    tipoNf: 'Nota Fiscal',
    valor: 0,
    fornecedor: '',
    departamento: '', 
    observacoes: ''
  });

  useEffect(() => {
    carregarDespesas();
  }, []);

  async function carregarDespesas() {
    try {
      const response = await api.get('/despesas');
      setDespesas(response.data);
    } catch (error) {
      console.error("Erro ao buscar despesas", error);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
        const deptoFormatado = novaDespesa.departamento.charAt(0).toUpperCase() + novaDespesa.departamento.slice(1);
        await api.post('/despesas', { ...novaDespesa, departamento: deptoFormatado });
        alert('Despesa lançada!');
        setModalAberto(false);
        carregarDespesas();
        setNovaDespesa({ 
            ...novaDespesa, 
            numeroNf: '', 
            valor: 0, 
            fornecedor: '', 
            observacoes: '',
            departamento: '' 
        }); 
    } catch (error) {
        alert('Erro ao salvar despesa.');
        console.error(error);
    }
  }

  // --- LÓGICA DINÂMICA ---

  const departamentosExistentes = Array.from(new Set(despesas.map(d => d.departamento))).filter(Boolean).sort();

  const despesasFiltradas = despesas.filter(d => {
    const matchDepto = filtroDepto === 'Todos' || d.departamento === filtroDepto;
    const matchData = d.data_despesa.startsWith(filtroData); 
    return matchDepto && matchData;
  });

  const totalGeral = despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0);

  const gastosPorDepto = despesasFiltradas.reduce((acc, curr) => {
    acc[curr.departamento] = (acc[curr.departamento] || 0) + Number(curr.valor);
    return acc;
  }, {} as Record<string, number>);

  const maiorGasto = Math.max(...Object.values(gastosPorDepto), 1);
  const deptosGrafico = filtroDepto === 'Todos' ? departamentosExistentes : [filtroDepto];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Controle de Despesas</h2>
        <button 
            onClick={() => setModalAberto(true)}
            className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 shadow-lg w-full md:w-auto justify-center"
        >
          <PlusCircle size={20} />
          Lançar Despesa
        </button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RESUMO */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500 space-y-6">
            <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <Calendar size={16} /> Filtrar por Mês
                </label>
                <input 
                    type="month" 
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="w-full border p-2 rounded font-bold text-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
                />
            </div>
            
            <div className="pt-4 border-t">
                <p className="text-gray-500">Total Filtrado</p>
                <p className="text-4xl font-bold text-slate-800">R$ {totalGeral.toFixed(2)}</p>
            </div>
        </div>

        {/* GRÁFICO COM SCROLL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
                <BarChart3 size={20} /> Gastos por Departamento
            </h3>
            
            <div className="flex-1 w-full overflow-x-auto pb-4 custom-scrollbar"> 
                <div className="flex items-end gap-4 h-48 pb-2 border-b border-gray-200 min-w-max px-2">
                    {deptosGrafico.length === 0 ? (
                        <p className="text-gray-400 w-full text-center self-center sticky left-0">Sem dados cadastrados ainda.</p>
                    ) : deptosGrafico.map((depto) => {
                        const valor = gastosPorDepto[depto] || 0;
                        const altura = (valor / maiorGasto) * 100;
                        
                        return (
                            <div key={depto} className="flex flex-col items-center justify-end h-full group w-16 flex-shrink-0 relative">
                                <div className="mb-1 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6">
                                    R$ {valor.toFixed(0)}
                                </div>
                                <div 
                                    className={`w-full rounded-t relative transition-all duration-500 ${valor > 0 ? 'bg-red-200 hover:bg-red-300' : 'bg-gray-100'}`}
                                    style={{ height: `${altura}%`, minHeight: '4px' }}
                                >
                                    {valor > 0 && (
                                        <div className="absolute bottom-0 w-full bg-red-500 rounded-t opacity-70" style={{ height: '100%' }}></div>
                                    )}
                                </div>
                                <span className="text-[10px] md:text-xs font-medium text-gray-500 mt-2 text-center truncate w-full" title={depto}>
                                    {depto}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* FILTROS BOTÕES */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
            onClick={() => setFiltroDepto('Todos')}
            className={`px-4 py-1 rounded-full text-sm border transition-colors flex-shrink-0 ${
                filtroDepto === 'Todos' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
            Todos
        </button>
        
        {departamentosExistentes.map(depto => (
            <button
                key={depto}
                onClick={() => setFiltroDepto(depto)}
                className={`px-4 py-1 rounded-full text-sm border whitespace-nowrap transition-colors flex-shrink-0 ${
                    filtroDepto === depto ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
                {depto}
            </button>
        ))}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">NF</th>
                <th className="p-4">Depto</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Obs</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {despesasFiltradas.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum registro encontrado para este filtro.</td></tr>
                ) : despesasFiltradas.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap">{new Date(d.data_despesa).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 font-medium text-gray-800">{d.fornecedor}</td>
                    <td className="p-4 text-gray-500">{d.numero_nf}</td>
                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{d.departamento}</span></td>
                    <td className="p-4 font-bold text-red-600 whitespace-nowrap">R$ {Number(d.valor).toFixed(2)}</td>
                    <td className="p-4 text-gray-400 text-xs truncate max-w-[150px]">{d.observacoes}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Lançar Nova Despesa</h3>
                <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Data</label>
                        <input type="date" required className="w-full border rounded p-2" 
                            value={novaDespesa.dataDespesa} 
                            onChange={e => setNovaDespesa({...novaDespesa, dataDespesa: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Departamento</label>
                        <input list="lista-departamentos" required placeholder="Selecione ou digite..." className="w-full border rounded p-2"
                            value={novaDespesa.departamento}
                            onChange={e => setNovaDespesa({...novaDespesa, departamento: e.target.value})}
                        />
                        <datalist id="lista-departamentos">
                            {departamentosExistentes.map(d => <option key={d} value={d} />)}
                            {!departamentosExistentes.length && <><option value="Oficina"/><option value="Administrativo"/></>}
                        </datalist>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Fornecedor</label>
                        <input type="text" required className="w-full border rounded p-2" value={novaDespesa.fornecedor} onChange={e => setNovaDespesa({...novaDespesa, fornecedor: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">NF</label>
                        <input type="text" className="w-full border rounded p-2" value={novaDespesa.numeroNf} onChange={e => setNovaDespesa({...novaDespesa, numeroNf: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Valor</label>
                        <input type="number" step="0.01" required className="w-full border rounded p-2 font-bold text-red-600" value={novaDespesa.valor} onChange={e => setNovaDespesa({...novaDespesa, valor: parseFloat(e.target.value)})}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Obs</label>
                        <textarea className="w-full border rounded p-2" value={novaDespesa.observacoes} onChange={e => setNovaDespesa({...novaDespesa, observacoes: e.target.value})}/>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold">Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
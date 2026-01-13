import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PlusCircle, UserPlus, CheckCircle, Clock, AlertCircle, Calendar, DollarSign } from 'lucide-react';

interface Cliente {
  id: number;
  nome_razao_social: string;
  cnpj_cpf: string;
}

interface Faturamento {
  id: number;
  data_vencimento: string;
  valor_parcela: number;
  numero_documento: string;
  status: string;
  numero_parcela: number;
  total_parcelas: number;
  clientes_empresas: {
    nome_razao_social: string;
    cnpj_cpf: string;
  };
}

export function Faturamento() {
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // FILTRO: Começa com o Mês Atual
  const [filtroData, setFiltroData] = useState(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM
  
  // Modais
  const [modalLancamento, setModalLancamento] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);

  // Formulários
  const [novoCliente, setNovoCliente] = useState({ nome: '', cnpj: '', telefone: '' });
  const [novoFat, setNovoFat] = useState({
    clienteId: '',
    valorTotal: '',
    qtdeParcelas: 1,
    numeroDocumento: '',
    dataPrimeiroVencimento: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [resFat, resCli] = await Promise.all([
        api.get('/faturamentos'),
        api.get('/clientes')
      ]);
      setFaturamentos(resFat.data);
      setClientes(resCli.data);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  }

  // --- AÇÕES ---
  async function handleSalvarCliente(e: React.FormEvent) {
    e.preventDefault();
    try {
        await api.post('/clientes', novoCliente);
        alert('Cliente cadastrado!');
        setModalCliente(false);
        setNovoCliente({ nome: '', cnpj: '', telefone: '' });
        carregarDados();
    } catch (error) {
        alert('Erro ao salvar cliente.');
    }
  }

  async function handleLancarFaturamento(e: React.FormEvent) {
    e.preventDefault();
    if (!novoFat.clienteId) return alert('Selecione um cliente!');

    try {
        await api.post('/faturamentos/lancar', {
            ...novoFat,
            valorTotal: parseFloat(novoFat.valorTotal),
            clienteId: parseInt(novoFat.clienteId)
        });
        alert('Faturamento lançado!');
        setModalLancamento(false);
        carregarDados();
    } catch (error) {
        alert('Erro ao lançar.');
    }
  }

  async function handleDarBaixa(id: number) {
    if (!confirm('Confirmar o recebimento deste boleto?')) return;
    try {
        await api.put(`/faturamentos/${id}/pagar`);
        carregarDados();
    } catch (error) {
        alert('Erro ao dar baixa.');
    }
  }

  // --- LÓGICA DO DASHBOARD FILTRADO ---
  
  // 1. Filtra os itens pelo mês selecionado
  const itensDoMes = faturamentos.filter(f => f.data_vencimento.startsWith(filtroData));

  // 2. Calcula Totais
  const totalPrevistoMes = itensDoMes.reduce((acc, f) => acc + Number(f.valor_parcela), 0);
  
  const recebidoMes = itensDoMes
    .filter(f => f.status === 'PAGO')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  const aReceberMes = itensDoMes
    .filter(f => f.status !== 'PAGO')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  // Extra: Total Geral em Atraso (Independente do mês, para não perder de vista)
  const totalAtrasadoGeral = faturamentos
    .filter(f => new Date(f.data_vencimento) < new Date() && f.status === 'PENDENTE')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Financeiro / Faturamento</h2>
        <div className="flex gap-2">
            <button onClick={() => setModalCliente(true)} className="bg-slate-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-slate-800">
                <UserPlus size={18} /> Novo Cliente
            </button>
            <button onClick={() => setModalLancamento(true)} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 shadow-lg">
                <PlusCircle size={20} /> Lançar
            </button>
        </div>
      </div>

      {/* --- DASHBOARD COM FILTRO --- */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
              <div className="bg-white p-2 rounded shadow-sm border flex items-center gap-2">
                  <Calendar size={18} className="text-slate-500" />
                  <span className="text-sm font-bold text-slate-600">Filtrar Mês:</span>
                  <input 
                      type="month" 
                      className="outline-none font-bold text-slate-800 bg-transparent"
                      value={filtroData}
                      onChange={e => setFiltroData(e.target.value)}
                  />
              </div>
              {totalAtrasadoGeral > 0 && (
                  <div className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertCircle size={14} /> Total Geral em Atraso: R$ {totalAtrasadoGeral.toFixed(2)}
                  </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm mb-1">A Receber ({filtroData})</p>
                <p className="text-3xl font-bold text-blue-600">R$ {aReceberMes.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Pendente neste mês</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                <p className="text-gray-500 text-sm mb-1">Recebido ({filtroData})</p>
                <p className="text-3xl font-bold text-green-600">R$ {recebidoMes.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Baixado neste mês</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-slate-400">
                <p className="text-gray-500 text-sm mb-1">Total Previsto ({filtroData})</p>
                <p className="text-3xl font-bold text-slate-700">R$ {totalPrevistoMes.toFixed(2)}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(recebidoMes / (totalPrevistoMes || 1)) * 100}%` }}></div>
                </div>
            </div>
          </div>
      </div>

      {/* TABELA FILTRADA */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex justify-between">
            <span>Boletos de {filtroData}</span>
            <span className="text-sm font-normal text-gray-500">{itensDoMes.length} lançamentos</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Vencimento</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Documento</th>
              <th className="p-4">Parcela</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Baixar</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {itensDoMes.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum boleto para este mês.</td></tr>
            ) : itensDoMes.map((f) => {
              const isPago = f.status === 'PAGO';
              const isAtrasado = new Date(f.data_vencimento) < new Date() && !isPago;
              
              return (
                <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${isPago ? 'bg-green-50/40' : ''}`}>
                  <td className="p-4 text-gray-600">
                      {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 font-medium">
                      {f.clientes_empresas?.nome_razao_social}
                  </td>
                  <td className="p-4 text-gray-500">{f.numero_documento}</td>
                  <td className="p-4">{f.numero_parcela}/{f.total_parcelas}</td>
                  <td className="p-4 font-bold text-slate-700">R$ {Number(f.valor_parcela).toFixed(2)}</td>
                  
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${
                          isPago ? 'bg-green-100 text-green-700' : 
                          isAtrasado ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                          {isPago ? <CheckCircle size={12}/> : isAtrasado ? <AlertCircle size={12}/> : <Clock size={12}/>}
                          {isPago ? 'PAGO' : isAtrasado ? 'ATRASADO' : 'PENDENTE'}
                      </span>
                  </td>

                  <td className="p-4 text-center">
                      {!isPago && (
                          <button 
                              onClick={() => handleDarBaixa(f.id)}
                              title="Receber Valor"
                              className="text-green-600 hover:text-white hover:bg-green-600 border border-green-200 p-1.5 rounded-full transition-all shadow-sm"
                          >
                              <DollarSign size={16} />
                          </button>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAIS (Cópia simples para funcionar) */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Novo Cliente</h3>
                <form onSubmit={handleSalvarCliente} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="Nome" required value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="CNPJ/CPF" required value={novoCliente.cnpj} onChange={e => setNovoCliente({...novoCliente, cnpj: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Telefone" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} />
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalCliente(false)} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded">Salvar</button></div>
                </form>
            </div>
        </div>
      )}
      {modalLancamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold mb-4">Novo Faturamento</h3>
                <form onSubmit={handleLancarFaturamento} className="space-y-4">
                    <select className="w-full border p-2 rounded" required value={novoFat.clienteId} onChange={e => setNovoFat({...novoFat, clienteId: e.target.value})}>
                        <option value="">Selecione o Cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_razao_social}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" step="0.01" required className="border p-2 rounded" placeholder="Valor Total" value={novoFat.valorTotal} onChange={e => setNovoFat({...novoFat, valorTotal: e.target.value})} />
                        <input type="number" required className="border p-2 rounded" placeholder="Parcelas" value={novoFat.qtdeParcelas} onChange={e => setNovoFat({...novoFat, qtdeParcelas: parseInt(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input required className="border p-2 rounded" placeholder="Nº Documento" value={novoFat.numeroDocumento} onChange={e => setNovoFat({...novoFat, numeroDocumento: e.target.value})} />
                        <input type="date" required className="border p-2 rounded" value={novoFat.dataPrimeiroVencimento} onChange={e => setNovoFat({...novoFat, dataPrimeiroVencimento: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalLancamento(false)} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Confirmar</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
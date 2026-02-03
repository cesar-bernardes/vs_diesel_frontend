import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatMoney } from '../../utils/format'; 
// 1. Adicionei Trash2 nas importações 👇
import { PlusCircle, UserPlus, CheckCircle, Clock, AlertCircle, Calendar, DollarSign, X, Trash2 } from 'lucide-react';

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
  
  const [filtroData, setFiltroData] = useState(new Date().toISOString().slice(0, 7));
  const [aba, setAba] = useState<'ABERTOS' | 'HISTORICO'>('ABERTOS');
  
  const [modalLancamento, setModalLancamento] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);

  const [novoCliente, setNovoCliente] = useState({ nome: '', cnpj: '', telefone: '' });
  const [novoFat, setNovoFat] = useState({
    clienteId: '',
    valorTotal: '',
    qtdeParcelas: 1,
    numeroDocumento: '',
    dataPrimeiroVencimento: new Date().toISOString().split('T')[0]
  });

  function carregarDados() {
    Promise.all([
      api.get('/faturamentos'),
      api.get('/clientes')
    ])
      .then(([resFat, resCli]) => {
        setFaturamentos(resFat.data);
        setClientes(resCli.data);
      })
      .catch((error: unknown) => console.error('Erro ao carregar dados', error));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function fecharModalLancamento() {
    setModalLancamento(false);
    setNovoFat({
        clienteId: '',
        valorTotal: '',
        qtdeParcelas: 1,
        numeroDocumento: '',
        dataPrimeiroVencimento: new Date().toISOString().split('T')[0]
    });
  }

  function fecharModalCliente() {
    setModalCliente(false);
    setNovoCliente({ nome: '', cnpj: '', telefone: '' });
  }

  async function handleSalvarCliente(e: React.FormEvent) {
    e.preventDefault();
    try {
        await api.post('/clientes', novoCliente);
        alert('Cliente cadastrado!');
        fecharModalCliente();
        carregarDados();
    } catch {
        alert('Erro ao salvar cliente.');
    }
  }

  async function handleLancarFaturamento(e: React.FormEvent) {
    e.preventDefault();
    if (!novoFat.clienteId) return alert('Selecione um cliente!');

    const valorTotalNum = parseFloat(novoFat.valorTotal);
    const valorParcelaPrevisto = parseFloat((valorTotalNum / novoFat.qtdeParcelas).toFixed(2));

    const clienteSelecionado = clientes.find(c => c.id === parseInt(novoFat.clienteId));
    
    if (clienteSelecionado) {
        const jaExiste = faturamentos.some(fat => {
            const mesmoCliente = fat.clientes_empresas.nome_razao_social === clienteSelecionado.nome_razao_social;
            const mesmoValor = Math.abs(Number(fat.valor_parcela) - valorParcelaPrevisto) < 0.02;
            return mesmoCliente && mesmoValor;
        });

        if (jaExiste) {
            const confirmar = confirm(
                `⚠️ ALERTA DE POSSÍVEL DUPLICIDADE!\n\n` +
                `Já existem boletos lançados para "${clienteSelecionado.nome_razao_social}" com o valor de parcela aprox. de ${formatMoney(valorParcelaPrevisto)}.\n\n` +
                `Tem certeza que deseja lançar novamente?`
            );
            
            if (!confirmar) return;
        }
    }

    try {
        await api.post('/faturamentos/lancar', {
            ...novoFat,
            valorTotal: valorTotalNum,
            clienteId: parseInt(novoFat.clienteId)
        });
        alert('Faturamento lançado!');
        fecharModalLancamento();
        carregarDados();
    } catch {
        alert('Erro ao lançar.');
    }
  }

  async function handleDarBaixa(id: number) {
    if (!confirm('Confirmar o recebimento deste boleto?')) return;
    try {
        await api.put(`/faturamentos/${id}/pagar`);
        carregarDados();
    } catch {
        alert('Erro ao dar baixa.');
    }
  }

  // 2. NOVA FUNÇÃO DE EXCLUSÃO COM CONFIRMAÇÃO 👇
  async function handleExcluir(id: number) {
    // Verificação de 2ª Etapa (Confirmação)
    const confirmacao = confirm(
        '🗑️ EXCLUSÃO DE REGISTRO\n\n' +
        'Tem certeza absoluta que deseja excluir este boleto?\n' +
        'Esta ação não poderá ser desfeita.'
    );

    if (!confirmacao) return;

    try {
        // Supondo que sua rota de backend seja DELETE /faturamentos/:id
        await api.delete(`/faturamentos/${id}`);
        alert('Boleto excluído com sucesso.');
        carregarDados();
    } catch (error) {
        console.error(error);
        alert('Erro ao excluir o boleto. Tente novamente.');
    }
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const itensDoMes = faturamentos.filter(f => f.data_vencimento.startsWith(filtroData));
  const itensAbertosMes = itensDoMes.filter(f => f.status !== 'PAGO');
  const itensPagosMes = itensDoMes.filter(f => f.status === 'PAGO');
  const itensVisiveis = aba === 'ABERTOS' ? itensAbertosMes : itensPagosMes;

  const totalPrevistoMes = itensDoMes.reduce((acc, f) => acc + Number(f.valor_parcela), 0);
  
  const recebidoMes = itensDoMes
    .filter(f => f.status === 'PAGO')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  const aReceberMes = itensDoMes
    .filter(f => f.status !== 'PAGO')
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  const totalVencidoGeral = faturamentos
    .filter(f => {
        const venc = new Date(f.data_vencimento);
        venc.setHours(0,0,0,0);
        return venc < hoje && f.status !== 'PAGO';
    })
    .reduce((acc, f) => acc + Number(f.valor_parcela), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Financeiro / Faturamento</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button onClick={() => setModalCliente(true)} className="bg-slate-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-slate-800 w-full sm:w-auto">
                <UserPlus size={18} /> Novo Cliente
            </button>
            <button onClick={() => setModalLancamento(true)} className="bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg w-full sm:w-auto">
                <PlusCircle size={20} /> Lançar
            </button>
        </div>
      </div>

      {/* --- DASHBOARD COM FILTRO --- */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="bg-white p-2 rounded shadow-sm border flex items-center gap-2 w-full sm:w-auto">
                  <Calendar size={18} className="text-slate-500" />
                  <span className="text-sm font-bold text-slate-600">Filtrar Mês:</span>
                  <input 
                      type="month" 
                      className="outline-none font-bold text-slate-800 bg-transparent"
                      value={filtroData}
                      onChange={e => setFiltroData(e.target.value)}
                  />
              </div>
              {totalVencidoGeral > 0 && (
                  <div className="sm:ml-auto text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse border border-red-200 w-fit">
                      <AlertCircle size={14} /> Total Geral Vencido: {formatMoney(totalVencidoGeral)}
                  </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm mb-1">A Receber ({filtroData})</p>
                <p className="text-3xl font-bold text-blue-600">{formatMoney(aReceberMes)}</p>
                <p className="text-xs text-gray-400 mt-1">Pendente neste mês</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                <p className="text-gray-500 text-sm mb-1">Recebido ({filtroData})</p>
                <p className="text-3xl font-bold text-green-600">{formatMoney(recebidoMes)}</p>
                <p className="text-xs text-gray-400 mt-1">Baixado neste mês</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-slate-400">
                <p className="text-gray-500 text-sm mb-1">Total Previsto ({filtroData})</p>
                <p className="text-3xl font-bold text-slate-700">{formatMoney(totalPrevistoMes)}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(recebidoMes / (totalPrevistoMes || 1)) * 100}%` }}></div>
                </div>
            </div>
          </div>
      </div>

      {/* TABELA FILTRADA */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span>Boletos de {filtroData}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAba('ABERTOS')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    aba === 'ABERTOS'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Ver boletos em aberto"
                >
                  Em aberto ({itensAbertosMes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAba('HISTORICO')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    aba === 'HISTORICO'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Ver histórico de pagamentos"
                >
                  Histórico ({itensPagosMes.length})
                </button>
              </div>
            </div>
            <span className="text-sm font-normal text-gray-500">{itensVisiveis.length} lançamentos</span>
        </div>

        {/* LISTAGEM MOBILE (CARDS) */}
        <div className="md:hidden divide-y">
          {itensVisiveis.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {aba === 'ABERTOS' ? 'Nenhum boleto em aberto para este mês.' : 'Nenhum boleto pago para este mês.'}
            </div>
          ) : itensVisiveis.map((f) => {
            const isPago = f.status === 'PAGO';
            const dataVencimento = new Date(f.data_vencimento);
            dataVencimento.setHours(0, 0, 0, 0);
            const isVencido = dataVencimento < hoje && !isPago;

            return (
              <div key={f.id} className={`p-4 ${isPago ? 'bg-green-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`font-bold ${isVencido ? 'text-red-600' : 'text-slate-700'}`}>
                      {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="mt-1 font-semibold text-slate-800 break-words">{f.clientes_empresas?.nome_razao_social}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      Doc: <span className="font-medium">{f.numero_documento}</span> • Parcela: <span className="font-medium">{f.numero_parcela}/{f.total_parcelas}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${
                      isPago ? 'bg-green-100 text-green-700' :
                      isVencido ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isPago ? <CheckCircle size={12}/> : isVencido ? <AlertCircle size={12}/> : <Clock size={12}/>}
                      {isPago ? 'PAGO' : isVencido ? 'VENCIDO' : 'PENDENTE'}
                    </span>

                    <div className="flex gap-2">
                        {!isPago && (
                        <button 
                            onClick={() => handleDarBaixa(f.id)}
                            title="Receber Valor"
                            className="text-green-600 hover:text-white hover:bg-green-600 border border-green-200 p-2 rounded-full transition-all shadow-sm"
                        >
                            <DollarSign size={18} />
                        </button>
                        )}
                        {/* 3. Botão Excluir Mobile 👇 */}
                        <button 
                            onClick={() => handleExcluir(f.id)}
                            title="Excluir Boleto"
                            className="text-red-500 hover:text-white hover:bg-red-600 border border-red-200 p-2 rounded-full transition-all shadow-sm"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-gray-50 rounded-lg p-3 border">
                  <div className="text-xs font-bold text-gray-500 uppercase">Valor</div>
                  <div className="mt-1 text-xl font-extrabold text-slate-800">{formatMoney(f.valor_parcela)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TABELA DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Documento</th>
                <th className="p-4">Parcela</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {itensVisiveis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {aba === 'ABERTOS' ? 'Nenhum boleto em aberto para este mês.' : 'Nenhum boleto pago para este mês.'}
                  </td>
                </tr>
              ) : itensVisiveis.map((f) => {
                const isPago = f.status === 'PAGO';
                const dataVencimento = new Date(f.data_vencimento);
                dataVencimento.setHours(0,0,0,0);
                const isVencido = dataVencimento < hoje && !isPago;
                
                return (
                  <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${isPago ? 'bg-green-50/40' : ''}`}>
                    <td className={`p-4 whitespace-nowrap ${isVencido ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                        {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 font-medium">
                        {f.clientes_empresas?.nome_razao_social}
                    </td>
                    <td className="p-4 text-gray-500">{f.numero_documento}</td>
                    <td className="p-4 whitespace-nowrap">{f.numero_parcela}/{f.total_parcelas}</td>
                    <td className="p-4 font-bold text-slate-700 whitespace-nowrap">{formatMoney(f.valor_parcela)}</td>
                    
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${
                            isPago ? 'bg-green-100 text-green-700' : 
                            isVencido ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {isPago ? <CheckCircle size={12}/> : isVencido ? <AlertCircle size={12}/> : <Clock size={12}/>}
                            {isPago ? 'PAGO' : isVencido ? 'VENCIDO' : 'PENDENTE'}
                        </span>
                    </td>

                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            {!isPago && (
                                <button 
                                    onClick={() => handleDarBaixa(f.id)}
                                    title="Receber Valor"
                                    className="text-green-600 hover:text-white hover:bg-green-600 border border-green-200 p-1.5 rounded-full transition-all shadow-sm"
                                >
                                    <DollarSign size={16} />
                                </button>
                            )}
                            {/* 4. Botão Excluir Desktop 👇 */}
                            <button 
                                onClick={() => handleExcluir(f.id)}
                                title="Excluir Boleto"
                                className="text-red-500 hover:text-white hover:bg-red-600 border border-red-200 p-1.5 rounded-full transition-all shadow-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Novo Cliente</h3>
                    <button onClick={fecharModalCliente} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                </div>
                <form onSubmit={handleSalvarCliente} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="Nome" required value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="CNPJ/CPF" required value={novoCliente.cnpj} onChange={e => setNovoCliente({...novoCliente, cnpj: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Telefone" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} />
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <button type="button" onClick={fecharModalCliente} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL LANÇAMENTO */}
      {modalLancamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Novo Faturamento</h3>
                    <button onClick={fecharModalLancamento} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                </div>
                <form onSubmit={handleLancarFaturamento} className="space-y-4">
                    <select className="w-full border p-2 rounded" required value={novoFat.clienteId} onChange={e => setNovoFat({...novoFat, clienteId: e.target.value})}>
                        <option value="">Selecione o Cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_razao_social}</option>)}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="number" step="0.01" required className="border p-2 rounded" placeholder="Valor Total" value={novoFat.valorTotal} onChange={e => setNovoFat({...novoFat, valorTotal: e.target.value})} />
                        <input type="number" required className="border p-2 rounded" placeholder="Parcelas" value={novoFat.qtdeParcelas} onChange={e => setNovoFat({...novoFat, qtdeParcelas: parseInt(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input required className="border p-2 rounded" placeholder="Nº Documento" value={novoFat.numeroDocumento} onChange={e => setNovoFat({...novoFat, numeroDocumento: e.target.value})} />
                        <input type="date" required className="border p-2 rounded" value={novoFat.dataPrimeiroVencimento} onChange={e => setNovoFat({...novoFat, dataPrimeiroVencimento: e.target.value})} />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <button type="button" onClick={fecharModalLancamento} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

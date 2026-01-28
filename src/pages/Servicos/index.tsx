import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatMoney } from '../../utils/format';
import { ArrowLeft, PlusCircle, Wrench, Car, User, Printer, Trash2 } from 'lucide-react';
import { ImpressoOS } from '../../components/ImpressoOS';

type OSStatus = 'ABERTA' | 'FINALIZADA';
type ItemTipo = 'PECA' | 'SERVICO';

interface Cliente {
  id: number;
  nome_razao_social: string;
}

interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  qtdeAtual: number;
  precoCusto: number;
  precoVenda?: number;
}

interface OrdemServico {
  id: number;
  placa: string;
  veiculo: string;
  status: OSStatus;
  total?: number;
  data_abertura?: string;
  descricao_problema?: string;
  clientes_empresas?: {
    nome_razao_social: string;
  };
}

interface ItemOS {
  id: number;
  tipo: ItemTipo;
  descricao: string;
  quantidade: number;
  preco_un?: number;
  subtotal?: number;
  produto_id?: number | null;
}

export function Servicos() {
  // 1. SEGURANÇA: Identifica o cargo
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');
  const isFuncionario = user.cargo === 'FUNCIONARIO';

  // ESTADOS
  const [listaOS, setListaOS] = useState<OrdemServico[]>([]);
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);
  const [itensOS, setItensOS] = useState<ItemOS[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mobileView, setMobileView] = useState<'lista' | 'detalhe'>('lista');
  
  // Modais
  const [modalNovaOS, setModalNovaOS] = useState(false);
  
  // Forms
  const [novaOS, setNovaOS] = useState({ clienteId: '', placa: '', veiculo: '', descricao: '' });
  const [novoItem, setNovoItem] = useState({ 
    tipo: 'PECA',
    produtoId: '', 
    descricao: '', 
    quantidade: 1, 
    preco: 0 
  });

  // --- CARREGAMENTOS ---
  function carregarOS() {
    api.get('/os')
      .then((res) => setListaOS(res.data))
      .catch(() => setListaOS([]));
  }

  function carregarClientes() {
    api.get('/clientes')
      .then((res) => setClientes(res.data))
      .catch(() => setClientes([]));
  }

  function carregarProdutos() {
    api.get('/produtos')
      .then((res) => setProdutos(res.data))
      .catch(() => setProdutos([]));
  }
  async function selecionarOS(os: OrdemServico) {
    setOsSelecionada(os);
    const res = await api.get(`/os/${os.id}/itens`);
    setItensOS(res.data);
    setMobileView('detalhe');
  }

  useEffect(() => {
    carregarOS();
    carregarProdutos();
    if (!isFuncionario) carregarClientes();
  }, [isFuncionario]);

  // --- AÇÕES ---
  async function handleCriarOS(e: React.FormEvent) {
    e.preventDefault();
    if (isFuncionario) return;
    try {
        await api.post('/os', novaOS);
        alert('OS Aberta com sucesso!');
        setModalNovaOS(false);
        carregarOS();
    } catch { alert('Erro ao abrir OS'); }
  }

  async function handleAdicionarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!osSelecionada) return;

    let descFinal = novoItem.descricao;
    if (novoItem.tipo === 'PECA' && novoItem.produtoId) {
        const prod = produtos.find(p => p.id === parseInt(novoItem.produtoId));
        if (prod) {
            descFinal = `${prod.codigo} - ${prod.descricao}`;
        }
    }

    try {
        await api.post(`/os/${osSelecionada.id}/itens`, {
            osId: osSelecionada.id,
            produtoId: novoItem.produtoId || null,
            descricao: descFinal,
            tipo: novoItem.tipo,
            quantidade: novoItem.quantidade,
            preco: isFuncionario ? 0 : novoItem.preco
        });
        
        // Atualiza a lista de itens e a lista de OS (para atualizar o total no menu lateral)
        const resItens = await api.get(`/os/${osSelecionada.id}/itens`);
        setItensOS(resItens.data);
        carregarOS();
        setNovoItem({ tipo: 'PECA', produtoId: '', descricao: '', quantidade: 1, preco: 0 });
    } catch { alert('Erro ao adicionar item'); }
  }

  // --- REMOVER ITEM ---
  async function handleRemoverItem(itemId: number) {
    if (isFuncionario) return;
    if (!confirm('Deseja remover este item da OS? Se for peça, ela voltará ao estoque.')) return;
    if (!osSelecionada) return;
    const osId = osSelecionada.id;

    try {
        await api.delete(`/os/itens/${itemId}`);
        const resItens = await api.get(`/os/${osId}/itens`);
        setItensOS(resItens.data);
        carregarOS(); // Atualiza total geral
    } catch {
        alert('Erro ao remover item.');
    }
  }

  async function handleFinalizarOS() {
    if (isFuncionario) return;
    if (!confirm('Deseja finalizar esta OS? Isso fecha o pedido.')) return;
    if (!osSelecionada) return;
    const osId = osSelecionada.id;
    try {
        await api.put(`/os/${osId}/finalizar`, { total: calcularTotal() });
        alert('OS Finalizada!');
        carregarOS();
        setOsSelecionada(null); 
        setMobileView('lista');
    } catch { alert('Erro ao finalizar'); }
  }

  // --- IMPRESSÃO ---
  function handleImprimir() {
    if (isFuncionario) return;
    window.print();
  }

  const calcularTotal = () => itensOS.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);

  return (
    <div className="flex flex-col gap-4 md:h-[calc(100vh-100px)]">
      {!isFuncionario && <ImpressoOS os={osSelecionada} itens={itensOS} />}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-3xl font-bold text-slate-800">Ordens de Serviço</h2>
        {!isFuncionario && (
          <button onClick={() => setModalNovaOS(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg w-full sm:w-auto">
            <PlusCircle size={20} /> Nova OS
          </button>
        )}
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* ESQUERDA: LISTA DE OS */}
        <div className={`w-full md:w-1/3 bg-white rounded-lg shadow overflow-y-auto border border-gray-200 ${mobileView === 'detalhe' ? 'hidden md:block' : ''}`}>
            <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">OS Recentes</div>
            <div className="divide-y">
                {listaOS.map(os => (
                    <div 
                        key={os.id} 
                        onClick={() => selecionarOS(os)}
                        className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${osSelecionada?.id === os.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-lg text-slate-800">#{os.id} - {os.placa}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${os.status === 'ABERTA' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {os.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">{os.clientes_empresas?.nome_razao_social}</p>
                        <p className="text-xs text-gray-400 mt-1">{os.veiculo}</p>
                        {!isFuncionario && <p className="text-right font-bold text-blue-600 mt-2">{formatMoney(os.total)}</p>}
                    </div>
                ))}
            </div>
        </div>

        {/* DIREITA: DETALHES DA OS */}
        <div className={`flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden ${mobileView === 'lista' ? 'hidden md:flex' : 'flex'}`}>
            {osSelecionada ? (
                <>
                    {/* TOPO DETALHES */}
                    <div className="p-4 sm:p-6 border-b bg-gray-50 flex flex-col lg:flex-row justify-between lg:items-start gap-4">
                        <div className="min-w-0">
                            <button
                                type="button"
                                onClick={() => setMobileView('lista')}
                                className="md:hidden inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 mb-3"
                            >
                                <ArrowLeft size={18} /> Voltar
                            </button>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Car size={24} /> {osSelecionada.placa} <span className="text-gray-400 font-normal">| {osSelecionada.veiculo}</span>
                            </h3>
                            <p className="text-gray-500 mt-1 flex items-center gap-2"><User size={16}/> {osSelecionada.clientes_empresas?.nome_razao_social}</p>
                            <p className="text-sm text-orange-600 mt-2 bg-orange-50 p-2 rounded border border-orange-100">
                                <strong>Problema:</strong> {osSelecionada.descricao_problema}
                            </p>
                        </div>
                        {!isFuncionario && (
                          <div className="text-left lg:text-right flex flex-col lg:items-end gap-2">
                               <div className="text-sm text-gray-500">Total OS</div>
                               <div className="text-3xl sm:text-4xl font-bold text-slate-800 break-words">{formatMoney(calcularTotal())}</div>
                               
                               <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full lg:w-auto">
                                  <button 
                                      onClick={handleImprimir}
                                      className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 flex items-center justify-center gap-2 w-full sm:w-auto"
                                  >
                                      <Printer size={16} /> Imprimir
                                  </button>

                                  {osSelecionada.status === 'ABERTA' && (
                                      <button onClick={handleFinalizarOS} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-bold w-full sm:w-auto">
                                          Finalizar OS
                                      </button>
                                  )}
                               </div>
                          </div>
                        )}
                    </div>

                    {/* LISTA DE ITENS */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="md:hidden space-y-3">
                            {itensOS.length === 0 ? (
                                <div className="text-center text-gray-500 p-6">Nenhum item lançado ainda.</div>
                            ) : itensOS.map(item => (
                                <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${
                                                item.tipo === 'PECA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {item.tipo}
                                            </span>
                                            <div className="mt-2 font-semibold text-slate-800 break-words">{item.descricao}</div>
                                        </div>
                                        {!isFuncionario && osSelecionada.status === 'ABERTA' && (
                                            <button
                                                onClick={() => handleRemoverItem(item.id)}
                                                className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full flex-shrink-0"
                                                title="Remover e estornar estoque"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className={`mt-3 grid ${isFuncionario ? 'grid-cols-1' : 'grid-cols-2'} gap-3 text-sm`}>
                                        <div className="bg-gray-50 rounded-lg p-3 border">
                                            <div className="text-xs font-bold text-gray-500 uppercase">Quantidade</div>
                                            <div className="mt-1 font-extrabold text-slate-800">{item.quantidade}</div>
                                        </div>
                                        {!isFuncionario && (
                                          <div className="bg-gray-50 rounded-lg p-3 border">
                                              <div className="text-xs font-bold text-gray-500 uppercase">Subtotal</div>
                                              <div className="mt-1 font-extrabold text-slate-800">{formatMoney(item.subtotal)}</div>
                                              <div className="mt-1 text-xs text-gray-500">Un.: {formatMoney(item.preco_un)}</div>
                                          </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Descrição</th>
                                        <th className="p-3 text-center">Qtd</th>
                                        {!isFuncionario && <th className="p-3 text-right">Preço Un.</th>}
                                        {!isFuncionario && <th className="p-3 text-right">Subtotal</th>}
                                        {!isFuncionario && osSelecionada.status === 'ABERTA' && <th className="p-3 text-center">Ação</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {itensOS.length === 0 ? (
                                        <tr><td colSpan={isFuncionario ? 3 : (osSelecionada.status === 'ABERTA' ? 6 : 5)} className="p-8 text-center text-gray-500">Nenhum item lançado ainda.</td></tr>
                                    ) : itensOS.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.tipo === 'PECA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.tipo}
                                                </span>
                                            </td>
                                            <td className="p-3 font-medium">{item.descricao}</td>
                                            <td className="p-3 text-center">{item.quantidade}</td>
                                            {!isFuncionario && <td className="p-3 text-right whitespace-nowrap">{formatMoney(item.preco_un)}</td>}
                                            {!isFuncionario && <td className="p-3 text-right font-bold whitespace-nowrap">{formatMoney(item.subtotal)}</td>}
                                            
                                            {!isFuncionario && osSelecionada.status === 'ABERTA' && (
                                                <td className="p-3 text-center">
                                                    <button 
                                                        onClick={() => handleRemoverItem(item.id)}
                                                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                                                        title="Remover e estornar estoque"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FORM ADICIONAR ITEM */}
                    {osSelecionada.status === 'ABERTA' && (
                        <form onSubmit={handleAdicionarItem} className="p-4 bg-gray-100 border-t grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                <select className="w-full p-2 rounded border" value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value, produtoId: '', descricao: '', preco: 0 })}>
                                    <option value="PECA">Peça</option>
                                    <option value="SERVICO">Mão de Obra</option>
                                </select>
                            </div>

                            <div className={isFuncionario ? 'md:col-span-7' : 'md:col-span-5'}>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Item / Descrição</label>
                                {novoItem.tipo === 'PECA' ? (
                                    <select 
                                        className="w-full p-2 rounded border" 
                                        required 
                                        value={novoItem.produtoId} 
                                        onChange={e => {
                                            const prod = produtos.find(p => p.id === parseInt(e.target.value));
                                            const precoSugerido = prod ? (Number(prod.precoVenda) || Number(prod.precoCusto)) : 0;
                                            setNovoItem({...novoItem, produtoId: e.target.value, preco: isFuncionario ? 0 : precoSugerido });
                                        }}
                                    >
                                        <option value="">Selecione a Peça...</option>
                                        {produtos.map(p => (
                                            <option key={p.id} value={p.id}>{p.codigo} - {p.descricao} (Est.: {p.qtdeAtual})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        className="w-full p-2 rounded border" 
                                        placeholder="Ex: Troca de Óleo..." 
                                        required
                                        value={novoItem.descricao}
                                        onChange={e => setNovoItem({...novoItem, descricao: e.target.value})}
                                    />
                                )}
                            </div>

                            <div className={isFuncionario ? 'md:col-span-3' : 'md:col-span-2'}>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Qtd</label>
                                <input type="number" step="0.1" className="w-full p-2 rounded border" required value={novoItem.quantidade} onChange={e => setNovoItem({...novoItem, quantidade: parseFloat(e.target.value)})} />
                            </div>
                            {!isFuncionario && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Preço (R$)</label>
                                    <input type="number" step="0.01" className="w-full p-2 rounded border font-bold text-slate-700" required value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: parseFloat(e.target.value)})} />
                                </div>
                            )}
                            
                            <div className="md:col-span-1">
                                <button type="submit" className="w-full bg-slate-800 text-white p-2 rounded hover:bg-slate-900 flex justify-center">
                                    <PlusCircle size={20} />
                                </button>
                            </div>
                        </form>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Wrench size={64} className="mb-4 opacity-20" />
                    <p className="text-lg">Selecione uma OS ao lado para ver detalhes</p>
                </div>
            )}
        </div>
      </div>

      {/* MODAL NOVA OS */}
      {!isFuncionario && modalNovaOS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Abrir Nova OS</h3>
                <form onSubmit={handleCriarOS} className="space-y-4">
                    <select className="w-full border p-2 rounded" required value={novaOS.clienteId} onChange={e => setNovaOS({...novaOS, clienteId: e.target.value})}>
                        <option value="">Selecione o Cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_razao_social}</option>)}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input className="border p-2 rounded uppercase" placeholder="Placa (ABC-1234)" required value={novaOS.placa} onChange={e => setNovaOS({...novaOS, placa: e.target.value})} />
                        <input className="border p-2 rounded" placeholder="Veículo/Modelo" required value={novaOS.veiculo} onChange={e => setNovaOS({...novaOS, veiculo: e.target.value})} />
                    </div>
                    <textarea className="w-full border p-2 rounded h-24" placeholder="Descrição do Problema..." value={novaOS.descricao} onChange={e => setNovaOS({...novaOS, descricao: e.target.value})} />
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <button type="button" onClick={() => setModalNovaOS(false)} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Abrir OS</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

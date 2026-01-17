import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatMoney } from '../../utils/format';
import { PlusCircle, Wrench, Car, User, Printer, Trash2 } from 'lucide-react'; // <--- Adicionado Trash2
import { ImpressoOS } from '../../components/ImpressoOS';

export function Servicos() {
  // ESTADOS
  const [listaOS, setListaOS] = useState<any[]>([]);
  const [osSelecionada, setOsSelecionada] = useState<any | null>(null);
  const [itensOS, setItensOS] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  
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

  useEffect(() => {
    carregarOS();
    carregarClientes();
    carregarProdutos();
  }, []);

  // --- CARREGAMENTOS ---
  async function carregarOS() {
    const res = await api.get('/os');
    setListaOS(res.data);
  }
  async function carregarClientes() {
    const res = await api.get('/clientes');
    setClientes(res.data);
  }
  async function carregarProdutos() {
    const res = await api.get('/produtos');
    setProdutos(res.data);
  }
  async function selecionarOS(os: any) {
    setOsSelecionada(os);
    const res = await api.get(`/os/${os.id}/itens`);
    setItensOS(res.data);
  }

  // --- AÇÕES ---
  async function handleCriarOS(e: React.FormEvent) {
    e.preventDefault();
    try {
        await api.post('/os', novaOS);
        alert('OS Aberta com sucesso!');
        setModalNovaOS(false);
        carregarOS();
    } catch (error) { alert('Erro ao abrir OS'); }
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
            preco: novoItem.preco
        });
        
        // Atualiza a lista de itens e a lista de OS (para atualizar o total no menu lateral)
        const resItens = await api.get(`/os/${osSelecionada.id}/itens`);
        setItensOS(resItens.data);
        carregarOS();
        setNovoItem({ tipo: 'PECA', produtoId: '', descricao: '', quantidade: 1, preco: 0 });
    } catch (error) { alert('Erro ao adicionar item'); }
  }

  // --- NOVA FUNÇÃO: REMOVER ITEM ---
  async function handleRemoverItem(itemId: number) {
    if (!confirm('Deseja remover este item da OS? Se for peça, ela voltará ao estoque.')) return;

    try {
        await api.delete(`/os/itens/${itemId}`);
        
        // Atualiza a lista
        const resItens = await api.get(`/os/${osSelecionada.id}/itens`);
        setItensOS(resItens.data);
        carregarOS(); // Atualiza total geral
    } catch (error) {
        alert('Erro ao remover item.');
        console.error(error);
    }
  }

  async function handleFinalizarOS() {
    if (!confirm('Deseja finalizar esta OS? Isso fecha o pedido.')) return;
    try {
        await api.put(`/os/${osSelecionada.id}/finalizar`, { total: calcularTotal() });
        alert('OS Finalizada!');
        carregarOS();
        setOsSelecionada(null); 
    } catch (error) { alert('Erro ao finalizar'); }
  }

  // --- IMPRESSÃO ---
  function handleImprimir() {
    window.print();
  }

  const calcularTotal = () => itensOS.reduce((acc, i) => acc + Number(i.subtotal), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <ImpressoOS os={osSelecionada} itens={itensOS} />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Ordens de Serviço</h2>
        <button onClick={() => setModalNovaOS(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-lg">
          <PlusCircle size={20} /> Nova OS
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* ESQUERDA: LISTA DE OS */}
        <div className="w-1/3 bg-white rounded-lg shadow overflow-y-auto border border-gray-200">
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
                        <p className="text-right font-bold text-blue-600 mt-2">{formatMoney(os.total)}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* DIREITA: DETALHES DA OS */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
            {osSelecionada ? (
                <>
                    {/* TOPO DETALHES */}
                    <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Car size={24} /> {osSelecionada.placa} <span className="text-gray-400 font-normal">| {osSelecionada.veiculo}</span>
                            </h3>
                            <p className="text-gray-500 mt-1 flex items-center gap-2"><User size={16}/> {osSelecionada.clientes_empresas?.nome_razao_social}</p>
                            <p className="text-sm text-orange-600 mt-2 bg-orange-50 p-2 rounded border border-orange-100">
                                <strong>Problema:</strong> {osSelecionada.descricao_problema}
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                             <div className="text-sm text-gray-500">Total OS</div>
                             <div className="text-4xl font-bold text-slate-800">{formatMoney(calcularTotal())}</div>
                             
                             <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={handleImprimir}
                                    className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 flex items-center gap-2"
                                >
                                    <Printer size={16} /> Imprimir
                                </button>

                                {osSelecionada.status === 'ABERTA' && (
                                    <button onClick={handleFinalizarOS} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-bold">
                                        Finalizar OS
                                    </button>
                                )}
                             </div>
                        </div>
                    </div>

                    {/* LISTA DE ITENS */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3 text-center">Qtd</th>
                                    <th className="p-3 text-right">Preço Un.</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                    {osSelecionada.status === 'ABERTA' && <th className="p-3 text-center">Ação</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {itensOS.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.tipo === 'PECA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {item.tipo}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium">{item.descricao}</td>
                                        <td className="p-3 text-center">{item.quantidade}</td>
                                        <td className="p-3 text-right">{formatMoney(item.preco_un)}</td>
                                        <td className="p-3 text-right font-bold">{formatMoney(item.subtotal)}</td>
                                        
                                        {/* Botão de Excluir Item */}
                                        {osSelecionada.status === 'ABERTA' && (
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

                    {/* FORM ADICIONAR ITEM */}
                    {osSelecionada.status === 'ABERTA' && (
                        <form onSubmit={handleAdicionarItem} className="p-4 bg-gray-100 border-t grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                <select className="w-full p-2 rounded border" value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value})}>
                                    <option value="PECA">Peça</option>
                                    <option value="SERVICO">Mão de Obra</option>
                                </select>
                            </div>

                            <div className="col-span-5">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Item / Descrição</label>
                                {novoItem.tipo === 'PECA' ? (
                                    <select 
                                        className="w-full p-2 rounded border" 
                                        required 
                                        value={novoItem.produtoId} 
                                        onChange={e => {
                                            const prod = produtos.find(p => p.id === parseInt(e.target.value));
                                            const precoSugerido = prod ? (Number(prod.precoVenda) || Number(prod.precoCusto)) : 0;
                                            setNovoItem({...novoItem, produtoId: e.target.value, preco: precoSugerido });
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

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Qtd</label>
                                <input type="number" step="0.1" className="w-full p-2 rounded border" required value={novoItem.quantidade} onChange={e => setNovoItem({...novoItem, quantidade: parseFloat(e.target.value)})} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Preço (R$)</label>
                                <input type="number" step="0.01" className="w-full p-2 rounded border font-bold text-slate-700" required value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: parseFloat(e.target.value)})} />
                            </div>
                            
                            <div className="col-span-1">
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
      {modalNovaOS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Abrir Nova OS</h3>
                <form onSubmit={handleCriarOS} className="space-y-4">
                    <select className="w-full border p-2 rounded" required value={novaOS.clienteId} onChange={e => setNovaOS({...novaOS, clienteId: e.target.value})}>
                        <option value="">Selecione o Cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_razao_social}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="border p-2 rounded uppercase" placeholder="Placa (ABC-1234)" required value={novaOS.placa} onChange={e => setNovaOS({...novaOS, placa: e.target.value})} />
                        <input className="border p-2 rounded" placeholder="Veículo/Modelo" required value={novaOS.veiculo} onChange={e => setNovaOS({...novaOS, veiculo: e.target.value})} />
                    </div>
                    <textarea className="w-full border p-2 rounded h-24" placeholder="Descrição do Problema..." value={novaOS.descricao} onChange={e => setNovaOS({...novaOS, descricao: e.target.value})} />
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalNovaOS(false)} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Abrir OS</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
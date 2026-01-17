import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatMoney } from '../../utils/format';
import type { Produto } from '../../types';
import { 
    PlusCircle, Search, X, Save, AlertTriangle, 
    ArrowRight, CheckCircle2, Trash2, Copy 
} from 'lucide-react';

export function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Estado da Busca ---
  const [termoBusca, setTermoBusca] = useState('');

  // Modais de Cadastro
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  
  // Estados para Lógica de Exclusão (2 Etapas)
  const [modalDeleteAberto, setModalDeleteAberto] = useState(false);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<Produto | null>(null);
  const [etapaDelete, setEtapaDelete] = useState(1); // 1 = Confirmar, 2 = Digitar Nome
  const [textoConfirmacaoDelete, setTextoConfirmacaoDelete] = useState('');

  // Estado para controle de duplicidade e feedback visual
  const [produtoExistente, setProdutoExistente] = useState<Produto | null>(null);
  const [produtoEncontradoFeedback, setProdutoEncontradoFeedback] = useState(false);

  // Estado do Formulário
  const [novoProduto, setNovoProduto] = useState({
    codigo: '',
    descricao: '',
    marca: '',
    qtde: 0,
    precoCusto: 0,
    unidade: 'UN'
  });

  useEffect(() => {
    carregarEstoque();
  }, []);

  async function carregarEstoque() {
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (error) {
      console.error("Erro ao buscar estoque", error);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE FILTRAGEM ---
  const produtosFiltrados = produtos.filter(produto => {
    if (!termoBusca) return true;
    const termo = termoBusca.toUpperCase();
    return (
        produto.codigo.toUpperCase().includes(termo) ||
        produto.descricao.toUpperCase().includes(termo) ||
        produto.marca.toUpperCase().includes(termo)
    );
  });

  // Função de busca ao sair do campo (para cadastro)
  function handleBuscarProdutoPorCodigo(codigo: string) {
    if (!codigo) return;
    const encontrado = produtos.find(p => p.codigo.trim().toUpperCase() === codigo.trim().toUpperCase());

    if (encontrado) {
        setNovoProduto(prev => ({
            ...prev,
            descricao: encontrado.descricao,
            marca: encontrado.marca,
            precoCusto: encontrado.precoCusto,
        }));
        setProdutoEncontradoFeedback(true);
        setTimeout(() => setProdutoEncontradoFeedback(false), 3000);
    }
  }

  // 1. Tenta Salvar (Verifica Duplicidade Final)
  async function handleTentativaSalvar(e: React.FormEvent) {
    e.preventDefault();
    const existente = produtos.find(p => p.codigo.toUpperCase() === novoProduto.codigo.toUpperCase());

    if (existente) {
        setProdutoExistente(existente);
        setModalConfirmacaoAberto(true);
    } else {
        await criarProdutoNovo();
    }
  }

  // 2. Criação de Produto Novo (POST)
  async function criarProdutoNovo() {
    try {
        await api.post('/produtos', novoProduto);
        alert('Produto cadastrado com sucesso!');
        resetarEstados();
        carregarEstoque();
    } catch (error) {
        alert('Erro ao salvar novo produto.');
        console.error(error);
    }
  }

  // 3. Atualização de Estoque (PUT)
  async function confirmarAtualizacaoEstoque() {
    if (!produtoExistente || !produtoExistente.id) return;

    try {
        const novaQtdeTotal = Number(produtoExistente.qtdeAtual) + Number(novoProduto.qtde);
        
        await api.put(`/produtos/${produtoExistente.id}`, {
            ...produtoExistente,
            qtdeAtual: novaQtdeTotal,
            precoCusto: novoProduto.precoCusto,
            descricao: novoProduto.descricao,
            marca: novoProduto.marca
        });

        alert('Estoque atualizado com sucesso!');
        setModalConfirmacaoAberto(false);
        resetarEstados();
        carregarEstoque();
    } catch (error) {
        alert('Erro ao atualizar estoque.');
        console.error(error);
    }
  }

  // --- LÓGICA DE EXCLUSÃO ---
  function abrirModalDelete(produto: Produto) {
      setProdutoParaDeletar(produto);
      setEtapaDelete(1);
      setTextoConfirmacaoDelete('');
      setModalDeleteAberto(true);
  }

  function fecharModalDelete() {
      setModalDeleteAberto(false);
      setProdutoParaDeletar(null);
      setTextoConfirmacaoDelete('');
  }

  function copiarNomeParaConfirmar() {
      if (produtoParaDeletar) {
          navigator.clipboard.writeText(produtoParaDeletar.descricao);
          alert('Nome copiado! Cole no campo abaixo.');
      }
  }

  async function confirmarExclusaoDefinitiva() {
      if (!produtoParaDeletar || !produtoParaDeletar.id) return;

      if (textoConfirmacaoDelete !== produtoParaDeletar.descricao) {
          alert('O nome digitado não confere com o produto.');
          return;
      }

      try {
          await api.delete(`/produtos/${produtoParaDeletar.id}`);
          alert('Produto excluído com sucesso.');
          fecharModalDelete();
          carregarEstoque();
      } catch (error: any) {
          // Tratamento melhorado para exibir a mensagem do backend
          if (error.response && error.response.data && error.response.data.error) {
              alert(error.response.data.error);
          } else {
              alert('Erro ao excluir produto. Tente novamente.');
          }
          console.error(error);
      }
  }

  function resetarEstados() {
    setModalCadastroAberto(false);
    setProdutoExistente(null);
    setProdutoEncontradoFeedback(false);
    setNovoProduto({ codigo: '', descricao: '', marca: '', qtde: 0, precoCusto: 0, unidade: 'UN' });
  }

  // Cálculos de Resumo
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.precoCusto * p.qtdeAtual), 0);
  const itensBaixoEstoque = produtos.filter(p => p.qtdeAtual < 5).length;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Controle de Estoque</h2>
        <button 
            onClick={() => setModalCadastroAberto(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
        >
          <PlusCircle size={20} />
          Lançar Entrada
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-500">Total de Itens</p>
          <p className="text-2xl font-bold">{produtos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-500">Valor em Estoque</p>
          <p className="text-2xl font-bold">{formatMoney(valorTotalEstoque)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500">Estoque Baixo (Alerta)</p>
          <p className="text-2xl font-bold">{itensBaixoEstoque} itens</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex gap-4 bg-gray-50">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por código, descrição ou marca..." 
                    className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={termoBusca}
                    onChange={e => setTermoBusca(e.target.value)}
                />
            </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Marca</th>
              <th className="p-4">Qtde</th>
              <th className="p-4">Preço Un.</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando estoque...</td></tr>
            ) : produtos.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum produto cadastrado no sistema.</td></tr>
            ) : produtosFiltrados.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum produto encontrado para "{termoBusca}".</td></tr>
            ) : produtosFiltrados.map((produto) => (
              <tr key={produto.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4 font-medium text-blue-600">{produto.codigo}</td>
                <td className="p-4 font-semibold text-gray-700">{produto.descricao}</td>
                <td className="p-4 text-gray-500">{produto.marca}</td>
                <td className={`p-4 font-bold ${produto.qtdeAtual < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                    {produto.qtdeAtual} <span className="text-xs font-normal text-gray-400">un</span>
                </td>
                <td className="p-4">{formatMoney(produto.precoCusto)}</td>
                <td className="p-4 text-right font-medium">{formatMoney(Number(produto.precoCusto) * produto.qtdeAtual)}</td>
                <td className="p-4 text-center">
                    <button 
                        onClick={() => abrirModalDelete(produto)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                        title="Excluir Produto"
                    >
                        <Trash2 size={18} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE CADASTRO --- */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[50] backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 relative">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800">Nova Entrada de Estoque</h3>
                    <button onClick={resetarEstados} className="text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleTentativaSalvar} className="grid grid-cols-2 gap-4">
                    <div className="col-span-1 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código da Peça</label>
                        <div className="relative">
                            <input 
                                required
                                type="text" 
                                className={`w-full border rounded p-2 outline-none uppercase font-bold text-slate-700 ${produtoEncontradoFeedback ? 'border-green-500 ring-2 ring-green-100' : 'focus:ring-2 focus:ring-blue-500'}`}
                                value={novoProduto.codigo}
                                onChange={e => setNovoProduto({...novoProduto, codigo: e.target.value})}
                                onBlur={(e) => handleBuscarProdutoPorCodigo(e.target.value)} 
                                placeholder="Ex: FIL-2024"
                            />
                            {produtoEncontradoFeedback && (
                                <div className="absolute right-2 top-2.5 text-green-600 animate-bounce">
                                    <CheckCircle2 size={20} />
                                </div>
                            )}
                        </div>
                        {produtoEncontradoFeedback && <span className="text-xs text-green-600 font-bold mt-1 block">Produto Encontrado! Dados carregados.</span>}
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                        <input 
                            type="text" 
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            value={novoProduto.marca}
                            onChange={e => setNovoProduto({...novoProduto, marca: e.target.value})}
                            placeholder="Ex: Bosch"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            value={novoProduto.descricao}
                            onChange={e => setNovoProduto({...novoProduto, descricao: e.target.value})}
                            placeholder="Ex: Filtro de Óleo Scania Série 5"
                        />
                    </div>
                    
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Entrada</label>
                        <input 
                            required
                            type="number" 
                            min="1"
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            value={novoProduto.qtde}
                            onChange={e => setNovoProduto({...novoProduto, qtde: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo (Un)</label>
                        <input 
                            required
                            type="number" 
                            step="0.01"
                            min="0"
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            value={novoProduto.precoCusto}
                            onChange={e => setNovoProduto({...novoProduto, precoCusto: parseFloat(e.target.value)})}
                        />
                    </div>

                    <div className="col-span-2 mt-4 flex justify-end gap-3 border-t pt-4">
                        <button 
                            type="button"
                            onClick={resetarEstados}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 font-bold"
                        >
                            <Save size={18} />
                            Salvar Entrada
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMAÇÃO DE DUPLICIDADE --- */}
      {modalConfirmacaoAberto && produtoExistente && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div className="text-center">
                    <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Entrada</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        O produto <strong>{produtoExistente.descricao}</strong> já existe.
                        Deseja confirmar a atualização do saldo?
                    </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Saldo Atual:</span>
                        <span className="font-bold text-slate-700 text-lg">{produtoExistente.qtdeAtual}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-600 font-bold">+ Entrada:</span>
                        <span className="font-bold text-blue-600 text-lg">{novoProduto.qtde}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center bg-slate-100 -mx-4 px-4 py-2 rounded-b mt-2">
                        <span className="text-slate-800 font-bold uppercase text-xs">Novo Saldo:</span>
                        <div className="flex items-center gap-2">
                            <ArrowRight size={16} className="text-gray-400" />
                            <span className="font-extrabold text-green-600 text-2xl">
                                {Number(produtoExistente.qtdeAtual) + Number(novoProduto.qtde)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setModalConfirmacaoAberto(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                    >
                        Revisar
                    </button>
                    <button 
                        onClick={confirmarAtualizacaoEstoque}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                    >
                        CONFIRMAR
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO (2 ETAPAS) --- */}
      {modalDeleteAberto && produtoParaDeletar && (
        <div className="fixed inset-0 bg-red-900/40 flex items-center justify-center z-[70] backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 border-t-4 border-red-600">
                
                {/* ETAPA 1: CONFIRMAÇÃO SIMPLES */}
                {etapaDelete === 1 && (
                    <div className="text-center">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Produto?</h3>
                        <p className="text-gray-500 mb-6">
                            Você tem certeza que deseja iniciar o processo de exclusão para o produto:<br/>
                            <strong className="text-slate-800">{produtoParaDeletar.codigo} - {produtoParaDeletar.descricao}</strong>?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={fecharModalDelete}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => setEtapaDelete(2)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold flex items-center justify-center gap-2"
                            >
                                Sim, continuar <ArrowRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* ETAPA 2: DIGITAR NOME */}
                {etapaDelete === 2 && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                <AlertTriangle size={20}/> Confirmação Final
                            </h3>
                            <button onClick={fecharModalDelete} className="text-gray-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            Para excluir definitivamente, digite o nome exato do produto abaixo:
                        </p>

                        <div className="bg-slate-100 p-3 rounded border border-slate-300 mb-4 flex justify-between items-center">
                            <code className="text-xs font-bold text-slate-700 break-all">
                                {produtoParaDeletar.descricao}
                            </code>
                            <button 
                                onClick={copiarNomeParaConfirmar}
                                className="ml-2 text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-white transition-colors"
                                title="Copiar nome"
                            >
                                <Copy size={14} />
                            </button>
                        </div>

                        <input 
                            type="text" 
                            className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="Digite o nome do produto..."
                            value={textoConfirmacaoDelete}
                            onChange={e => setTextoConfirmacaoDelete(e.target.value)}
                            onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData('text');
                                setTextoConfirmacaoDelete(text);
                            }}
                        />

                        <button 
                            onClick={confirmarExclusaoDefinitiva}
                            disabled={textoConfirmacaoDelete !== produtoParaDeletar.descricao}
                            className={`w-full py-3 rounded font-bold transition-all ${
                                textoConfirmacaoDelete === produtoParaDeletar.descricao 
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            EXCLUIR DEFINITIVAMENTE
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
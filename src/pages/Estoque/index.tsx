import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Produto } from '../../types';
import { PlusCircle, Search, X, Save } from 'lucide-react';

export function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

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

  async function handleSalvarProduto(e: React.FormEvent) {
    e.preventDefault(); // Evita recarregar a tela
    try {
        await api.post('/produtos', novoProduto);
        alert('Produto cadastrado com sucesso!');
        setModalAberto(false); // Fecha modal
        setNovoProduto({ codigo: '', descricao: '', marca: '', qtde: 0, precoCusto: 0, unidade: 'UN' }); // Limpa form
        carregarEstoque(); // Recarrega a tabela
    } catch (error) {
        alert('Erro ao salvar. Verifique se o código já existe.');
        console.error(error);
    }
  }

  // Cálculos de Resumo
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.precoCusto * p.qtdeAtual), 0);
  const itensBaixoEstoque = produtos.filter(p => p.qtdeAtual < 5).length;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Controle de Estoque</h2>
        <button 
            onClick={() => setModalAberto(true)}
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
          <p className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</p>
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
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando estoque...</td></tr>
            ) : produtos.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum produto encontrado. Clique em "Lançar Entrada".</td></tr>
            ) : produtos.map((produto) => (
              <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-blue-600">{produto.codigo}</td>
                <td className="p-4 font-semibold text-gray-700">{produto.descricao}</td>
                <td className="p-4 text-gray-500">{produto.marca}</td>
                <td className={`p-4 font-bold ${produto.qtdeAtual < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                    {produto.qtdeAtual} <span className="text-xs font-normal text-gray-400">un</span>
                </td>
                <td className="p-4">R$ {Number(produto.precoCusto).toFixed(2)}</td>
                <td className="p-4 text-right font-medium">R$ {(Number(produto.precoCusto) * produto.qtdeAtual).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE CADASTRO --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800">Nova Entrada de Estoque</h3>
                    <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSalvarProduto} className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código da Peça</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                            value={novoProduto.codigo}
                            onChange={e => setNovoProduto({...novoProduto, codigo: e.target.value})}
                            placeholder="Ex: FIL-2024"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                        <input 
                            type="text" 
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={novoProduto.descricao}
                            onChange={e => setNovoProduto({...novoProduto, descricao: e.target.value})}
                            placeholder="Ex: Filtro de Óleo Scania Série 5"
                        />
                    </div>
                    
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                        <input 
                            required
                            type="number" 
                            min="1"
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={novoProduto.precoCusto}
                            onChange={e => setNovoProduto({...novoProduto, precoCusto: parseFloat(e.target.value)})}
                        />
                    </div>

                    <div className="col-span-2 mt-4 flex justify-end gap-3 border-t pt-4">
                        <button 
                            type="button"
                            onClick={() => setModalAberto(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 font-bold"
                        >
                            <Save size={18} />
                            Salvar no Estoque
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
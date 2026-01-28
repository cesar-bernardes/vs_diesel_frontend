import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, Plus, Trash2, Key, X, Save, Shield } from 'lucide-react';

interface Usuario {
  id: number;
  nome: string;
  cargo: string;
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  
  // 1. NOVO ESTADO PARA CONFIRMAR SENHA
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState(''); 
  
  const [cargo, setCargo] = useState('FUNCIONARIO');

  function carregarUsuarios() {
    api.get('/usuarios')
      .then((res) => setUsuarios(res.data))
      .catch(() => console.error('Erro ao carregar usuários'));
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function abrirModalCriar() {
      setModoEdicao(false);
      setNome('');
      setSenha('');
      setConfirmarSenha(''); // Reseta confirmação
      setCargo('FUNCIONARIO');
      setModalAberto(true);
  }

  function abrirModalSenha(user: Usuario) {
      setModoEdicao(true);
      setIdSelecionado(user.id);
      setNome(user.nome);
      setSenha('');
      setConfirmarSenha(''); // Reseta confirmação
      setModalAberto(true);
  }

  async function handleSalvar(e: React.FormEvent) {
      e.preventDefault();

      // 2. VALIDAÇÃO NO FRONTEND (Visual)
      if (senha !== confirmarSenha) {
          alert("As senhas não coincidem!");
          return;
      }

      try {
          if (modoEdicao) {
              // Envia novaSenha e confirmarSenha
              await api.put(`/usuarios/${idSelecionado}`, { novaSenha: senha, confirmarSenha });
              alert('Senha alterada com sucesso!');
          } else {
              // Envia senha e confirmarSenha
              await api.post('/usuarios', { nome, senha, confirmarSenha, cargo });
              alert('Usuário criado com sucesso!');
          }
          setModalAberto(false);
          carregarUsuarios();
      } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: string } } };
          alert(err.response?.data?.error || 'Erro ao salvar');
      }
  }

  async function handleExcluir(id: number, nomeUser: string) {
      if (!confirm(`Tem certeza que deseja excluir o usuário ${nomeUser}?`)) return;
      try {
          await api.delete(`/usuarios/${id}`);
          alert('Usuário removido.');
          carregarUsuarios();
      } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: string } } };
          alert(err.response?.data?.error || 'Erro ao excluir');
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-3xl font-bold text-slate-800">Gerenciar Usuários</h2>
        <button onClick={abrirModalCriar} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md w-full sm:w-auto">
            <Plus size={20} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:hidden divide-y">
            {usuarios.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum usuário cadastrado.</div>
            ) : usuarios.map(u => (
                <div key={u.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 font-bold text-slate-700">
                                <div className={`p-2 rounded-lg ${u.cargo === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {u.cargo === 'ADMIN' ? <Shield size={18} /> : <User size={18}/>}
                                </div>
                                <div className="min-w-0">
                                    <div className="break-words">{u.nome}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">#{u.id}</div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    u.cargo === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                    u.cargo === 'GESTOR' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {u.cargo || 'FUNCIONARIO'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => abrirModalSenha(u)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="Alterar Senha">
                                <Key size={18} />
                            </button>
                            <button onClick={() => handleExcluir(u.id, u.nome)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Excluir Usuário">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold border-b border-slate-200">
                    <tr>
                        <th className="p-4 w-20 text-center">ID</th>
                        <th className="p-4">Usuário</th>
                        <th className="p-4">Cargo</th>
                        <th className="p-4 w-32 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {usuarios.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum usuário cadastrado.</td></tr>
                    ) : usuarios.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-center text-gray-500 font-mono text-sm">#{u.id}</td>
                            
                            <td className="p-4">
                                <div className="flex items-center gap-3 font-bold text-slate-700">
                                    <div className={`p-2 rounded-lg ${u.cargo === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {u.cargo === 'ADMIN' ? <Shield size={18} /> : <User size={18}/>}
                                    </div>
                                    {u.nome}
                                </div>
                            </td>

                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    u.cargo === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                    u.cargo === 'GESTOR' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {u.cargo || 'FUNCIONARIO'}
                                </span>
                            </td>

                            <td className="p-4">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => abrirModalSenha(u)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="Alterar Senha">
                                        <Key size={18} />
                                    </button>
                                    <button onClick={() => handleExcluir(u.id, u.nome)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Excluir Usuário">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {modalAberto && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200 max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                      <h3 className="text-xl font-bold text-slate-800">{modoEdicao ? 'Alterar Senha' : 'Novo Usuário'}</h3>
                      <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                  </div>
                  
                  <form onSubmit={handleSalvar} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Nome de Usuário</label>
                          <input 
                            type="text" 
                            disabled={modoEdicao} 
                            className="w-full border border-slate-300 p-3 rounded-lg bg-slate-50 uppercase font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            value={nome} 
                            onChange={e => setNome(e.target.value.toUpperCase())} 
                            required 
                          />
                      </div>

                      {!modoEdicao && (
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Nível de Acesso</label>
                              <select 
                                value={cargo} 
                                onChange={e => setCargo(e.target.value)}
                                className="w-full border border-slate-300 p-3 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                  <option value="FUNCIONARIO">Funcionário (Acesso Básico)</option>
                                  <option value="GESTOR">Gestor (Sem acesso a Usuários)</option>
                                  <option value="ADMIN">Administrador (Acesso Total)</option>
                              </select>
                          </div>
                      )}

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{modoEdicao ? 'Nova Senha' : 'Senha'}</label>
                          <input 
                            type="password" 
                            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            value={senha} 
                            onChange={e => setSenha(e.target.value)} 
                            required 
                            placeholder="••••••" 
                          />
                      </div>

                      {/* 3. AQUI ESTÁ O NOVO CAMPO DE CONFIRMAÇÃO VISUAL */}
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Senha</label>
                          <input 
                            type="password" 
                            className={`w-full border p-3 rounded-lg focus:ring-2 outline-none transition-all ${
                                confirmarSenha && senha !== confirmarSenha 
                                ? 'border-red-500 focus:ring-red-200' 
                                : 'border-slate-300 focus:ring-blue-500'
                            }`}
                            value={confirmarSenha} 
                            onChange={e => setConfirmarSenha(e.target.value)} 
                            required 
                            placeholder="Repita a senha" 
                          />
                          {confirmarSenha && senha !== confirmarSenha && (
                              <p className="text-xs text-red-500 mt-1 font-bold">As senhas não conferem.</p>
                          )}
                      </div>
                      
                      <button type="submit" className="bg-slate-900 text-white w-full py-3 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 font-bold shadow-lg mt-4 transition-all">
                          <Save size={18} /> Salvar
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}

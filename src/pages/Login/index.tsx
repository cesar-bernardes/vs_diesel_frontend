import { useState } from 'react';
import { api } from '../../services/api'; // Usamos nossa API agora
import { Lock, User } from 'lucide-react';

export function Login() {
  const [nome, setNome] = useState(''); // Mudou de email para nome
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
        // Chama nossa rota customizada no backend
        const response = await api.post('/login', { nome, senha });
        
        // Salva o token no navegador
        localStorage.setItem('vs_token', response.data.token);
        localStorage.setItem('vs_user', JSON.stringify(response.data.user));

        // Força uma atualização do cabeçalho da API (para o interceptor pegar o token novo)
        window.location.href = '/'; 
        
    } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        alert(err.response?.data?.error || 'Erro ao entrar');
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">VR DIESEL</h1>
            <p className="text-gray-500">Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400"><User size={20}/></div>
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                        placeholder="ADMIN"
                        value={nome}
                        onChange={e => setNome(e.target.value.toUpperCase())}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400"><Lock size={20}/></div>
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
                {loading ? 'Validando...' : 'ENTRAR'}
            </button>
        </form>
      </div>
    </div>
  );
}

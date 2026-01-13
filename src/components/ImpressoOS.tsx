import { Car, Wrench, User, Calendar } from 'lucide-react';

interface ImpressoOSProps {
  os: any;
  itens: any[];
}

export function ImpressoOS({ os, itens }: ImpressoOSProps) {
  if (!os) return null;

  const totalServicos = itens.filter(i => i.tipo === 'SERVICO').reduce((acc, i) => acc + Number(i.subtotal), 0);
  const totalPecas = itens.filter(i => i.tipo === 'PECA').reduce((acc, i) => acc + Number(i.subtotal), 0);

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
            <h1 className="text-4xl font-bold uppercase tracking-wider">VS Diesel</h1>
            <p className="text-sm mt-1">Especialista em Injeção e Mecânica Pesada</p>
            <p className="text-sm">CNPJ: 00.000.000/0001-00</p>
            <p className="text-sm">Tel: (00) 0000-0000</p>
        </div>
        <div className="text-right">
            <h2 className="text-2xl font-bold">ORDEM DE SERVIÇO</h2>
            <p className="text-xl text-red-600 font-mono">#{os.id.toString().padStart(6, '0')}</p>
            <p className="text-sm mt-2 font-bold">Data: {new Date(os.data_abertura).toLocaleDateString('pt-BR')}</p>
            <p className="text-xs text-gray-500">
                Status: <span className="uppercase font-bold">{os.status}</span>
            </p>
        </div>
      </div>

      {/* DADOS DO CLIENTE E VEÍCULO */}
      <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
        <div className="border p-3 rounded">
            <h3 className="font-bold border-b mb-2 flex items-center gap-2"><User size={16}/> Cliente</h3>
            <p><span className="font-bold">Nome:</span> {os.clientes_empresas?.nome_razao_social}</p>
            <p><span className="font-bold">CPF/CNPJ:</span> {os.clientes_empresas?.cnpj_cpf}</p>
            <p><span className="font-bold">Telefone:</span> {os.clientes_empresas?.telefone}</p>
        </div>
        <div className="border p-3 rounded">
            <h3 className="font-bold border-b mb-2 flex items-center gap-2"><Car size={16}/> Veículo</h3>
            <p><span className="font-bold">Veículo:</span> {os.veiculo}</p>
            <p><span className="font-bold">Placa:</span> {os.placa}</p>
            <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-1 rounded">
                <strong>Defeito Relatado:</strong> {os.descricao_problema}
            </div>
        </div>
      </div>

      {/* TABELA DE ITENS */}
      <table className="w-full text-left text-sm mb-6 border-collapse">
        <thead>
            <tr className="bg-gray-200 uppercase text-xs">
                <th className="p-2 border border-gray-300">Tipo</th>
                <th className="p-2 border border-gray-300">Descrição</th>
                <th className="p-2 border border-gray-300 text-center">Qtd</th>
                <th className="p-2 border border-gray-300 text-right">Unitário</th>
                <th className="p-2 border border-gray-300 text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            {itens.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                    <td className="p-2 border border-gray-300 text-xs">{item.tipo}</td>
                    <td className="p-2 border border-gray-300">{item.descricao}</td>
                    <td className="p-2 border border-gray-300 text-center">{item.quantidade}</td>
                    <td className="p-2 border border-gray-300 text-right">R$ {Number(item.preco_un).toFixed(2)}</td>
                    <td className="p-2 border border-gray-300 text-right font-bold">R$ {Number(item.subtotal).toFixed(2)}</td>
                </tr>
            ))}
        </tbody>
      </table>

      {/* TOTAIS */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
                <span>Total Peças:</span>
                <span>R$ {totalPecas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span>Total Serviços:</span>
                <span>R$ {totalServicos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t-2 border-black pt-2">
                <span>TOTAL GERAL:</span>
                <span>R$ {Number(os.total).toFixed(2)}</span>
            </div>
        </div>
      </div>

      {/* ASSINATURAS */}
      <div className="grid grid-cols-2 gap-12 mt-auto pt-12">
        <div className="text-center">
            <div className="border-t border-black mb-2"></div>
            <p className="text-xs uppercase">Assinatura do Responsável (Oficina)</p>
        </div>
        <div className="text-center">
            <div className="border-t border-black mb-2"></div>
            <p className="text-xs uppercase">De acordo do Cliente</p>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 print:block hidden">
        Sistema VS Diesel - Gerado em {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
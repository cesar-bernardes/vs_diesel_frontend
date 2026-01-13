export interface Produto {
  id?: number;
  codigo: string;
  descricao: string;
  marca: string;
  qtdeAtual: number;
  precoCusto: number;
}

export interface FaturamentoDTO {
  clienteId: number;
  valorTotal: number;
  qtdeParcelas: number;
  numeroDocumento: string;
  dataPrimeiroVencimento: string;
}
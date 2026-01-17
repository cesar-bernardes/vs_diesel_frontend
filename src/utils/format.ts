export function formatMoney(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return 'R$ 0,00';
  }

  const numberValue = typeof value === 'string' ? parseFloat(value) : value;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}
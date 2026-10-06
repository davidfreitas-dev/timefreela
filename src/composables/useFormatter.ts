/**
 * Composable for data formatting (Currency, CPF, CNPJ, Phone, etc.)
 */
export function useFormatter() {
  /**
   * Formats a number as BRL currency
   */
  const formatCurrency = (value: number | string) => {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  /**
   * Formats a string as CPF (000.000.000-00)
   */
  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  /**
   * Formats a string as CNPJ (00.000.000/0000-00)
   */
  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  /**
   * Formats a string as CPF or CNPJ based on length
   */
  const formatCPFCNPJ = (value: string | undefined | null) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) return formatCPF(cleanValue);
    if (cleanValue.length <= 14) return formatCNPJ(cleanValue);
    return cleanValue;
  };

  /**
   * Formats a string as Phone ( (00) 0000-0000 or (00) 00000-0000 )
   */
  const formatPhone = (value: string | undefined | null) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length === 11) {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    if (cleanValue.length === 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return cleanValue;
  };

  /**
   * Formats a string as CEP (00000-000)
   */
  const formatCEP = (value: string | undefined | null) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  return {
    formatCurrency,
    formatCPF,
    formatCNPJ,
    formatCPFCNPJ,
    formatPhone,
    formatCEP
  };
}

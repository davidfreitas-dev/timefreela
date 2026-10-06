/**
 * Formata uma string para o padrão de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export const formatBrazilianPhone = (value: string): string => {
  if (!value) return '';

  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');

  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = digits.slice(0, 11);

  if (limited.length <= 2) {
    return limited;
  }
  if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  }
  if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

/**
 * Formata uma string para o padrão de CPF brasileiro: XXX.XXX.XXX-XX
 */
export const formatCpf = (value: string): string => {
  if (!value) return '';

  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

/**
 * Formata uma string para o padrão de CNPJ brasileiro: XX.XXX.XXX/XXXX-XX
 */
export const formatCnpj = (value: string): string => {
  if (!value) return '';

  const digits = value.replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

/**
 * Formata uma string de forma dinâmica para CPF ou CNPJ baseado no número de dígitos
 */
export const formatCpfCnpj = (value: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return formatCpf(digits);
  }
  return formatCnpj(digits);
};

/**
 * Formata uma string para o padrão de CEP brasileiro: XXXXX-XXX
 */
export const formatCep = (value: string): string => {
  if (!value) return '';

  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/**
 * Formata um valor numérico (em centavos) para exibição de moeda (R$)
 */
export const formatCentsToCurrency = (value: string | number): string => {
  const floatValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(floatValue)) return '';
  return (floatValue / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Aplica a máscara de moeda a uma string em tempo real (input do usuário)
 */
export const applyCurrencyMask = (value: string): string => {
  const numericValue = value.replace(/\D/g, '');
  const floatValue = parseFloat(numericValue || '0') / 100;
  return floatValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Converte a string com máscara de moeda de volta para um valor inteiro (centavos)
 */
export const parseCurrency = (value: string): number => {
  const numericValue = value.replace(/\D/g, '');
  return parseInt(numericValue || '0', 10);
};

/**
 * Formata de forma dinâmica para E-mail ou CPF/CNPJ.
 * Se tiver letras ou @, retorna como está (e-mail).
 * Se tiver apenas números e pontuações, formata como CPF/CNPJ.
 */
export const formatEmailOrCpfCnpj = (value: string): string => {
  if (!value) return '';
  
  if (/[a-zA-Z@]/.test(value)) {
    return value.replace(/\s/g, '');
  }

  return formatCpfCnpj(value);
};

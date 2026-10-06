import { helpers } from '@vuelidate/validators';

export const validPhone = helpers.withMessage('Telefone inválido', (value: string) => {
  if (!value) return true; // Opcional por padrão, use required se precisar
  return value.length >= 14; // (XX) XXXX-XXXX (14) ou (XX) XXXXX-XXXX (15)
});

export const strongPassword = helpers.withMessage(
  'A senha deve ter no mínimo 8 caracteres, contendo maiúsculas, minúsculas, números e caracteres especiais',
  helpers.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
);

import { email as vuelidateEmail } from '@vuelidate/validators';

export const isValidCpfCnpj = helpers.withMessage('CPF ou CNPJ inválido', (value: string) => {
  if (!value) return false;
  const numbersOnly = value.replace(/\D/g, '');
  if (numbersOnly.length !== 11 && numbersOnly.length !== 14) return false;
  
  if (numbersOnly.length === 11) {
    if (/^(\d)\1+$/.test(numbersOnly)) return false;
    let sum = 0, remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(numbersOnly.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbersOnly.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(numbersOnly.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbersOnly.substring(10, 11))) return false;
    return true;
  } else {
    if (/^(\d)\1+$/.test(numbersOnly)) return false;
    let size = numbersOnly.length - 2;
    let numbers = numbersOnly.substring(0, size);
    const digits = numbersOnly.substring(size);
    let sum = 0, pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    size = size + 1;
    numbers = numbersOnly.substring(0, size);
    sum = 0; pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    return true;
  }
});

export const emailOrCpfCnpj = helpers.withMessage(
  'Informe um e-mail válido ou um CPF/CNPJ',
  (value: string) => {
    if (!value) return false;
    // @ts-expect-error - Vuelidate types are poorly inferred
    const isValidDoc = isValidCpfCnpj.$validator ? isValidCpfCnpj.$validator(value) : false;
    const isEmail = vuelidateEmail.$validator(value, null, null);
    return isEmail || isValidDoc;
  }
);

export const fullName = helpers.withMessage(
  'Informe o nome e o sobrenome (sem números ou símbolos)',
  helpers.regex(/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ'-]+(?:\s+[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ'-]+)+$/)
);

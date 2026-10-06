import { helpers } from '@vuelidate/validators';

export const strongPassword = helpers.withMessage(
  'A senha deve ter no mínimo 8 caracteres, contendo maiúsculas, minúsculas, números e caracteres especiais',
  helpers.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
);

export const fullName = helpers.withMessage(
  'Informe o nome e o sobrenome (sem números ou símbolos)',
  helpers.regex(/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ'-]+(?:\s+[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ'-]+)+$/)
);

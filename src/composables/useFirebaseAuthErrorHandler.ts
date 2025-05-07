type AuthErrorCode =
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/invalid-credential'
  | 'auth/invalid-email'
  | 'auth/email-already-in-use'
  | 'auth/wrong-password'
  | 'auth/weak-password'
  | 'auth/too-many-requests'
  | 'auth/popup-closed-by-user'
  | 'auth/network-request-failed'
  | 'auth/internal-error'
  | 'auth/configuration-not-found';

const authErrorMessages: Record<AuthErrorCode, string> = {
  'auth/user-disabled': 'Conta desativada.',
  'auth/user-not-found': 'Conta não encontrada.',
  'auth/invalid-credential': 'Credenciais inválidas.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'E-mail já em uso por outro usuário.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/weak-password': 'Sua senha deve possuir no mínimo 6 caracteres.',
  'auth/too-many-requests': 'Conta bloqueada por excesso de tentativas.',
  'auth/popup-closed-by-user': 'Pop-up fechado antes do login.',
  'auth/network-request-failed': 'Falha na conexão. Verifique sua internet.',
  'auth/internal-error': 'Erro interno. Contate o suporte.',
  'auth/configuration-not-found': 'Erro na configuração do Firebase Authentication',
};

export function useFirebaseAuthErrorHandler() {
  const getErrorMessage = (code: string): string => {
    return authErrorMessages[code as AuthErrorCode] 
      || 'Ocorreu um erro inesperado. Tente novamente.';
  };

  return {
    getErrorMessage,
  };
}

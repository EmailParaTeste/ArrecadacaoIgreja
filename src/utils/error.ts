export const getErrorMessage = (error: any): string => {
  const code = error?.code;
  const message = error?.message || 'Erro desconhecido';

  // If it's a custom error without a Firebase code, return the message
  if (!code) {
    return message;
  }
  switch (code) {
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/user-disabled':
      return 'Usuário desativado.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este email já está em uso.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'Operação não permitida.';
    case 'auth/missing-email':
      return 'O email é obrigatório.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
  }

  // Firestore Errors
  if (code === 'permission-denied' || message.includes('Missing or insufficient permissions')) {
    return 'Permissão negada. Você não tem acesso a esta ação.';
  }
  if (code === 'unavailable') {
    return 'Serviço indisponível. Verifique sua conexão.';
  }

  // Generic fallback
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

// Authentication error messages arrive from the backend in English.
// This maps the known ones to Brazilian Portuguese so the user never sees a raw server string.

type Rule = {
  test: RegExp;
  toPortuguese: (match: RegExpMatchArray) => string;
};

const RULES: Rule[] = [
  {
    test: /password is known to be weak and easy to guess|password is too (?:weak|common)/i,
    toPortuguese: () => "Essa senha é fraca e fácil de adivinhar. Escolha outra.",
  },
  {
    test: /found in (?:previously )?recorded data breaches|found in data breaches|pwned/i,
    toPortuguese: () => "Essa senha já apareceu em vazamentos de dados. Escolha outra.",
  },
  {
    test: /password should be at least (\d+) characters?/i,
    toPortuguese: (m) => `A senha deve ter ao menos ${m[1]} caracteres.`,
  },
  {
    test: /new password should be different from the old password/i,
    toPortuguese: () => "A nova senha deve ser diferente da senha atual.",
  },
  {
    test: /already (?:been )?registered|email already (?:in use|exists)/i,
    toPortuguese: () => "Este e-mail já está cadastrado.",
  },
  {
    test: /invalid login credentials/i,
    toPortuguese: () => "E-mail ou senha incorretos.",
  },
  {
    test: /email (?:address )?not confirmed/i,
    toPortuguese: () => "Confirme seu e-mail antes de entrar. Reenvie o link de confirmação.",
  },
  {
    test: /phone (?:number )?not confirmed/i,
    toPortuguese: () => "Confirme seu número de telefone antes de continuar.",
  },
  {
    test: /only request this after (\d+) seconds/i,
    toPortuguese: (m) => `Aguarde ${m[1]} segundos para fazer nova solicitação.`,
  },
  {
    test: /email rate limit exceeded|too many requests|rate limit/i,
    toPortuguese: () => "Muitas tentativas em sequência. Aguarde um pouco e tente de novo.",
  },
  {
    test: /unable to validate email address/i,
    toPortuguese: () => "Informe um e-mail válido.",
  },
  {
    test: /signups? not allowed/i,
    toPortuguese: () => "Novos cadastros estão desativados no momento.",
  },
  {
    test: /email could not be sent/i,
    toPortuguese: () => "Não foi possível enviar o e-mail. Tente novamente.",
  },
  {
    test: /unable to create user profile/i,
    toPortuguese: () => "Não foi possível criar sua conta. Tente novamente.",
  },
  {
    test: /invalid captcha/i,
    toPortuguese: () => "A validação de segurança falhou. Tente novamente.",
  },
  {
    test: /invalid or expired|session expired|jwt expired|invalid refresh token/i,
    toPortuguese: () => "Sua sessão expirou. Entre novamente.",
  },
  {
    test: /unsupported provider|external provider not found/i,
    toPortuguese: () => "Este método de acesso não está disponível. Use e-mail e senha.",
  },
];

export function translateAuthError(
  raw: string | null | undefined,
  fallback = "Não foi possível concluir. Tente novamente.",
): string {
  const message = (raw ?? "").trim();
  if (!message) return fallback;
  for (const rule of RULES) {
    const match = message.match(rule.test);
    if (match) return rule.toPortuguese(match);
  }
  return fallback;
}

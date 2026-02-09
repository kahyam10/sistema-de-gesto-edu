/**
 * Utilitário de validação de CPF no frontend
 */

export class CPFValidator {
  /**
   * Remove caracteres não numéricos do CPF
   */
  static clean(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  /**
   * Formata CPF para o padrão XXX.XXX.XXX-XX
   */
  static format(cpf: string): string {
    const cleaned = this.clean(cpf);
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Máscara CPF enquanto o usuário digita
   */
  static mask(value: string): string {
    const cleaned = this.clean(value);
    const limited = cleaned.substring(0, 11);

    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  }

  /**
   * Valida formato e dígitos verificadores do CPF
   */
  static validate(cpf: string): boolean {
    const cleaned = this.clean(cpf);

    // Verifica se tem 11 dígitos
    if (cleaned.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido conhecido)
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) {
      return false;
    }

    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(10))) {
      return false;
    }

    return true;
  }

  /**
   * Valida e retorna mensagem de erro se inválido
   */
  static validateWithMessage(cpf: string): { valid: boolean; message?: string } {
    if (!cpf || cpf.trim() === '') {
      return { valid: true }; // CPF opcional
    }

    const cleaned = this.clean(cpf);

    if (cleaned.length !== 11) {
      return {
        valid: false,
        message: 'CPF deve conter 11 dígitos',
      };
    }

    if (/^(\d)\1{10}$/.test(cleaned)) {
      return {
        valid: false,
        message: 'CPF inválido',
      };
    }

    if (!this.validate(cpf)) {
      return {
        valid: false,
        message: 'CPF inválido - dígitos verificadores incorretos',
      };
    }

    return { valid: true };
  }
}

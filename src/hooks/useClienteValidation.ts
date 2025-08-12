import { useState } from 'react';

export interface ValidationErrors {
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
}

export function useClienteValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cleanCPF.charAt(10));
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validate first digit
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    // Validate second digit
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    return digit2 === parseInt(cleanCNPJ.charAt(13));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateTelefone = (telefone: string): boolean => {
    const cleanPhone = telefone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const validateClienteData = (data: Record<string, string>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate CPF
    if (data.cpf && !validateCPF(data.cpf)) {
      newErrors.cpf = 'CPF inválido';
      isValid = false;
    }

    // Validate CNPJ
    if (data.cnpj && !validateCNPJ(data.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
      isValid = false;
    }

    // Validate Email
    if (data.email && !validateEmail(data.email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    // Validate Telefone
    if (data.telefone && !validateTelefone(data.telefone)) {
      newErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const formatCPF = (cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (cnpj: string): string => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatTelefone = (telefone: string): string => {
    const cleanPhone = telefone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  return {
    errors,
    validateClienteData,
    formatCPF,
    formatCNPJ,
    formatTelefone,
    clearErrors: () => setErrors({})
  };
}
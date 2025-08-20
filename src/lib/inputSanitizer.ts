// Input sanitization utilities to prevent XSS and injection attacks

/**
 * Sanitizes string input by removing potentially dangerous characters
 */
export const sanitizeString = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Limit length to prevent DoS
    .substring(0, 1000);
};

/**
 * Sanitizes email input
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  
  const sanitized = sanitizeString(email).toLowerCase();
  
  // Basic email validation - more comprehensive validation should be done elsewhere
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitizes phone number input
 */
export const sanitizePhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Only allow numbers, spaces, parentheses, hyphens, and plus signs
  return phone.replace(/[^0-9\s()\-+]/g, '').substring(0, 20);
};

/**
 * Sanitizes document numbers (CPF, CNPJ, RG)
 */
export const sanitizeDocument = (document: string | null | undefined): string => {
  if (!document) return '';
  
  // Only allow numbers, dots, hyphens, and slashes
  return document.replace(/[^0-9.\-/]/g, '').substring(0, 20);
};

/**
 * Sanitizes general text input
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return sanitizeString(text)
    // Additional escaping for special characters
    .replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[match];
    });
};

/**
 * Sanitizes all client data before processing
 */
export const sanitizeClienteData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      sanitized[key] = value;
      return;
    }
    
    switch (key) {
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'telefone':
        sanitized[key] = sanitizePhone(value);
        break;
      case 'cpf':
      case 'cnpj':
      case 'rg':
        sanitized[key] = sanitizeDocument(value);
        break;
      case 'nome':
      case 'rua':
      case 'bairro':
      case 'cidade':
      case 'estado':
      case 'numero_residencia':
        sanitized[key] = sanitizeText(value);
        break;
      default:
        sanitized[key] = sanitizeString(value);
    }
  });
  
  return sanitized;
};
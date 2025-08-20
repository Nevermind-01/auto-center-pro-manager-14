/**
 * Sistema de logging seguro que só funciona em desenvolvimento
 * Previne vazamento de informações sensíveis em produção
 */

const isDevelopment = import.meta.env.DEV;

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class Logger {
  private log(level: string, message: string, ...args: any[]) {
    if (!isDevelopment) {
      // Em produção, só logar erros críticos sem dados sensíveis
      if (level === LOG_LEVELS.ERROR) {
        console.error('[PROD ERROR]', message);
      }
      return;
    }

    // Em desenvolvimento, logar normalmente
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(logMessage, ...args);
        break;
      case LOG_LEVELS.INFO:
        console.info(logMessage, ...args);
        break;
      case LOG_LEVELS.WARN:
        console.warn(logMessage, ...args);
        break;
      case LOG_LEVELS.ERROR:
        console.error(logMessage, ...args);
        break;
      default:
        console.log(logMessage, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.ERROR, message, ...args);
  }

  // Método especial para dados sensíveis - só em desenvolvimento
  sensitive(message: string, data?: any) {
    if (!isDevelopment) return;
    
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [SENSITIVE] ${message}`, data);
  }
}

export const logger = new Logger();
export default logger;
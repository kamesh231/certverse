import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, printf, colorize, errors } = winston.format

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`

  // Add stack trace for errors
  if (stack) {
    msg += `\n${stack}`
  }

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`
  }

  return msg
})

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
})

// File transport for production errors
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
})

// File transport for all logs
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
})

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    consoleTransport,
    ...(process.env.NODE_ENV === 'production'
      ? [errorFileTransport, combinedFileTransport]
      : []),
  ],
  // Don't exit on error
  exitOnError: false,
})

// Helper methods for structured logging
export const logError = (message: string, error?: Error, metadata?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...metadata })
}

export const logInfo = (message: string, metadata?: any) => {
  logger.info(message, metadata)
}

export const logWarning = (message: string, metadata?: any) => {
  logger.warn(message, metadata)
}

export const logDebug = (message: string, metadata?: any) => {
  logger.debug(message, metadata)
}

export default logger

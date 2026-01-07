import winston from 'winston'

const isDevelopment = process.env.NODE_ENV === 'development'

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'atlas-economy' },
  transports: [
    // We ONLY use the Console transport. 
    // Vercel captures console output automatically and shows it in your dashboard.
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

export default logger
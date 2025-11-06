/**
 * 日志工具模块
 * 使用winston库实现结构化日志记录
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保日志目录存在
const logDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 创建日志记录器实例
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'elevenlabs-tts-api' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...meta }) => {
            return `${timestamp} ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          }
        )
      ),
    }),
    // 文件输出
    new winston.transports.File({ 
      filename: config.logging.filePath,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 开发环境下增加更详细的日志信息
if (config.server.env === 'development') {
  logger.level = 'debug';
}

/**
 * 创建请求日志中间件
 * @returns {Function} Koa中间件函数
 */
logger.middleware = () => async (ctx, next) => {
  const start = Date.now();
  
  try {
    await next();
    
    const ms = Date.now() - start;
    const logLevel = ctx.status >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, `${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms`, {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      responseTime: ms,
      ip: ctx.ip,
      userAgent: ctx.headers['user-agent'],
    });
  } catch (error) {
    const ms = Date.now() - start;
    
    logger.error(`${ctx.method} ${ctx.url} ${ctx.status || 500} - ${ms}ms`, {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status || 500,
      responseTime: ms,
      ip: ctx.ip,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
    
    throw error;
  }
};

module.exports = logger;
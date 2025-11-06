/**
 * 错误处理中间件
 * 统一处理API请求过程中的错误
 */

const logger = require('../utils/logger');

/**
 * 自定义API错误类
 * 用于创建特定的API错误响应
 */
class ApiError extends Error {
  /**
   * 创建一个API错误
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {Object} [details] - 错误详情
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误处理中间件
 * 捕获请求处理过程中的错误并返回格式化的错误响应
 */
async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (err) {
    // 获取错误信息
    const statusCode = err instanceof ApiError ? err.statusCode : (err.status || 500);
    const message = err.message || '服务器内部错误';
    const details = err instanceof ApiError ? err.details : null;
    
    // 设置响应状态和内容
    ctx.status = statusCode;
    ctx.body = {
      error: {
        code: statusCode,
        message,
        ...(details && { details }),
      },
    };
    
    // 根据错误级别记录日志
    if (statusCode >= 500) {
      logger.error(`服务器错误: ${message}`, { 
        error: err.message, 
        stack: err.stack,
        statusCode,
        path: ctx.path,
      });
    } else {
      logger.warn(`客户端错误: ${message}`, { 
        statusCode, 
        path: ctx.path,
        query: ctx.query,
        body: ctx.request.body,
      });
    }
    
    // 在开发模式下添加堆栈信息
    if (process.env.NODE_ENV === 'development') {
      ctx.body.error.stack = err.stack;
    }
  }
}

module.exports = {
  errorHandler,
  ApiError,
};
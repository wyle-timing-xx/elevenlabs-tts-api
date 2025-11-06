/**
 * ElevenLabs TTS API - 主应用程序入口
 * 基于Koa的文字转语音服务，使用ElevenLabs API
 */

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const koaLogger = require('koa-logger');
const { errorHandler } = require('./middleware/errorHandler');
const apiRouter = require('./routes/api');
const logger = require('./utils/logger');
const config = require('./config');
const elevenLabsService = require('./services/elevenLabsService');

// 创建Koa应用实例
const app = new Koa();

// 全局错误处理中间件
app.use(errorHandler);

// 请求日志记录
app.use(logger.middleware());

// 开发环境添加更详细的日志
if (config.server.env === 'development') {
  app.use(koaLogger());
}

// 请求体解析，增加大小限制以支持长文本
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text'],
  jsonLimit: '10mb',
  formLimit: '10mb',
  textLimit: '10mb',
}));

// 注册路由
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// 未找到路由的处理
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = {
    error: {
      code: 404,
      message: '未找到请求的API端点',
    },
  };
});

// 启动服务器
async function startServer() {
  try {
    // 测试ElevenLabs API连接
    const isConnected = await elevenLabsService.checkConnection();
    
    if (!isConnected) {
      logger.warn('无法连接到ElevenLabs API，服务可能无法正常工作');
    }
    
    // 启动HTTP服务器
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`服务器已启动: http://${config.server.host}:${config.server.port}`, {
        environment: config.server.env,
        apiConnected: isConnected,
      });
    });
    
    // 处理服务器错误
    server.on('error', (err) => {
      logger.error('服务器错误:', { error: err.message });
      process.exit(1);
    });
    
    // 优雅关闭
    const handleShutdown = async () => {
      logger.info('正在关闭服务器...');
      
      server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
      });
      
      // 如果10秒内未完成关闭，则强制退出
      setTimeout(() => {
        logger.error('服务器关闭超时，强制退出');
        process.exit(1);
      }, 10000);
    };
    
    // 注册进程事件处理器
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
    
    // 捕获未处理的异常和Promise拒绝
    process.on('uncaughtException', (err) => {
      logger.error('未捕获的异常:', { error: err.message, stack: err.stack });
    });
    
    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的Promise拒绝:', { reason });
    });
    
  } catch (error) {
    logger.error('服务器启动失败:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// 当直接运行此文件时启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;
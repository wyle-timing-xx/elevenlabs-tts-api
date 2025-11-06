/**
 * API路由
 * 定义所有API端点和对应的处理器
 */

const Router = require('koa-router');
const ttsController = require('../controllers/ttsController');
const logger = require('../utils/logger');

// 创建路由实例
const router = new Router({
  prefix: '/api',
});

// 添加路由
router
  // TTS基本功能
  .post('/tts', ttsController.generateSpeech)
  .post('/tts/stream', ttsController.streamSpeech)
  
  // 声音和模型相关
  .get('/voices', ttsController.getVoices)
  .get('/models', ttsController.getModels)
  
  // 服务状态
  .get('/status', ttsController.getStatus)
  
  // 提示词系统
  .get('/prompts/templates', ttsController.getPromptTemplates)
  .post('/prompts/templates', ttsController.addPromptTemplate)
  .post('/prompts/preview', ttsController.previewPromptText);

// 记录路由注册信息
logger.info('API路由注册完成', {
  routeCount: router.stack.length,
  routes: router.stack.map(r => `${r.methods.join(',')} ${r.path}`),
});

module.exports = router;
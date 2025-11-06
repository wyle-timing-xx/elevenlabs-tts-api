/**
 * TTS控制器
 * 处理文字转语音的API请求
 */

const { Readable } = require('stream');
const elevenLabsService = require('../services/elevenLabsService');
const promptSystem = require('../utils/promptSystem');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * TTS控制器
 * 提供文字转语音的各种API接口处理函数
 */
const ttsController = {
  /**
   * 生成语音（非流式）
   * @param {Object} ctx - Koa上下文对象
   */
  async generateSpeech(ctx) {
    const { text, voice_id, model_id } = ctx.request.body;
    const voiceSettings = ctx.request.body.voice_settings;
    
    // 验证请求参数
    if (!text) {
      throw new ApiError('文本内容不能为空', 400);
    }
    
    // 获取声音ID（优先使用请求中的，其次使用配置的默认值）
    const voiceId = voice_id || config.elevenlabs.defaultVoiceId;
    
    try {
      // 应用提示词模板
      const processedText = promptSystem.applyTemplate(text);
      
      // 生成语音
      const audioData = await elevenLabsService.textToSpeech({
        text: processedText,
        voiceId,
        modelId: model_id,
        voiceSettings,
      });
      
      // 设置响应头和内容
      ctx.set('Content-Type', 'audio/mpeg');
      ctx.set('Content-Disposition', `attachment; filename="tts_${Date.now()}.mp3"`);
      ctx.body = audioData;
      
      logger.info('非流式语音生成成功', {
        textLength: text.length,
        audioSize: audioData.length,
        voiceId,
      });
    } catch (error) {
      logger.error('非流式语音生成失败', {
        error: error.message,
        voiceId,
        textLength: text.length,
      });
      throw new ApiError(`语音生成失败: ${error.message}`, 500);
    }
  },
  
  /**
   * 流式生成语音
   * @param {Object} ctx - Koa上下文对象
   */
  async streamSpeech(ctx) {
    const { text, voice_id, model_id } = ctx.request.body;
    const voiceSettings = ctx.request.body.voice_settings;
    
    // 验证请求参数
    if (!text) {
      throw new ApiError('文本内容不能为空', 400);
    }
    
    // 获取声音ID（优先使用请求中的，其次使用配置的默认值）
    const voiceId = voice_id || config.elevenlabs.defaultVoiceId;
    
    try {
      // 应用提示词模板
      const processedText = promptSystem.applyTemplate(text);
      
      // 流式生成语音
      const audioStream = await elevenLabsService.streamTextToSpeech({
        text: processedText,
        voiceId,
        modelId: model_id,
        voiceSettings,
      });
      
      // 设置响应头和内容
      ctx.set('Content-Type', 'audio/mpeg');
      ctx.set('Transfer-Encoding', 'chunked');
      ctx.set('Content-Disposition', `attachment; filename="tts_stream_${Date.now()}.mp3"`);
      
      // 将流传递给客户端
      ctx.body = audioStream;
      
      logger.info('流式语音生成开始', {
        textLength: text.length,
        voiceId,
      });
      
      // 监听流关闭事件
      audioStream.on('end', () => {
        logger.info('流式语音生成完成', {
          textLength: text.length,
          voiceId,
        });
      });
      
      audioStream.on('error', (err) => {
        logger.error('流式语音生成流错误', {
          error: err.message,
          voiceId,
          textLength: text.length,
        });
      });
    } catch (error) {
      logger.error('流式语音生成请求失败', {
        error: error.message,
        voiceId,
        textLength: text.length,
      });
      throw new ApiError(`流式语音生成失败: ${error.message}`, 500);
    }
  },
  
  /**
   * 获取可用的声音列表
   * @param {Object} ctx - Koa上下文对象
   */
  async getVoices(ctx) {
    try {
      const voices = await elevenLabsService.getVoices();
      
      // 添加声音是否配置为默认的标识
      const voicesWithDefault = voices.map(voice => ({
        ...voice,
        is_default: voice.voice_id === config.elevenlabs.defaultVoiceId
      }));
      
      ctx.body = { voices: voicesWithDefault };
    } catch (error) {
      logger.error('获取声音列表失败', { error: error.message });
      throw new ApiError(`获取声音列表失败: ${error.message}`, 500);
    }
  },
  
  /**
   * 获取可用的TTS模型列表
   * @param {Object} ctx - Koa上下文对象
   */
  async getModels(ctx) {
    try {
      const models = await elevenLabsService.getModels();
      ctx.body = { models };
    } catch (error) {
      logger.error('获取模型列表失败', { error: error.message });
      throw new ApiError(`获取模型列表失败: ${error.message}`, 500);
    }
  },
  
  /**
   * 获取服务状态
   * @param {Object} ctx - Koa上下文对象
   */
  async getStatus(ctx) {
    try {
      const isConnected = await elevenLabsService.checkConnection();
      
      ctx.body = {
        status: 'ok',
        api_connected: isConnected,
        config: {
          default_voice_id: config.elevenlabs.defaultVoiceId,
          default_model_id: config.tts.modelId,
          prompt_system_enabled: config.prompts.enabled,
          environment: config.server.env
        }
      };
    } catch (error) {
      logger.error('获取服务状态失败', { error: error.message });
      throw new ApiError(`获取服务状态失败: ${error.message}`, 500);
    }
  },
  
  /**
   * 获取提示词模板列表
   * @param {Object} ctx - Koa上下文对象
   */
  async getPromptTemplates(ctx) {
    try {
      if (!config.prompts.enabled) {
        ctx.body = {
          enabled: false,
          message: '提示词系统当前已禁用',
        };
        return;
      }
      
      const templates = promptSystem.getTemplates();
      
      ctx.body = {
        enabled: true,
        templates,
      };
    } catch (error) {
      logger.error('获取提示词模板列表失败', { error: error.message });
      throw new ApiError(`获取提示词模板列表失败: ${error.message}`, 500);
    }
  },
  
  /**
   * 添加提示词模板
   * @param {Object} ctx - Koa上下文对象
   */
  async addPromptTemplate(ctx) {
    try {
      if (!config.prompts.enabled) {
        ctx.status = 400;
        ctx.body = {
          error: {
            code: 400,
            message: '提示词系统当前已禁用',
          },
        };
        return;
      }
      
      const { name, template } = ctx.request.body;
      
      if (!name || !template) {
        throw new ApiError('模板名称和内容不能为空', 400);
      }
      
      const success = promptSystem.addTemplate(name, template);
      
      if (!success) {
        throw new ApiError('添加提示词模板失败，请确保包含{{text}}占位符', 400);
      }
      
      ctx.body = {
        success: true,
        message: '提示词模板添加成功',
        name,
      };
    } catch (error) {
      logger.error('添加提示词模板失败', { 
        error: error.message,
        body: ctx.request.body,
      });
      
      if (error instanceof ApiError) {
        throw error;
      } else {
        throw new ApiError(`添加提示词模板失败: ${error.message}`, 500);
      }
    }
  },
  
  /**
   * 预览应用提示词后的文本
   * @param {Object} ctx - Koa上下文对象
   */
  async previewPromptText(ctx) {
    try {
      if (!config.prompts.enabled) {
        ctx.status = 400;
        ctx.body = {
          error: {
            code: 400,
            message: '提示词系统当前已禁用',
          },
        };
        return;
      }
      
      const { text, template_name } = ctx.request.body;
      
      if (!text) {
        throw new ApiError('文本内容不能为空', 400);
      }
      
      const processedText = promptSystem.applyTemplate(text, template_name);
      
      ctx.body = {
        original_text: text,
        processed_text: processedText,
        template_name: template_name || 'default',
      };
    } catch (error) {
      logger.error('预览提示词应用结果失败', { 
        error: error.message,
        body: ctx.request.body,
      });
      
      if (error instanceof ApiError) {
        throw error;
      } else {
        throw new ApiError(`预览提示词应用结果失败: ${error.message}`, 500);
      }
    }
  }
};

module.exports = ttsController;
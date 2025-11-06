/**
 * ElevenLabs API服务
 * 封装与ElevenLabs API的所有交互
 */

const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * ElevenLabs API服务类
 * 提供文字转语音和语音管理功能
 */
class ElevenLabsService {
  constructor() {
    // 创建axios实例
    this.api = axios.create({
      baseURL: config.elevenlabs.baseUrl,
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer', // 默认响应类型为二进制数据
    });
    
    // 基本请求参数
    this.defaultTtsParams = {
      model_id: config.tts.modelId,
      voice_settings: {
        stability: config.tts.stability,
        similarity_boost: config.tts.similarityBoost,
        style: config.tts.style,
        use_speaker_boost: config.tts.useSpeakerBoost,
      },
    };
    
    logger.debug('ElevenLabs服务初始化完成', {
      baseURL: config.elevenlabs.baseUrl,
      defaultModel: this.defaultTtsParams.model_id,
    });
  }

  /**
   * 获取可用声音列表
   * @returns {Promise<Array>} 声音列表
   */
  async getVoices() {
    try {
      const response = await this.api.get('/voices', {
        responseType: 'json',
      });
      
      logger.debug('获取声音列表成功', { count: response.data.voices.length });
      return response.data.voices;
    } catch (error) {
      logger.error('获取声音列表失败', { 
        error: error.message, 
        status: error.response?.status,
      });
      throw new Error(`获取声音列表失败: ${error.message}`);
    }
  }

  /**
   * 获取指定ID的声音信息
   * @param {string} voiceId - 声音ID
   * @returns {Promise<Object>} 声音信息
   */
  async getVoice(voiceId) {
    try {
      const response = await this.api.get(`/voices/${voiceId}`, {
        responseType: 'json',
      });
      
      logger.debug('获取声音信息成功', { voiceId });
      return response.data;
    } catch (error) {
      logger.error('获取声音信息失败', { 
        voiceId, 
        error: error.message, 
        status: error.response?.status,
      });
      throw new Error(`获取声音信息失败: ${error.message}`);
    }
  }

  /**
   * 生成文本到语音的音频（非流式）
   * @param {Object} options - TTS选项
   * @param {string} options.text - 要转换的文本
   * @param {string} [options.voiceId] - 声音ID，默认使用配置的默认声音
   * @param {string} [options.modelId] - 模型ID
   * @param {Object} [options.voiceSettings] - 声音设置
   * @returns {Promise<Buffer>} 音频数据buffer
   */
  async textToSpeech({ 
    text, 
    voiceId = config.elevenlabs.defaultVoiceId,
    modelId,
    voiceSettings,
  }) {
    if (!text) {
      throw new Error('文本内容不能为空');
    }
    
    try {
      const requestBody = {
        text,
        ...this.defaultTtsParams,
      };
      
      // 使用提供的参数覆盖默认值
      if (modelId) requestBody.model_id = modelId;
      if (voiceSettings) requestBody.voice_settings = {
        ...this.defaultTtsParams.voice_settings,
        ...voiceSettings,
      };
      
      const response = await this.api.post(`/text-to-speech/${voiceId}`, requestBody);
      
      logger.debug('文字转语音完成', { 
        textLength: text.length,
        voiceId,
        audioSize: response.data.length,
      });
      
      return response.data;
    } catch (error) {
      logger.error('文字转语音失败', { 
        voiceId, 
        textLength: text.length,
        error: error.message, 
        status: error.response?.status,
      });
      
      // 提供更多错误信息帮助调试
      if (error.response) {
        try {
          // 尝试解析错误响应体
          const errorData = JSON.parse(error.response.data.toString());
          logger.error('ElevenLabs API错误详情', { errorData });
        } catch (e) {
          // 如果无法解析，记录原始响应
          logger.error('无法解析ElevenLabs API错误响应', { 
            responseData: error.response.data.toString('hex').substring(0, 100) + '...' 
          });
        }
      }
      
      throw new Error(`文字转语音失败: ${error.message}`);
    }
  }

  /**
   * 流式生成文本到语音的音频
   * @param {Object} options - TTS选项
   * @param {string} options.text - 要转换的文本
   * @param {string} [options.voiceId] - 声音ID，默认使用配置的默认声音
   * @param {string} [options.modelId] - 模型ID
   * @param {Object} [options.voiceSettings] - 声音设置
   * @returns {Promise<ReadableStream>} 可读流
   */
  async streamTextToSpeech({ 
    text, 
    voiceId = config.elevenlabs.defaultVoiceId,
    modelId,
    voiceSettings,
  }) {
    if (!text) {
      throw new Error('文本内容不能为空');
    }
    
    try {
      const requestBody = {
        text,
        ...this.defaultTtsParams,
      };
      
      // 使用提供的参数覆盖默认值
      if (modelId) requestBody.model_id = modelId;
      if (voiceSettings) requestBody.voice_settings = {
        ...this.defaultTtsParams.voice_settings,
        ...voiceSettings,
      };
      
      logger.debug('开始流式文字转语音', { 
        textLength: text.length,
        voiceId,
      });
      
      // 使用流式响应
      const response = await this.api.post(`/text-to-speech/${voiceId}/stream`, requestBody, {
        responseType: 'stream',
      });
      
      return response.data;
    } catch (error) {
      logger.error('流式文字转语音失败', { 
        voiceId, 
        textLength: text.length,
        error: error.message, 
        status: error.response?.status,
      });
      throw new Error(`流式文字转语音失败: ${error.message}`);
    }
  }
  
  /**
   * 获取可用的TTS模型列表
   * @returns {Promise<Array>} 模型列表
   */
  async getModels() {
    try {
      const response = await this.api.get('/models', {
        responseType: 'json',
      });
      
      logger.debug('获取模型列表成功', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('获取模型列表失败', { 
        error: error.message, 
        status: error.response?.status,
      });
      throw new Error(`获取模型列表失败: ${error.message}`);
    }
  }
  
  /**
   * 检查API连接是否正常
   * @returns {Promise<boolean>} 连接状态
   */
  async checkConnection() {
    try {
      // 使用获取用户信息接口测试连接
      const response = await this.api.get('/user', {
        responseType: 'json',
      });
      
      logger.info('ElevenLabs API连接正常', { 
        subscription: response.data.subscription.tier,
        characterCount: response.data.subscription.character_count,
        characterLimit: response.data.subscription.character_limit,
      });
      
      return true;
    } catch (error) {
      logger.error('ElevenLabs API连接测试失败', { 
        error: error.message, 
        status: error.response?.status,
      });
      return false;
    }
  }
}

// 创建单例实例
const elevenLabsService = new ElevenLabsService();

module.exports = elevenLabsService;
/**
 * 环境配置模块
 * 负责加载和解析.env文件中的环境变量
 */

const dotenv = require('dotenv');
const path = require('path');

// 加载.env文件
dotenv.config();

/**
 * 配置对象
 * 包含所有从.env文件加载的配置项
 */
const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },
  
  // ElevenLabs API配置
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    baseUrl: process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1',
    defaultVoiceId: process.env.DEFAULT_VOICE_ID,
    // 获取所有声音配置
    voices: Object.keys(process.env)
      .filter(key => key.startsWith('VOICE_ID_'))
      .reduce((acc, key) => {
        const voiceName = key.replace('VOICE_ID_', '').toLowerCase();
        acc[voiceName] = process.env[key];
        return acc;
      }, {}),
  },

  // 语音生成参数默认配置
  tts: {
    modelId: process.env.DEFAULT_MODEL_ID || 'eleven_multilingual_v2',
    stability: parseFloat(process.env.DEFAULT_STABILITY || 0.5),
    similarityBoost: parseFloat(process.env.DEFAULT_SIMILARITY_BOOST || 0.75),
    style: parseFloat(process.env.DEFAULT_STYLE || 0),
    useSpeakerBoost: process.env.DEFAULT_USE_SPEAKER_BOOST === 'true',
  },

  // 流式传输配置
  streaming: {
    chunkSize: parseInt(process.env.STREAM_CHUNK_SIZE || 4096, 10),
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs', 'app.log'),
  },
  
  // 提示词系统配置
  prompts: {
    enabled: process.env.ENABLE_PROMPT_SYSTEM === 'true',
    defaultTemplate: process.env.DEFAULT_PROMPT_TEMPLATE || '请用自然的语调朗读以下内容: {{text}}',
  },
};

// 验证必需的配置项
const validateConfig = () => {
  const requiredConfigs = [
    { key: 'elevenlabs.apiKey', value: config.elevenlabs.apiKey, name: 'ELEVENLABS_API_KEY' },
    { key: 'elevenlabs.defaultVoiceId', value: config.elevenlabs.defaultVoiceId, name: 'DEFAULT_VOICE_ID' },
  ];

  const missingConfigs = requiredConfigs
    .filter(cfg => !cfg.value)
    .map(cfg => cfg.name);

  if (missingConfigs.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missingConfigs.join(', ')}`);
  }
};

// 只在非测试环境下验证配置
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;
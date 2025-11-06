# ElevenLabs TTS API

一个高质量的文字转语音API服务，基于ElevenLabs AI和Koa框架，支持流式传输。

## 功能特点

- 🔊 高质量文字转语音转换
- 📢 支持流式传输
- 🔧 完整的错误处理
- 🗣️ 支持使用克隆的声音
- 📝 内置提示词系统
- 📚 详细的代码注释和API文档
- 🚀 基于Koa框架的高性能设计

## 环境要求

- Node.js >= 14.x
- NPM >= 6.x

## 安装步骤

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/elevenlabs-tts-api.git
cd elevenlabs-tts-api
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

```bash
cp .env.example .env
```

4. 编辑`.env`文件，填入您的ElevenLabs API密钥和其他配置：

```
ELEVENLABS_API_KEY=your_api_key_here
DEFAULT_VOICE_ID=your_default_voice_id
```

## 使用方法

### 启动服务器

```bash
# 开发环境（带热重载）
npm run dev

# 生产环境
npm start
```

服务器默认在 http://localhost:3000 运行。

### API端点

#### 生成语音（非流式）

```
POST /api/tts
```

请求体：

```json
{
  "text": "要转换为语音的文本",
  "voice_id": "可选的声音ID",
  "model_id": "可选的模型ID",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

#### 生成语音（流式）

```
POST /api/tts/stream
```

请求体与非流式相同。

#### 获取可用声音列表

```
GET /api/voices
```

#### 获取可用模型列表

```
GET /api/models
```

#### 获取服务状态

```
GET /api/status
```

#### 获取提示词模板列表

```
GET /api/prompts/templates
```

#### 添加提示词模板

```
POST /api/prompts/templates
```

请求体：

```json
{
  "name": "模板名称",
  "template": "模板内容，使用{{text}}作为占位符"
}
```

#### 预览提示词效果

```
POST /api/prompts/preview
```

请求体：

```json
{
  "text": "原始文本",
  "template_name": "可选的模板名称"
}
```

## 提示词系统

提示词系统允许您在文字转语音之前自动处理输入文本，为ElevenLabs API提供更好的指导。例如，您可以创建一个模板：

```
用悲伤的语调朗读下面的内容: {{text}}
```

这将在所有TTS请求中自动添加情感指导，使得生成的语音更符合您的期望。

## 配置项说明

| 配置项 | 说明 | 默认值 |
|-------|------|-------|
| `ELEVENLABS_API_KEY` | ElevenLabs API密钥 | 必填 |
| `ELEVENLABS_BASE_URL` | ElevenLabs API基础URL | https://api.elevenlabs.io/v1 |
| `DEFAULT_VOICE_ID` | 默认使用的声音ID | 必填 |
| `PORT` | 服务器端口 | 3000 |
| `HOST` | 服务器主机 | localhost |
| `NODE_ENV` | 运行环境 | development |
| `DEFAULT_MODEL_ID` | 默认使用的模型ID | eleven_multilingual_v2 |
| `DEFAULT_STABILITY` | 默认稳定性参数 | 0.5 |
| `DEFAULT_SIMILARITY_BOOST` | 默认相似度提升参数 | 0.75 |
| `LOG_LEVEL` | 日志级别 | info |
| `STREAM_CHUNK_SIZE` | 流式传输块大小 | 4096 |
| `ENABLE_PROMPT_SYSTEM` | 是否启用提示词系统 | true |

## 错误处理

API使用标准HTTP状态码和JSON错误响应：

```json
{
  "error": {
    "code": 400,
    "message": "错误信息",
    "details": { /* 可选的错误详情 */ }
  }
}
```

## 开发与贡献

欢迎贡献代码或提交问题！请按以下步骤：

1. Fork仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature-name`
5. 提交Pull Request

## 许可证

MIT
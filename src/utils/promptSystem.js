/**
 * 提示词处理工具
 * 用于管理和应用文本提示模板
 */

const config = require('../config');
const logger = require('./logger');

/**
 * 提示词系统类
 * 管理提示词模板和文本处理
 */
class PromptSystem {
  constructor() {
    this.enabled = config.prompts.enabled;
    this.templates = new Map();
    
    // 添加默认模板
    this.templates.set('default', config.prompts.defaultTemplate);
    
    logger.debug('提示词系统初始化', { 
      enabled: this.enabled, 
      defaultTemplate: this.templates.get('default') 
    });
  }

  /**
   * 添加新的提示词模板
   * @param {string} name - 模板名称
   * @param {string} template - 模板字符串，使用{{text}}作为文本占位符
   * @returns {boolean} 是否成功添加
   */
  addTemplate(name, template) {
    if (!name || !template || typeof template !== 'string') {
      logger.warn('添加提示词模板失败: 无效的模板参数', { name, template });
      return false;
    }
    
    if (!template.includes('{{text}}')) {
      logger.warn('添加提示词模板失败: 模板中缺少{{text}}占位符', { name, template });
      return false;
    }
    
    this.templates.set(name, template);
    logger.debug('已添加提示词模板', { name, template });
    return true;
  }

  /**
   * 移除提示词模板
   * @param {string} name - 要移除的模板名称
   * @returns {boolean} 是否成功移除
   */
  removeTemplate(name) {
    if (name === 'default') {
      logger.warn('无法移除默认提示词模板');
      return false;
    }
    
    const result = this.templates.delete(name);
    if (result) {
      logger.debug('已移除提示词模板', { name });
    }
    
    return result;
  }

  /**
   * 获取所有可用的提示词模板
   * @returns {Object} 模板名称到模板字符串的映射
   */
  getTemplates() {
    return Object.fromEntries(this.templates);
  }

  /**
   * 应用提示词模板到文本
   * @param {string} text - 原始文本
   * @param {string} [templateName='default'] - 要使用的模板名称
   * @returns {string} 处理后的文本
   */
  applyTemplate(text, templateName = 'default') {
    // 如果提示词系统被禁用，直接返回原文本
    if (!this.enabled) {
      return text;
    }
    
    // 获取模板，如果不存在则使用默认模板
    const template = this.templates.get(templateName) || this.templates.get('default');
    
    if (!template) {
      logger.warn('应用提示词模板失败: 模板不存在', { templateName });
      return text;
    }
    
    // 替换占位符
    const result = template.replace(/{{text}}/g, text);
    
    logger.debug('已应用提示词模板', { 
      templateName, 
      originalLength: text.length,
      resultLength: result.length 
    });
    
    return result;
  }
}

// 创建单例实例
const promptSystem = new PromptSystem();

module.exports = promptSystem;
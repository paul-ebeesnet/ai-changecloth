import React, { useState, useEffect } from 'react';
import PatternManager from './PatternManager';

interface SettingsProps {
  onBack: () => void;
  onSave: (settings: UserSettings) => void;
}

interface UserSettings {
  apiKey: string;
  apiProvider: 'gemini' | 'openrouter';
  selectedModel: string;
}

interface Pattern {
  id: string;
  name: string;
  url: string;
}

// Define the usage statistics interface
interface UsageStatistics {
  [apiKey: string]: number;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [selectedModel, setSelectedModel] = useState('');
  const [usageStats, setUsageStats] = useState<UsageStatistics>({});
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  // Predefined models for each provider
  const models = {
    gemini: [
      { id: 'gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash (Image Preview)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
    openrouter: [
      { id: 'google/gemini-flash-1.5-8b', name: 'Google Gemini Flash 1.5 8B (OpenRouter)' },
      { id: 'google/gemini-pro-1.5', name: 'Google Gemini Pro 1.5 (OpenRouter)' },
      { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini (OpenRouter)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet (OpenRouter)' },
    ]
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings: UserSettings = JSON.parse(savedSettings);
        setApiKey(parsedSettings.apiKey || '');
        setApiProvider(parsedSettings.apiProvider || 'gemini');
        setSelectedModel(parsedSettings.selectedModel || models.gemini[0].id);
      } catch (e) {
        console.error('Failed to parse saved settings', e);
        // Set default values
        setSelectedModel(models.gemini[0].id);
      }
    } else {
      // Set default values
      setSelectedModel(models.gemini[0].id);
    }
    
    // Load usage statistics
    const savedStats = localStorage.getItem('apiUsageStats');
    if (savedStats) {
      try {
        setUsageStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to parse usage statistics', e);
      }
    }
    
    // Load patterns
    const savedPatterns = localStorage.getItem('customPatterns');
    if (savedPatterns) {
      try {
        setPatterns(JSON.parse(savedPatterns));
      } catch (e) {
        console.error('Failed to parse patterns', e);
        // Load default patterns
        loadDefaultPatterns();
      }
    } else {
      // Load default patterns
      loadDefaultPatterns();
    }
  }, []);

  const loadDefaultPatterns = () => {
    // Load default patterns from the constants
    const defaultPatterns: Pattern[] = [
      { id: 'pattern1', name: '青花瓷圖案1', url: '/img/pattern1.png' },
      { id: 'pattern2', name: '青花瓷圖案2', url: '/img/pattern2.png' },
      { id: 'pattern3', name: '青花瓷圖案3', url: '/img/pattern3.png' },
      { id: 'pattern4', name: '青花瓷圖案4', url: '/img/pattern4.png' },
      { id: 'pattern5', name: '青花瓷圖案5', url: '/img/pattern5.png' },
      { id: 'pattern6', name: '青花瓷圖案6', url: '/img/pattern6.png' },
      { id: 'pattern7', name: '青花瓷圖案7', url: '/img/pattern7.png' },
      { id: 'pattern8', name: '青花瓷圖案8', url: '/img/pattern8.png' },
      { id: 'pattern9', name: '青花瓷圖案9', url: '/img/pattern9.png' },
      { id: 'pattern10', name: '青花瓷圖案10', url: '/img/pattern10.png' },
    ];
    setPatterns(defaultPatterns);
  };

  const handleSave = () => {
    const settings: UserSettings = {
      apiKey,
      apiProvider,
      selectedModel
    };
    
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    localStorage.setItem('customPatterns', JSON.stringify(patterns));
    
    // Notify parent component
    onSave(settings);
  };

  const handlePatternsChange = (newPatterns: Pattern[]) => {
    setPatterns(newPatterns);
  };

  // Function to get the last 5 characters of the API key for display
  const getMaskedApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 5) return key;
    return '•••••' + key.slice(-5);
  };

  // Function to get usage count for the current API key
  const getCurrentKeyUsage = () => {
    if (!apiKey) return 0;
    return usageStats[apiKey] || 0;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">設定</h2>
        <button 
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            API 提供商
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setApiProvider('gemini')}
              className={`py-3 px-4 rounded-lg border-2 transition-colors ${
                apiProvider === 'gemini'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="font-medium">Google Gemini</div>
              <div className="text-xs text-gray-400 mt-1">Google AI Studio</div>
            </button>
            <button
              onClick={() => setApiProvider('openrouter')}
              className={`py-3 px-4 rounded-lg border-2 transition-colors ${
                apiProvider === 'openrouter'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="font-medium">OpenRouter</div>
              <div className="text-xs text-gray-400 mt-1">多模型支持</div>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
            API 金鑰
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={apiProvider === 'gemini' ? "輸入 Google AI Studio API 金鑰" : "輸入 OpenRouter API 金鑰"}
          />
          <div className="mt-2 text-sm text-gray-400">
            {apiProvider === 'gemini' ? (
              <div>
                <p>從 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a> 獲取您的 API 金鑰</p>
                <p className="mt-1 text-yellow-300">注意：Google Gemini 免費配額有限，如果遇到配額限制，建議切換到 OpenRouter</p>
              </div>
            ) : (
              <div>
                <p>從 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenRouter</a> 獲取您的 API 金鑰</p>
                <p className="mt-1 text-green-300">OpenRouter 提供多種模型選擇，通常有更高的免費配額</p>
              </div>
            )}
          </div>
          
          {/* Display masked API key and usage statistics */}
          {apiKey && (
            <div className="mt-3 p-3 bg-gray-700 rounded-lg">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>目前 API 金鑰:</span>
                  <span className="font-mono">{getMaskedApiKey(apiKey)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>已生成圖片數量:</span>
                  <span>{getCurrentKeyUsage()} 張</span>
                </div>
              </div>
            </div>
          )}
          
          {/* API Provider Information */}
          <div className="mt-3 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm">
              <div className="font-medium mb-1">API 提供商資訊</div>
              {apiProvider === 'gemini' ? (
                <div className="text-gray-300">
                  <p>• Google Gemini: 免費但配額有限</p>
                  <p>• 建議在配額用完時切換到 OpenRouter</p>
                </div>
              ) : (
                <div className="text-gray-300">
                  <p>• OpenRouter: 支持多種模型，通常配額更高</p>
                  <p>• 可以在免費配额用完后升级到付费计划</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            選擇模型
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto p-2">
            {models[apiProvider].map((model) => (
              <div
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">{model.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Management */}
        <PatternManager 
          patterns={patterns} 
          onChange={handlePatternsChange} 
        />

        {/* Usage Statistics Section */}
        {Object.keys(usageStats).length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              API 使用統計
            </label>
            <div className="p-3 bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
              {Object.entries(usageStats).map(([key, count]) => (
                <div key={key} className="flex justify-between py-1 text-sm">
                  <span className="font-mono">{getMaskedApiKey(key)}</span>
                  <span>{count} 張圖片</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quota Management Help */}
        <div>
          <label className="block text-sm font-medium mb-2">
            配額管理提示
          </label>
          <div className="p-3 bg-blue-900/30 rounded-lg text-sm text-blue-200">
            <p className="font-medium mb-1">遇到配額限制時的解決方案：</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>切換到 OpenRouter 提供商（通常有更高配額）</li>
              <li>等待配額重置（Google Gemini 每日重置）</li>
              <li>升級到付費計劃以獲得更高配額</li>
              <li>輪換使用多個 API 金鑰來分散使用量</li>
            </ol>
            <p className="mt-2 text-yellow-300">提示：OpenRouter 通常提供更好的免費配額，建議優先使用。</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
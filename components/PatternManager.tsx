import React, { useState, useEffect } from 'react';

interface Pattern {
  id: string;
  name: string;
  url: string;
}

interface PatternManagerProps {
  patterns: Pattern[];
  onChange: (patterns: Pattern[]) => void;
}

const PatternManager: React.FC<PatternManagerProps> = ({ patterns, onChange }) => {
  const [localPatterns, setLocalPatterns] = useState<Pattern[]>(patterns);
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternFile, setNewPatternFile] = useState<File | null>(null);

  useEffect(() => {
    setLocalPatterns(patterns);
  }, [patterns]);

  const handleAddPattern = () => {
    if (!newPatternName.trim() || !newPatternFile) {
      alert('請輸入圖案名稱並選擇圖片文件');
      return;
    }

    // In a real implementation, you would upload the file to a server
    // For now, we'll create a local URL
    const newPattern: Pattern = {
      id: `pattern-${Date.now()}`,
      name: newPatternName,
      url: URL.createObjectURL(newPatternFile)
    };

    const updatedPatterns = [...localPatterns, newPattern];
    setLocalPatterns(updatedPatterns);
    onChange(updatedPatterns);
    
    // Reset form
    setNewPatternName('');
    setNewPatternFile(null);
  };

  const handleDeletePattern = (id: string) => {
    const updatedPatterns = localPatterns.filter(pattern => pattern.id !== id);
    setLocalPatterns(updatedPatterns);
    onChange(updatedPatterns);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPatternFile(e.target.files[0]);
    }
  };

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium mb-2">
        圖案管理
      </label>
      
      {/* Add new pattern form */}
      <div className="p-3 bg-gray-700 rounded-lg mb-4">
        <h3 className="font-medium mb-2">新增圖案</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">圖案名稱</label>
            <input
              type="text"
              value={newPatternName}
              onChange={(e) => setNewPatternName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入圖案名稱"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">選擇圖片</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700"
            />
          </div>
          <button
            onClick={handleAddPattern}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            新增圖案
          </button>
        </div>
      </div>

      {/* Pattern list */}
      <div className="p-3 bg-gray-700 rounded-lg">
        <h3 className="font-medium mb-2">現有圖案 ({localPatterns.length})</h3>
        {localPatterns.length === 0 ? (
          <p className="text-gray-400 text-sm">目前沒有圖案</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {localPatterns.map((pattern) => (
              <div key={pattern.id} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                <div className="flex items-center space-x-3">
                  <img src={pattern.url} alt={pattern.name} className="w-10 h-10 object-cover rounded" />
                  <span className="text-sm">{pattern.name}</span>
                </div>
                <button
                  onClick={() => handleDeletePattern(pattern.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternManager;
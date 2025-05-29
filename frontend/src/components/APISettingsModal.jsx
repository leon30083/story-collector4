import React, { useState, useEffect } from 'react';
import axios from 'axios';

const APISettingsModal = ({ visible, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [topP, setTopP] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    if (visible) {
      // 加载本地设置
      const saved = localStorage.getItem('aiSettings');
      if (saved) {
        const s = JSON.parse(saved);
        setApiKey(s.apiKey || '');
        setSelectedModel(s.selectedModel || '');
        setTemperature(s.temperature ?? 0.7);
        setMaxTokens(s.maxTokens ?? 512);
        setTopP(s.topP ?? 0.7);
        fetchModels(s.apiKey || '');
      }
      setError('');
      setSuccess('');
      setTestResult('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fetchModels = async (key = apiKey) => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/models', { api_key: key });
      setModels(res.data.data || []);
    } catch (e) {
      setError('获取模型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey) {
      setError('请输入API密钥');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/settings', { api_key: apiKey });
      localStorage.setItem('aiSettings', JSON.stringify({
        apiKey,
        selectedModel,
        temperature,
        maxTokens,
        topP
      }));
      setSuccess('设置已保存');
      fetchModels();
    } catch (e) {
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const res = await axios.post('/api/settings/test', { api_key: apiKey });
      setTestResult(res.data.message || '测试成功');
    } catch (e) {
      setTestResult('测试失败');
    } finally {
      setTesting(false);
    }
  };

  if (!visible) return null;
  return (
    <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-1/3 p-8 rounded shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">API设置</h2>
        <button className="absolute top-4 right-6 text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        <div className="mb-4">
          <label className="block mb-1">API密钥</label>
          <input type="password" className="w-full border rounded p-2" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="请输入API Key" />
        </div>
        <div className="mb-4 flex items-center space-x-2">
          <label className="block mb-1">模型</label>
          <select className="flex-1 border rounded p-2" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} disabled={loading || models.length === 0}>
            <option value="">请选择模型</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>
          <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded" onClick={() => fetchModels()}>获取模型</button>
        </div>
        <div className="mb-4 flex space-x-4">
          <div className="flex-1">
            <label className="block mb-1">温度</label>
            <input type="range" min="0" max="1" step="0.01" value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-full" />
            <div className="text-xs text-gray-500">{temperature}</div>
          </div>
          <div className="flex-1">
            <label className="block mb-1">最大Token</label>
            <input type="number" min="100" max="2000" step="10" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className="w-full border rounded p-1" />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Top P</label>
            <input type="range" min="0" max="1" step="0.01" value={topP} onChange={e => setTopP(Number(e.target.value))} className="w-full" />
            <div className="text-xs text-gray-500">{topP}</div>
          </div>
        </div>
        <div className="mb-2 flex space-x-2">
          <button className="px-4 py-1 bg-gray-200 rounded" onClick={onClose}>关闭</button>
          <button className="px-4 py-1 bg-blue-500 text-white rounded" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
          <button className="px-4 py-1 bg-green-500 text-white rounded" onClick={handleTest} disabled={testing}>{testing ? '测试中...' : '测试API'}</button>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-500 text-sm mb-2">{success}</div>}
        {testResult && <div className="text-blue-500 text-sm mb-2">{testResult}</div>}
      </div>
    </section>
  );
};

export default APISettingsModal; 
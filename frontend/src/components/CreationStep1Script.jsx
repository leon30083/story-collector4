import React, { useState } from 'react';
import axios from 'axios';

const CreationStep1Script = ({ project, onNext, onPrev, onOpenApiSettings }) => {
  const [params, setParams] = useState({
    style_id: project?.style_id || '',
    age_range: project?.age_range || '',
    theme: project?.theme || '',
    classic: false,
  });
  const [script, setScript] = useState({ cn: '', en: '' });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParams(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleScriptChange = (e) => {
    const { name, value } = e.target;
    setScript(s => ({ ...s, [name]: value }));
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    const res = await axios.post('/api/script/generate', {
      theme: params.theme,
      age_range: params.age_range,
      style_id: params.style_id,
      classic: params.classic,
    });
    setScript({ cn: res.data.script_cn, en: res.data.script_en });
    setLoading(false);
  };

  const handleSave = async () => {
    await axios.post(`/api/script/projects/${project.id}/script`, {
      pages: [
        { page_no: 1, text_cn: script.cn, text_en: script.en }
      ]
    });
    alert('保存成功');
  };

  const handleHistory = async () => {
    const res = await axios.get(`/api/script/projects/${project.id}/script/history`);
    setHistory(res.data);
  };

  return (
    <section className="bg-white rounded p-6 shadow mt-6 flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
        <div className="mb-4">
          <label className="block text-sm mb-1">风格</label>
          <input className="w-full border rounded px-2 py-1" value={params.style_id} name="style_id" onChange={handleParamChange} />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">年龄</label>
          <input className="w-full border rounded px-2 py-1" value={params.age_range} name="age_range" onChange={handleParamChange} />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">主题</label>
          <input className="w-full border rounded px-2 py-1" value={params.theme} name="theme" onChange={handleParamChange} />
        </div>
        <div className="mb-4 flex items-center">
          <input type="checkbox" className="mr-2" id="classic" name="classic" checked={params.classic} onChange={handleParamChange} />
          <label htmlFor="classic" className="text-sm">经典改编</label>
        </div>
        <button className="bg-green-500 text-white w-full py-2 rounded" onClick={handleAIGenerate} disabled={loading}>{loading ? 'AI生成中...' : 'AI生成'}</button>
        <button className="mt-2 w-full bg-gray-200 text-gray-700 py-2 rounded" onClick={onOpenApiSettings}>API设置</button>
      </aside>
      <main className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <div className="space-x-2">
            <button className="bg-blue-100 text-blue-600 px-3 py-1 rounded" onClick={handleSave}>保存</button>
            <button className="bg-gray-100 px-3 py-1 rounded" onClick={handleHistory}>历史版本</button>
            <button className="bg-gray-100 px-3 py-1 rounded">导入/导出</button>
            <button className="bg-gray-100 px-3 py-1 rounded" onClick={handleAIGenerate}>AI再生成</button>
          </div>
          {loading && <span className="text-gray-400">AI生成中...</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold mb-1">中文脚本</div>
            <textarea name="cn" value={script.cn} onChange={handleScriptChange} className="w-full h-64 p-4 border rounded-md" placeholder="中文分段文本..." />
          </div>
          <div>
            <div className="font-semibold mb-1">英文脚本</div>
            <textarea name="en" value={script.en} onChange={handleScriptChange} className="w-full h-64 p-4 border rounded-md" placeholder="English script..." />
          </div>
        </div>
        <div className="text-right text-sm text-gray-500 mt-2">{(script.cn.length + script.en.length)}/1500</div>
      </main>
    </section>
  );
};

export default CreationStep1Script; 
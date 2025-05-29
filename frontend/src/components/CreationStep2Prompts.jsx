import React, { useState } from 'react';
import axios from 'axios';

const CreationStep2Prompts = ({ project, onNext, onPrev, onOpenApiSettings }) => {
  const [prompts, setPrompts] = useState([
    { text: '' },
    { text: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const handlePromptChange = (idx, value) => {
    setPrompts(arr => arr.map((p, i) => i === idx ? { ...p, text: value } : p));
  };

  const handleAIGenerate = async (idx) => {
    setLoading(true);
    const res = await axios.post('/api/prompt/generate', {
      script: project?.pages?.[0]?.text_cn || '',
      style_id: project?.style_id,
    });
    setPrompts(arr => arr.map((p, i) => i === idx ? { ...p, text: res.data.storyboards[0] } : p));
    setLoading(false);
  };

  const handleAdd = () => setPrompts(arr => [...arr, { text: '' }]);
  const handleDelete = (idx) => setPrompts(arr => arr.filter((_, i) => i !== idx));

  const handleSave = async () => {
    await axios.post(`/api/prompt/projects/${project.id}/prompts`, {
      prompts: prompts.map(p => p.text)
    });
    alert('保存成功');
  };

  const handleExport = async () => {
    const res = await axios.get(`/api/prompt/projects/${project.id}/prompts/export`);
    window.open(res.data.file_url, '_blank');
  };

  return (
    <section className="bg-white rounded p-6 shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">2 分镜提示词生成【AI根据脚本生成】</h2>
      <div className="mb-4 bg-gray-50 p-3 rounded">当前场景脚本锚点：<span className="text-gray-600">{project?.pages?.[0]?.text_cn || '无'}</span></div>
      <div className="space-y-4">
        {prompts.map((p, idx) => (
          <div className="flex items-center space-x-2" key={idx}>
            <span className="w-20 text-gray-500">分镜{idx + 1}</span>
            <input className="flex-1 border rounded px-2 py-1" value={p.text} onChange={e => handlePromptChange(idx, e.target.value)} placeholder="提示词..." />
            <button className="bg-green-100 text-green-600 px-2 py-1 rounded" onClick={() => handleAIGenerate(idx)} disabled={loading}>AI生成</button>
            <button className="bg-gray-100 px-2 py-1 rounded" onClick={() => handleDelete(idx)}>删除</button>
            <span className="cursor-move text-gray-400">☰</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-6">
        <div className="space-x-2">
          <button className="bg-blue-100 px-3 py-1 rounded" onClick={handleAdd}>新增分镜</button>
          <button className="bg-gray-100 px-3 py-1 rounded" onClick={handleSave}>保存</button>
          <button className="bg-gray-100 px-3 py-1 rounded" onClick={handleExport}>导出</button>
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={onOpenApiSettings}>API设置</button>
        </div>
        <button className="bg-green-500 text-white px-6 py-2 rounded" onClick={() => prompts.forEach((_, idx) => handleAIGenerate(idx))} disabled={loading}>一键AI生成全部</button>
      </div>
    </section>
  );
};

export default CreationStep2Prompts; 
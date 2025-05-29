import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PromptManagerModal = ({ visible, onClose }) => {
  const [category, setCategory] = useState('script');
  const [name, setName] = useState('');
  const [names, setNames] = useState([]);
  const [content, setContent] = useState('');
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    if (visible) fetchPrompts();
  }, [visible]);

  const fetchPrompts = async () => {
    const res = await axios.get('/api/prompts');
    setPrompts(res.data);
    const filtered = res.data.filter(p => p.type === category);
    setNames(filtered.map(p => p.name));
    if (filtered.length > 0) {
      setName(filtered[0].name);
      setContent(filtered[0].content);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    const filtered = prompts.filter(p => p.type === e.target.value);
    setNames(filtered.map(p => p.name));
    if (filtered.length > 0) {
      setName(filtered[0].name);
      setContent(filtered[0].content);
    } else {
      setName('');
      setContent('');
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    const p = prompts.find(p => p.type === category && p.name === e.target.value);
    setContent(p ? p.content : '');
  };

  const handleSave = async () => {
    await axios.post('/api/prompts', { type: category, name, content });
    alert('保存成功');
    fetchPrompts();
  };

  if (!visible) return null;
  return (
    <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-2/3 p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">提示词管理</h2>
        <div className="mb-4 flex space-x-4">
          <div>
            <label className="block text-sm">分类</label>
            <select className="p-2 border rounded" value={category} onChange={handleCategoryChange}>
              <option value="script">文稿提示词</option>
              <option value="storyboard">分镜提示词</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">提示词名称</label>
            <select className="p-2 border rounded" value={name} onChange={handleNameChange}>
              {names.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button className="mt-6 p-2 bg-green-500 text-white rounded" onClick={() => setName(prompt('新名称') || name)}>+ 新增名称</button>
        </div>
        <textarea className="w-full h-40 p-2 border rounded" value={content} onChange={e => setContent(e.target.value)} placeholder="管理当前分类/名称的提示词...示例：温暖、幽默..." />
        <div className="mt-4 text-right">
          <button className="px-4 py-1 bg-gray-200 rounded mr-2" onClick={onClose}>关闭</button>
          <button className="px-4 py-1 bg-blue-500 text-white rounded" onClick={handleSave}>保存</button>
        </div>
      </div>
    </section>
  );
};

export default PromptManagerModal; 
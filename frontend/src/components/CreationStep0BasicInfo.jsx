import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CreationStep0BasicInfo = ({ data, onChange, onNext, onOpenApiSettings }) => {
  const [styles, setStyles] = useState([]);
  const [form, setForm] = useState({
    theme: '',
    age_range: '',
    style_id: '',
    keywords: '',
    style_preview: null,
  });

  useEffect(() => {
    axios.get('/api/styles/').then(res => setStyles(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (onChange) onChange({ ...form, [name]: value });
  };

  const handleStyleSelect = (sid) => {
    setForm(f => ({ ...f, style_id: sid }));
    if (onChange) onChange({ ...form, style_id: sid });
  };

  return (
    <section className="bg-white rounded p-6 shadow">
      <h2 className="text-xl font-semibold mb-4">0 用户输入基本信息</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm">主题</label>
          <input name="theme" value={form.theme} onChange={handleChange} className="w-full p-2 border rounded" placeholder="例如：草船借箭" />
        </div>
        <div>
          <label className="block text-sm">适龄段</label>
          <select name="age_range" value={form.age_range} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">请选择</option>
            <option>3-5 岁</option>
            <option>5-8 岁</option>
            <option>8-10 岁</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">故事风格</label>
          <select name="style_id" value={form.style_id} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">请选择</option>
            {styles.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <label className="block text-sm">关键词</label>
          <input name="keywords" value={form.keywords} onChange={handleChange} className="w-full p-2 border rounded" placeholder="例如：勇敢、智慧、合作" />
        </div>
      </div>
      <div className="mt-6">
        <div className="font-semibold mb-2">风格模板</div>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {styles.map(s => (
            <div key={s.id} className={`w-40 flex-shrink-0 bg-gray-100 rounded p-2 cursor-pointer ${form.style_id == s.id ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => handleStyleSelect(s.id)}>
              <img src={s.image} className="rounded mb-1" alt={s.name} />
              <div className="text-sm text-center">{s.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 text-right">
        <button className="bg-pink-500 text-white px-6 py-2 rounded" onClick={onNext}>下一步</button>
        <button className="ml-2 bg-gray-200 text-gray-700 px-4 py-2 rounded" onClick={onOpenApiSettings}>API设置</button>
      </div>
    </section>
  );
};

export default CreationStep0BasicInfo; 
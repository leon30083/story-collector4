import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScenePromptPage = ({ story, onBack, onNext }) => {
  const [pages, setPages] = useState(story.pages || []);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    axios.get('/api/prompt-templates').then(res => {
      setTemplates(res.data);
      if (res.data.length > 0) setSelectedTemplate(res.data[0]);
    });
  }, []);

  const handleTemplateChange = (e) => {
    const tpl = templates.find(t => t.id === e.target.value);
    setSelectedTemplate(tpl);
  };

  const handleGeneratePrompt = async (idx) => {
    if (!selectedTemplate) return;
    const res = await axios.post('/api/generate-image-prompts', {
      scenes: [{ scene_id: idx, text: pages[idx].text_cn }],
      template_id: selectedTemplate.id
    });
    if (res.data && res.data[0]) {
      const newPages = [...pages];
      newPages[idx].image_prompt = res.data[0].image_prompt;
      setPages(newPages);
    }
  };

  const handlePromptEdit = (idx, val) => {
    const newPages = [...pages];
    newPages[idx].image_prompt = val;
    setPages(newPages);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>分镜头及画面描述</h2>
      {pages.map((page, idx) => (
        <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, marginBottom: 16, padding: 16 }}>
          <div><b>第{idx + 1}页</b></div>
          <div>中文旁白：{page.text_cn}</div>
          <div>英文旁白：{page.text_en}</div>
          <div style={{ margin: '8px 0' }}>
            <label>画面风格模板：</label>
            <select value={selectedTemplate?.id || ''} onChange={handleTemplateChange}>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button onClick={() => handleGeneratePrompt(idx)} style={{ marginLeft: 8 }}>一键生成提示词</button>
          </div>
          <div>
            <label>生图提示词：</label>
            <textarea
              value={page.image_prompt || ''}
              onChange={e => handlePromptEdit(idx, e.target.value)}
              style={{ width: '100%', minHeight: 60 }}
            />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={onBack}>上一步</button>
        <button onClick={() => onNext(pages)}>下一步</button>
      </div>
    </div>
  );
};

export default ScenePromptPage; 
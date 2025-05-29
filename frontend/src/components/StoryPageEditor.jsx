import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import axios from 'axios';

const StoryPageEditor = ({ scene, onUpdatePrompt }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [imagePrompt, setImagePrompt] = useState(scene.image_prompt || '');
  const [customPrompt, setCustomPrompt] = useState(scene.custom_prompt || '');
  const [isCustom, setIsCustom] = useState(!!scene.custom_prompt);

  useEffect(() => {
    axios.get('/api/prompt-templates').then(res => {
      setTemplates(res.data);
      if (!selectedTemplate && res.data.length > 0) {
        setSelectedTemplate(res.data[0]);
      }
    });
  }, []);

  const handleTemplateChange = (e) => {
    const tpl = templates.find(t => t.id === e.target.value);
    setSelectedTemplate(tpl);
  };

  const handleGeneratePrompt = async () => {
    if (!selectedTemplate) return;
    const res = await axios.post('/api/generate-image-prompts', {
      scenes: [{ scene_id: scene.scene_id, text: scene.text }],
      template_id: selectedTemplate.id
    });
    if (res.data && res.data[0]) {
      setImagePrompt(res.data[0].image_prompt);
      setIsCustom(false);
      setCustomPrompt('');
      onUpdatePrompt && onUpdatePrompt(scene.scene_id, res.data[0].image_prompt, selectedTemplate.id);
    }
  };

  const handlePromptEdit = (e) => {
    setCustomPrompt(e.target.value);
    setIsCustom(true);
    onUpdatePrompt && onUpdatePrompt(scene.scene_id, e.target.value, selectedTemplate.id, true);
  };

  return (
    <div className="scene-editor-block">
      <div><b>分镜头内容：</b>{scene.text}</div>
      <div style={{ margin: '8px 0' }}>
        <label>画面风格模板：</label>
        <select value={selectedTemplate?.id || ''} onChange={handleTemplateChange}>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button onClick={handleGeneratePrompt} style={{ marginLeft: 8 }}>一键生成提示词</button>
      </div>
      <div>
        <label>生图提示词：</label>
        <textarea
          value={isCustom ? customPrompt : imagePrompt}
          onChange={handlePromptEdit}
          style={{ width: '100%', minHeight: 60, border: isCustom ? '2px solid #ff9800' : undefined }}
        />
        {isCustom && <span style={{ color: '#ff9800' }}>（已自定义）</span>}
      </div>
    </div>
  );
};

export default StoryPageEditor; 
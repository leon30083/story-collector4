import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, MenuItem, Typography } from '@mui/material';
import EditorToolbar from './EditorToolbar';
import StoryStructureTree from './StoryStructureTree';
import StoryPageEditor from './StoryPageEditor';
import EditorHistoryLog from './EditorHistoryLog';
import ScenePromptPage from './ScenePromptPage';
import { saveStory } from '../utils/localStory';

// mock story数据结构
const mockStory = {
  title: '勇敢的小兔子',
  style_id: '1',
  pages: [
    { page_no: 1, text_cn: '从前有一只小兔子……', text_en: 'Once upon a time, there was a little rabbit...', image_hint: '' },
    { page_no: 2, text_cn: '它很勇敢，喜欢冒险。', text_en: 'It was brave and loved adventures.', image_hint: '' },
  ],
};

export default function StoryEditorPage({ onBack, initParams, onSaved }) {
  const [story, setStory] = useState(initParams || { title: '', author: '', theme: '', age: '', style_id: '', pages: [{ page_no: 1, text_cn: '', text_en: '', image_hint: '' }] });
  const [currentPage, setCurrentPage] = useState(0);
  const [history, setHistory] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  const fileInputRef = useRef();
  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [styles, setStyles] = useState([]);

  useEffect(() => {
    fetch('/text/ai_picturebook_styles.json')
      .then(res => res.json())
      .then(data => {
        const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        setStyles(arr);
      })
      .catch(() => setStyles([]));
  }, []);

  // 顶部属性区操作
  const handleMetaChange = (field, value) => {
    setStory(prev => ({ ...prev, [field]: value }));
  };
  const handleSave = () => {
    saveStory(story);
    setSnackbar({ open: true, message: '保存成功', severity: 'success' });
    if (onSaved) onSaved();
  };
  const handleAIGenerate = () => {
    // TODO: AI生成逻辑
    setSnackbar({ open: true, message: 'AI生成文稿功能待接入', severity: 'info' });
  };
  const handleNext = () => {
    setSnackbar({ open: true, message: '分镜头提示词功能待接入', severity: 'info' });
  };

  // 页内容编辑
  const handleEditPage = (idx, field, value) => {
    const newPages = [...story.pages];
    newPages[idx] = { ...newPages[idx], [field]: value };
    setStory({ ...story, pages: newPages });
    setHistory([...history, { type: 'edit', page: idx, field, value }]);
  };

  // 全局风格切换，所有页同步
  const handleApplyStyle = (styleId) => {
    const newPages = story.pages.map(p => ({ ...p, style_id: styleId }));
    setStory({ ...story, style_id: styleId, pages: newPages });
    setHistory([...history, { type: 'apply_style', styleId }]);
  };

  // 插入新页
  const handleInsertPage = (idx) => {
    const newPages = [...story.pages];
    newPages.splice(idx, 0, { page_no: idx + 1, text_cn: '', text_en: '', image_hint: '', style_id: story.style_id });
    // 重新编号
    newPages.forEach((p, i) => (p.page_no = i + 1));
    setStory({ ...story, pages: newPages });
    setCurrentPage(idx);
    setHistory([...history, { type: 'insert_page', idx }]);
  };

  // 删除页
  const handleDeletePage = (idx) => {
    if (story.pages.length <= 1) return setSnackbar({ open: true, message: '至少保留一页', severity: 'warning' });
    const newPages = story.pages.filter((_, i) => i !== idx);
    newPages.forEach((p, i) => (p.page_no = i + 1));
    setStory({ ...story, pages: newPages });
    setCurrentPage(Math.max(0, idx - 1));
    setHistory([...history, { type: 'delete_page', idx }]);
  };

  // 导出markdown
  const handleExportMarkdown = () => {
    const md = story.pages.map((p, i) => `🖼 Page ${i + 1}\n文本：\n${p.text_cn}\n${p.text_en ? p.text_en + '\n' : ''}\n画面建议：\n${p.image_hint || ''}\n`).join('\n');
    setExportDialogOpen(true);
    setImportText(md);
  };

  // 导入markdown
  const handleImportMarkdown = () => {
    // 简单解析：按"🖼 Page"分段
    const blocks = importText.split(/🖼 Page \d+/).filter(Boolean);
    const pages = blocks.map((block, i) => {
      const textMatch = block.match(/文本：([\s\S]*?)(画面建议：|$)/);
      const imageMatch = block.match(/画面建议：([\s\S]*)/);
      let text_cn = '', text_en = '';
      if (textMatch) {
        const lines = textMatch[1].trim().split('\n').filter(Boolean);
        text_cn = lines[0] || '';
        text_en = lines[1] || '';
      }
      return {
        page_no: i + 1,
        text_cn,
        text_en,
        image_hint: imageMatch ? imageMatch[1].trim() : '',
        style_id: story.style_id,
      };
    });
    if (pages.length > 0) {
      setStory({ ...story, pages });
      setCurrentPage(0);
      setSnackbar({ open: true, message: '导入成功', severity: 'success' });
      setImportDialogOpen(false);
    } else {
      setSnackbar({ open: true, message: '导入失败，格式不正确', severity: 'error' });
    }
  };

  // 批量分段
  const handleBatchSplit = () => {
    // 按空行分段
    const blocks = batchText.split(/\n\s*\n/).filter(Boolean);
    const pages = blocks.map((block, i) => ({
      page_no: i + 1,
      text_cn: block.trim(),
      text_en: '',
      image_hint: '',
      style_id: story.style_id,
    }));
    if (pages.length > 0) {
      setStory({ ...story, pages });
      setCurrentPage(0);
      setSnackbar({ open: true, message: '批量分段成功', severity: 'success' });
      setBatchDialogOpen(false);
    } else {
      setSnackbar({ open: true, message: '分段失败，内容为空', severity: 'error' });
    }
  };

  // 下一步进入分镜头提示词流程
  const handleScenePromptsNext = (pagesWithPrompts) => {
    setStory({ ...story, pages: pagesWithPrompts });
    // 可在此处继续后续流程，如导出、提交等
  };

  // 在AI生成文稿后（如pages更新后），自动保存到本地
  useEffect(() => {
    if (story && Array.isArray(story.pages) && story.pages.length > 0) {
      saveStory(story);
    }
  }, [story.pages]);

  if (step === 1) {
    return <ScenePromptPage story={story} onBack={() => setStep(0)} onNext={handleScenePromptsNext} />;
  }

  return (
    <Paper sx={{ p: 2, minHeight: '80vh' }}>
      {/* 顶部属性区 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Button onClick={onBack} variant="outlined">返回故事库</Button>
        <Button variant="contained" color="primary" onClick={handleSave}>保存</Button>
        <Button variant="outlined" color="secondary" onClick={handleAIGenerate}>AI一键生成文稿</Button>
        <Button variant="outlined" onClick={handleNext}>下一步（分镜头提示词）</Button>
        <TextField label="标题" value={story.title || ''} onChange={e => handleMetaChange('title', e.target.value)} size="small" sx={{ minWidth: 120 }} />
        <TextField label="作者" value={story.author || ''} onChange={e => handleMetaChange('author', e.target.value)} size="small" sx={{ minWidth: 100 }} />
        <TextField label="主题" value={story.theme || ''} onChange={e => handleMetaChange('theme', e.target.value)} size="small" sx={{ minWidth: 100 }} />
        <TextField label="适龄" value={story.age || ''} onChange={e => handleMetaChange('age', e.target.value)} size="small" sx={{ minWidth: 80 }} />
        <TextField select label="风格" value={story.style_id || ''} onChange={e => handleApplyStyle(e.target.value)} size="small" sx={{ minWidth: 120 }}>
          <MenuItem value="">不限</MenuItem>
          {styles.map(opt => (
            <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
          ))}
        </TextField>
      </Box>
      <EditorToolbar
        onExportMarkdown={handleExportMarkdown}
        onImportMarkdown={() => setImportDialogOpen(true)}
        onBatchSplit={() => setBatchDialogOpen(true)}
      />
      <Grid container spacing={2}>
        <Grid item xs={2} sx={{ position: 'sticky', top: 0, alignSelf: 'flex-start', height: '80vh', overflowY: 'auto', zIndex: 2 }}>
          <StoryStructureTree
            pages={story.pages}
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
            onInsertPage={handleInsertPage}
            onDeletePage={handleDeletePage}
          />
        </Grid>
        <Grid item xs={10}>
          {story.pages.map((page, idx) => (
            <Box key={idx} sx={{ mb: 3, border: idx === currentPage ? '2px solid #1976d2' : '1px solid #eee', borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>第{idx + 1}页</Typography>
              <TextField label="中文内容" value={page.text_cn} multiline minRows={3} fullWidth onChange={e => handleEditPage(idx, 'text_cn', e.target.value)} sx={{ mb: 1 }} />
              <TextField label="英文内容" value={page.text_en} multiline minRows={2} fullWidth onChange={e => handleEditPage(idx, 'text_en', e.target.value)} sx={{ mb: 1 }} />
              <TextField label="配图建议" value={page.image_hint} multiline minRows={2} fullWidth onChange={e => handleEditPage(idx, 'image_hint', e.target.value)} />
            </Box>
          ))}
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <EditorHistoryLog history={history} />
      </Box>
      {/* 导入/导出markdown弹窗 */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>导入/粘贴markdown</DialogTitle>
        <DialogContent>
          <TextField
            label="markdown内容"
            value={importText}
            onChange={e => setImportText(e.target.value)}
            multiline
            minRows={10}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>取消</Button>
          <Button onClick={handleImportMarkdown} variant="contained">导入</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>导出markdown</DialogTitle>
        <DialogContent>
          <TextField
            label="markdown内容"
            value={importText}
            multiline
            minRows={10}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
      {/* 批量分段弹窗 */}
      <Dialog open={batchDialogOpen} onClose={() => setBatchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>批量粘贴/一键分段</DialogTitle>
        <DialogContent>
          <TextField
            label="请输入大段文本，系统将按空行自动分段"
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            multiline
            minRows={10}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialogOpen(false)}>取消</Button>
          <Button onClick={handleBatchSplit} variant="contained">一键分段</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Paper>
  );
} 
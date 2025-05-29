import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar } from '@mui/material';
import EditorToolbar from './EditorToolbar';
import StoryStructureTree from './StoryStructureTree';
import StoryPageEditor from './StoryPageEditor';
import StyleRecommendation from './StyleRecommendation';
import EditorHistoryLog from './EditorHistoryLog';
import { Typography } from '@mui/material';
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

export default function StoryEditorPage({ onBack, initParams }) {
  // 根据initParams初始化story
  const initialStory = initParams
    ? {
        title: initParams.theme || '新故事',
        style_id: initParams.style || '',
        age: initParams.age || '',
        lang: initParams.lang || 'zh',
        words: initParams.words || 600,
        pages: Array.isArray(initParams.pages) && initParams.pages.length > 0
          ? initParams.pages
          : [{ page_no: 1, text_cn: '', text_en: '', image_hint: '' }],
      }
    : mockStory;
  const [story, setStory] = useState(initialStory);
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

  // 支持 initParams 变化时刷新 story
  useEffect(() => {
    if (initParams) {
      setStory({
        ...initParams,
        pages: Array.isArray(initParams.pages) && initParams.pages.length > 0
          ? initParams.pages
          : [{ page_no: 1, text_cn: '', text_en: '', image_hint: '' }],
      });
    }
  }, [initParams]);

  // 切换页
  const handleSelectPage = (idx) => setCurrentPage(idx);

  // 编辑当前页内容
  const handleEditPage = (field, value) => {
    const newPages = [...story.pages];
    newPages[currentPage] = { ...newPages[currentPage], [field]: value };
    setStory({ ...story, pages: newPages });
    setHistory([...history, { type: 'edit', page: currentPage, field, value }]);
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
  const handleNext = () => setStep(1);
  // 上一步返回文稿编辑
  const handleBack = () => setStep(0);
  // 分镜头流程完成后的回调
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
    return <ScenePromptPage story={story} onBack={handleBack} onNext={handleScenePromptsNext} />;
  }

  return (
    <Paper sx={{ p: 2, minHeight: '80vh' }}>
      <EditorToolbar
        onBack={onBack}
        onExportMarkdown={handleExportMarkdown}
        onImportMarkdown={() => setImportDialogOpen(true)}
        onBatchSplit={() => setBatchDialogOpen(true)}
      />
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <StoryStructureTree
            pages={story.pages}
            currentPage={currentPage}
            onSelectPage={handleSelectPage}
            onInsertPage={handleInsertPage}
            onDeletePage={handleDeletePage}
          />
        </Grid>
        <Grid item xs={6}>
          {/* 多页编辑区 */}
          {Array.isArray(story.pages) && story.pages.map((page, idx) => (
            <Box key={idx} sx={{ mb: 3, border: idx === currentPage ? '2px solid #1976d2' : '1px solid #eee', borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>第{idx + 1}页</Typography>
              <TextField
                label="中文内容"
                value={page.text_cn}
                multiline
                minRows={3}
                fullWidth
                onChange={e => {
                  const newPages = [...story.pages];
                  newPages[idx].text_cn = e.target.value;
                  setStory({ ...story, pages: newPages });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="英文内容"
                value={page.text_en}
                multiline
                minRows={2}
                fullWidth
                onChange={e => {
                  const newPages = [...story.pages];
                  newPages[idx].text_en = e.target.value;
                  setStory({ ...story, pages: newPages });
                }}
                sx={{ mb: 1 }}
              />
              <TextField
                label="配图建议"
                value={page.image_hint}
                multiline
                minRows={2}
                fullWidth
                onChange={e => {
                  const newPages = [...story.pages];
                  newPages[idx].image_hint = e.target.value;
                  setStory({ ...story, pages: newPages });
                }}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button onClick={() => handleInsertPage(idx + 1)}>在后面插入新页</Button>
                <Button onClick={() => handleDeletePage(idx)} color="error">删除本页</Button>
              </Box>
            </Box>
          ))}
        </Grid>
        <Grid item xs={4}>
          <StyleRecommendation
            currentStyleId={story.style_id}
            onApplyStyle={handleApplyStyle}
          />
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
      <button onClick={handleNext} style={{ marginTop: 24 }}>下一步（分镜头提示词）</button>
    </Paper>
  );
} 
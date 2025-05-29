import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, ButtonGroup } from '@mui/material';
import StoryLibraryPage from './components/StoryLibraryPage';
import StoryUpload from './components/StoryUpload';
import StoryList from './components/StoryList';
import StoryCollector from './components/StoryCollector';
import Settings from './components/Settings';
import CategoryManager from './components/CategoryManager';
import StoryEditorPage from './components/StoryEditorPage';
import StoryCreationForm from './components/StoryCreationForm';

function App() {
  const [page, setPage] = useState('library'); // 'library' or 'legacy' or 'creation' or 'editor'
  const [editorInit, setEditorInit] = useState(null); // 结构化编辑器初始参数
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);

  // 获取分类列表
  const fetchCategories = async () => {
    const res = await fetch('http://localhost:5000/api/categories');
    const data = await res.json();
    setCategories(data.map(c => c.name));
  };

  // 获取故事列表
  const fetchStories = async (category = '', batch = '') => {
    let url = 'http://localhost:5000/api/stories';
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (batch) params.push(`batch=${encodeURIComponent(batch)}`);
    if (params.length > 0) url += '?' + params.join('&');
    const res = await fetch(url);
    const data = await res.json();
    setStories(data);
    // 自动提取所有批次
    const batchSet = new Set();
    data.forEach(story => { if (story.batch) batchSet.add(story.batch); });
    setBatches(Array.from(batchSet));
  };

  // 分类或批次变更时同步
  const handleCategoryChange = (category, batch) => {
    fetchStories(category, batch);
    fetchCategories(); // 分类变更时也刷新分类
  };

  // 新增：直接追加新收集的故事
  const handleStoryCollected = (newStories) => {
    if (Array.isArray(newStories) && newStories.length > 0) {
      setStories(prev => ([...newStories, ...prev]));
      // 更新批次
      const batchSet = new Set([...newStories.map(s => s.batch), ...stories.map(s => s.batch)]);
      setBatches(Array.from(batchSet));
      fetchCategories(); // 新采集后刷新分类
    } else {
      fetchStories(); // 兜底刷新
      fetchCategories();
    }
  };

  // 上传成功后刷新故事和分类
  const handleUploadSuccess = () => {
    fetchStories();
    fetchCategories();
  };

  useEffect(() => {
    fetchStories();
    fetchCategories();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          儿童绘本故事收集系统
        </Typography>
        <ButtonGroup sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant={page === 'library' ? 'contained' : 'outlined'}
            onClick={() => setPage('library')}
          >
            故事库首页
          </Button>
          <Button
            variant={page === 'legacy' ? 'contained' : 'outlined'}
            onClick={() => setPage('legacy')}
          >
            原功能页
          </Button>
        </ButtonGroup>
        {page === 'library' && (
          <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" onClick={() => setPage('creation')}>
                新建故事
              </Button>
            </Box>
            <StoryLibraryPage />
          </>
        )}
        {page === 'creation' && (
          <StoryCreationForm
            onConfirm={storyData => {
              setEditorInit(storyData); // storyData 应为完整 story（含 pages）
              setPage('editor');
            }}
            onCancel={() => setPage('library')}
          />
        )}
        {page === 'editor' && (
          <StoryEditorPage onBack={() => setPage('library')} initParams={editorInit} />
        )}
        {page === 'legacy' && (
          <>
            <Box sx={{ mb: 4 }}>
              <Settings />
            </Box>
            <Box sx={{ mb: 4 }}>
              <CategoryManager onCategoryChange={handleCategoryChange} />
            </Box>
            <Box sx={{ mb: 4 }}>
              <StoryCollector onStoryGenerated={handleStoryCollected} categories={categories} />
            </Box>
            <Box sx={{ mb: 4 }}>
              <StoryUpload onUploadSuccess={handleUploadSuccess} />
            </Box>
            <Box>
              <StoryList
                stories={stories}
                categories={categories}
                onCategoryChange={handleCategoryChange}
                batches={batches}
              />
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

export default App; 
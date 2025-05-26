import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import StoryUpload from './components/StoryUpload';
import StoryList from './components/StoryList';
import StoryCollector from './components/StoryCollector';
import Settings from './components/Settings';
import CategoryManager from './components/CategoryManager';

function App() {
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
      </Box>
    </Container>
  );
}

export default App; 
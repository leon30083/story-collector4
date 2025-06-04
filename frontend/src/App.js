import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, ButtonGroup } from '@mui/material';
import StoryLibraryPage from './components/StoryLibraryPage';
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
  const fetchStories = async () => {
    const res = await fetch('http://localhost:5000/api/stories');
    const allData = await res.json();
    setStories(allData);
    // 批次下拉框始终用全量数据提取
    const batchSet = new Set();
    allData.forEach(story => { if (story.batch) batchSet.add(story.batch); });
    setBatches(Array.from(batchSet));
  };

  // 分类或批次变更时同步
  const handleCategoryChange = (category, batch) => {
    setTimeout(() => {
      fetchStories();
      fetchCategories();
    }, 100);
  };

  // 新增：采集成功后延迟刷新
  const handleStoryCollected = (newStories) => {
    if (Array.isArray(newStories) && newStories.length > 0) {
      setStories(prev => ([...newStories, ...prev]));
      const batchSet = new Set([...newStories.map(s => s.batch), ...stories.map(s => s.batch)]);
      setBatches(Array.from(batchSet));
      setTimeout(() => { fetchCategories(); }, 300);
    } else {
      setTimeout(() => {
        fetchStories();
        fetchCategories();
      }, 300);
    }
  };

  // 上传成功后刷新故事和分类
  const handleUploadSuccess = () => {
    setTimeout(() => {
      fetchStories();
      fetchCategories();
    }, 300);
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
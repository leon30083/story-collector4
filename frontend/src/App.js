import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import StoryUpload from './components/StoryUpload';
import StoryList from './components/StoryList';
import StoryCollector from './components/StoryCollector';
import Settings from './components/Settings';

const categories = [
  '成语故事',
  '童话故事',
  '神话故事',
  '寓言故事'
];

function App() {
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState('collect'); // 'collect' 或 'upload'

  // 获取故事列表
  const fetchStories = async (category = '') => {
    let url = 'http://localhost:5000/api/stories';
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setStories(data);
  };

  // 新增：直接追加新收集的故事
  const handleStoryCollected = (newStories) => {
    if (Array.isArray(newStories) && newStories.length > 0) {
      setStories(prev => ([...newStories, ...prev]));
    } else {
      fetchStories(); // 兜底刷新
    }
  };

  useEffect(() => {
    fetchStories();
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
          <StoryCollector onStoryGenerated={handleStoryCollected} />
        </Box>

        <Box sx={{ mb: 4 }}>
          <StoryUpload onUploadSuccess={fetchStories} />
        </Box>

        <Box>
          <StoryList
            stories={stories}
            categories={categories}
            onCategoryChange={fetchStories}
          />
        </Box>
      </Box>
    </Container>
  );
}

export default App; 
import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import StoryUpload from './components/StoryUpload';
import StoryList from './components/StoryList';
import StoryCollector from './components/StoryCollector';
import Settings from './components/Settings';

// 移除硬编码的分类列表
// const categories = [
//   '成语故事',
//   '童话故事',
//   '神话故事',
//   '寓言故事'
// ];

function App() {
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState('collect'); // 'collect' 或 'upload'
  const [systemCategories, setSystemCategories] = useState([]); // 新增状态，存储系统分类

  // 获取分类列表的函数
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        setSystemCategories(data); // 更新系统分类状态
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // 当分类在 CategoryManager 中更新后调用此函数
  const handleCategoriesUpdated = () => {
      fetchCategories(); // 重新获取分类列表
      // 同时考虑刷新当前故事列表，如果当前故事列表是按某个分类过滤的
      // 简单的做法是刷新整个故事列表，或者更精确地判断当前过滤状态
      // 为了简单起见，这里不自动刷新故事列表，用户可以手动选择分类刷新
  };

  // 获取故事列表
  const fetchStories = async (categoryName = '') => { // 参数名改为 categoryName 以以免和状态变量冲突
    let url = 'http://localhost:5000/api/stories';
    if (categoryName) { // 使用 categoryName
        url += `?category=${encodeURIComponent(categoryName)}`; // 仍然按名称过滤
    }
    try {
         const res = await fetch(url);
         if (res.ok) {
             const data = await res.json();
             setStories(data);
         } else {
             console.error('Failed to fetch stories:', res.status, res.statusText);
             setStories([]);
         }
    } catch (error) {
         console.error('Error fetching stories:', error);
         setStories([]);
    }

  };

  // 新增：直接追加新收集的故事
  const handleStoryCollected = (newStories) => {
    if (Array.isArray(newStories) && newStories.length > 0) {
      // 在将新故事添加到列表之前，确保它们包含完整的分类信息
      // 后端 /api/collect 返回的故事对象应该已经包含 category_id 和 category.name
      setStories(prev => ([...newStories, ...prev]));
    } else {
      fetchStories(); // 兜底刷新整个列表
    }
  };

  // 组件加载时获取分类列表和故事列表
  useEffect(() => {
    fetchCategories();
    fetchStories(); // 初始获取所有故事
  }, []); // 依赖项为空数组，只在组件加载时运行一次


  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          儿童绘本故事收集系统
        </Typography>

        <Box sx={{ mb: 4 }}>
           {/* 将 handleCategoriesUpdated 传递给 Settings */}
          <Settings />
        </Box>

        <Box sx={{ mb: 4 }}>
           {/* 将获取到的系统分类传递给 StoryCollector，同时传递更新回调 */}
          <StoryCollector
            onStoryGenerated={handleStoryCollected}
            categories={systemCategories} // 传递分类对象数组
            onCategoriesUpdated={handleCategoriesUpdated} // 添加传递更新回调
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <StoryUpload onUploadSuccess={fetchStories} />
        </Box>

        <Box>
           {/* 将获取到的系统分类传递给 StoryList */}
           {/* StoryList 期望的是分类名称数组，所以这里map一下 */}
          <StoryList
            stories={stories}
            categories={systemCategories.map(cat => cat.name)} // 传递分类名称数组
            onCategoryChange={fetchStories} // StoryList 传递的是分类名称
          />
        </Box>
      </Box>
    </Container>
  );
}

export default App; 
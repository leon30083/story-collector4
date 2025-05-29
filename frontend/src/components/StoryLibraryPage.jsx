import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Paper, InputBase, IconButton, Grid, Pagination, Dialog } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { listStories, removeStory } from '../utils/localStory';
import StoryEditorPage from './StoryEditorPage';
import StoryCreationForm from './StoryCreationForm';

function StoryCard({ story, onEdit, onDelete, onExport }) {
  return (
    <Paper sx={{ p: 2, minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{story.title || '无标题'}</Typography>
      <Typography variant="body2" color="text.secondary">{story.author} | {story.age_range} | {story.theme}</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button size="small" variant="contained" onClick={() => onEdit(story)}>编辑</Button>
        <Button size="small" variant="outlined" color="error" onClick={() => onDelete(story)}>删除</Button>
        <Button size="small" variant="outlined" color="secondary" onClick={() => onExport(story)}>导出</Button>
      </Box>
    </Paper>
  );
}

export default function StoryLibraryPage() {
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  useEffect(() => {
    const refreshStories = () => {
      const localStories = listStories();
      setStories(localStories);
    };
    refreshStories();
    window.addEventListener('focus', refreshStories);
    return () => window.removeEventListener('focus', refreshStories);
  }, []);

  // 搜索与分页
  const filteredStories = stories.filter(s => (s.title || '').includes(search) || (s.author || '').includes(search) || (s.theme || '').includes(search));
  const pageSize = 6;
  const pageCount = Math.ceil(filteredStories.length / pageSize);
  const pagedStories = filteredStories.slice((page - 1) * pageSize, page * pageSize);

  // 操作
  const handleDelete = (story) => {
    removeStory(story.id);
    setStories(listStories());
  };
  const handleExport = (story) => {
    // TODO: 导出逻辑
    alert(`导出故事：${story.title}`);
  };

  if (editingStory) {
    return <StoryEditorPage initParams={editingStory} onBack={() => setEditingStory(null)} onSaved={() => setStories(listStories())} />;
  }

  return (
    <Box>
      {/* 顶部导航 */}
      <AppBar position="static" color="default" elevation={2} sx={{ borderRadius: 2, mt: 2, mb: 2 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>儿童绘本故事收集系统</Typography>
          <Button startIcon={<AddIcon />} variant="contained" color="primary" onClick={() => setCreateOpen(true)}>新建故事</Button>
        </Toolbar>
      </AppBar>
      {/* 统计区 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: '#f0f4ff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="subtitle2">全部故事</Typography>
          <Typography variant="h5" color="primary">{stories.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: '#f0f4ff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="subtitle2">当前筛选</Typography>
          <Typography variant="h5" color="primary">{filteredStories.length}</Typography>
        </Paper>
      </Box>
      {/* 筛选区 */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <InputBase
          placeholder="搜索故事标题/作者/关键词"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ ml: 1, flex: 1 }}
        />
        <IconButton>
          <SearchIcon />
        </IconButton>
      </Paper>
      {/* 故事卡片列表 */}
      <Grid container spacing={2}>
        {pagedStories.map(story => (
          <Grid item xs={12} sm={6} md={4} key={story.id}>
            <StoryCard
              story={story}
              onEdit={setEditingStory}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          </Grid>
        ))}
      </Grid>
      {/* 分页 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination count={pageCount} page={page} onChange={(e, val) => setPage(val)} />
      </Box>
      {/* 新建故事弹窗 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <StoryCreationForm
          onConfirm={storyData => {
            setCreateOpen(false);
            setStories(listStories());
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Dialog>
    </Box>
  );
} 
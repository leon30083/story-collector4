import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Paper, InputBase, IconButton, Grid, Checkbox, Pagination, Dialog, TextField, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import StoryUpload from './StoryUpload';
import CategoryManager from './CategoryManager';

function StoryCard({ story, selected, onSelect, onEdit, onDelete, onExport, onDetail }) {
  return (
    <Paper sx={{
      p: 2,
      position: 'relative',
      boxShadow: 3,
      borderRadius: 3,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 8, borderColor: 'primary.main' },
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <Checkbox
        checked={selected}
        onChange={e => onSelect(story.id, e.target.checked)}
        sx={{ position: 'absolute', top: 8, left: 8 }}
      />
      <Typography variant="h6" style={{ cursor: 'pointer' }} onClick={() => onDetail(story)}>{story.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{story.author} | {story.age_range} | {story.theme}</Typography>
      <Typography variant="caption" color="text.secondary">创建：{story.created_at}</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button size="small" variant="contained" color="primary" onClick={() => onEdit(story)}>编辑</Button>
        <Button size="small" variant="outlined" color="error" onClick={() => onDelete(story)}>删除</Button>
        <Button size="small" variant="outlined" color="secondary" onClick={() => onExport(story)}>导出</Button>
      </Box>
    </Paper>
  );
}

export default function StoryLibraryPage({ stories = [], categories = [], onCategoryChange }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statOpen, setStatOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    author: '',
    age_range: '',
    theme: '',
    style_id: 1,
    created_at: '',
    updated_at: '',
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStory, setDetailStory] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editStory, setEditStory] = useState(null);

  // 筛选逻辑
  const filteredStories = stories.filter(
    s =>
      (category === '' || s.theme === category) &&
      ((s.title && s.title.includes(search)) ||
        (s.author && s.author.includes(search)) ||
        (s.theme && s.theme.includes(search)))
  );

  // 分页逻辑
  const pageSize = 6;
  const pageCount = Math.ceil(filteredStories.length / pageSize);
  const pagedStories = filteredStories.slice((page - 1) * pageSize, page * pageSize);

  // 事件处理
  const handleSelect = (id, checked) => {
    setSelected(sel =>
      checked ? [...sel, id] : sel.filter(i => i !== id)
    );
  };

  // 分类筛选
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
    if (onCategoryChange) onCategoryChange(e.target.value, '');
  };

  // 数据获取（mock/后端API）
  const fetchStories = async () => {
    // TODO: 切换为真实API时替换此处
    // setStories(mockStories);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm('确定要批量删除选中的故事吗？')) return;
    try {
      const res = await fetch('http://localhost:5000/api/stories/batch_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelected([]);
        // TODO: 这里应刷新父组件数据
      } else {
        alert(data.error || '批量删除失败');
      }
    } catch (e) {
      alert('网络错误');
    }
  };

  // 批量导出
  const handleBatchExport = async () => {
    if (selected.length === 0) return;
    try {
      const res = await fetch('http://localhost:5000/api/stories/batch_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stories_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('批量导出失败');
      }
    } catch (e) {
      alert('网络错误');
    }
  };

  // 单条操作
  const handleEdit = (story) => {
    setEditStory({ ...story });
    setEditOpen(true);
  };

  const handleDelete = (story) => {
    // TODO: 调用API删除
    alert(`删除故事：${story.title}`);
    // setStories(stories.filter(s => s.id !== story.id));
    setSelected(selected.filter(id => id !== story.id));
  };

  const handleExport = (story) => {
    // TODO: 调用API导出
    alert(`导出故事：${story.title}`);
  };

  return (
    <Box>
      {/* 顶部导航 */}
      <AppBar position="static" color="default" elevation={2} sx={{ borderRadius: 2, mt: 2, mb: 2 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>故事库</Typography>
          <Button startIcon={<BarChartIcon />} sx={{ mr: 1 }} onClick={() => setStatOpen(true)} color="secondary" variant="outlined">统计</Button>
          <Button startIcon={<CategoryIcon />} sx={{ mr: 1 }} onClick={() => setCategoryOpen(true)} color="secondary" variant="outlined">分类管理</Button>
          <Button startIcon={<UploadFileIcon />} sx={{ mr: 1 }} onClick={() => setImportOpen(true)} color="secondary" variant="outlined">导入</Button>
          <Button startIcon={<AddIcon />} variant="contained" color="primary" onClick={() => setCreateOpen(true)}>新建故事</Button>
        </Toolbar>
      </AppBar>

      {/* 统计区 */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 2 }}>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: '#f0f4ff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="subtitle2">全部故事</Typography>
          <Typography variant="h5" color="primary">{stories.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: '#f0f4ff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="subtitle2">当前筛选</Typography>
          <Typography variant="h5" color="primary">{filteredStories.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: '#f0f4ff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="subtitle2">分类分布</Typography>
          <Typography variant="body2">
            {categories.filter(c => c).map(cat => `${cat}:${stories.filter(s => s.theme === cat).length}`).join(' / ')}
          </Typography>
        </Paper>
      </Box>

      {/* 筛选区 */}
      <Paper sx={{ p: 2, mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <InputBase
          placeholder="搜索故事标题/作者/关键词"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ ml: 1, flex: 1 }}
        />
        <Box sx={{ minWidth: 120, ml: 2 }}>
          <select
            value={category}
            onChange={handleCategoryChange}
            style={{ height: 36, borderRadius: 4, border: '1px solid #ccc', padding: '0 8px' }}
          >
            <option value="">全部</option>
            {categories.filter(c => c).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </Box>
        <IconButton>
          <SearchIcon />
        </IconButton>
      </Paper>

      {/* 批量操作区 */}
      {selected.length > 0 && (
        <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5' }}>
          <Typography sx={{ flexGrow: 1 }}>{`已选中 ${selected.length} 项`}</Typography>
          <Button startIcon={<DeleteIcon />} color="error" sx={{ mr: 1 }} onClick={handleBatchDelete}>批量删除</Button>
          <Button startIcon={<DownloadIcon />} color="primary" onClick={handleBatchExport}>批量导出</Button>
        </Paper>
      )}

      {/* 故事卡片列表 */}
      <Grid container spacing={2}>
        {pagedStories.map(story => (
          <Grid item xs={12} sm={6} md={4} key={story.id}>
            <StoryCard
              story={story}
              selected={selected.includes(story.id)}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExport={handleExport}
              onDetail={s => { setDetailStory(s); setDetailOpen(true); }}
            />
          </Grid>
        ))}
      </Grid>

      {/* 分页 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination count={pageCount} page={page} onChange={(e, val) => setPage(val)} />
      </Box>

      {/* 导入弹窗 */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>批量导入故事</Typography>
          <StoryUpload onSuccess={() => setImportOpen(false)} />
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button onClick={() => setImportOpen(false)}>关闭</Button>
          </Box>
        </Box>
      </Dialog>
      {/* 分类管理弹窗 */}
      <Dialog open={categoryOpen} onClose={() => setCategoryOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>分类管理</Typography>
          <CategoryManager onClose={() => setCategoryOpen(false)} />
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button onClick={() => setCategoryOpen(false)}>关闭</Button>
          </Box>
        </Box>
      </Dialog>
      {/* 统计弹窗 */}
      <Dialog open={statOpen} onClose={() => setStatOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>统计信息</Typography>
          <Typography>（此处可集成可视化统计组件，当前为mock内容）</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography>全部故事：{stories.length}</Typography>
            <Typography>当前筛选：{filteredStories.length}</Typography>
            <Typography>分类分布：{categories.filter(c => c).map(cat => `${cat}:${stories.filter(s => s.theme === cat).length}`).join(' / ')}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button onClick={() => setStatOpen(false)}>关闭</Button>
          </Box>
        </Box>
      </Dialog>
      {/* 新建故事弹窗 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>新建故事</Typography>
          <TextField label="标题" value={newStory.title} onChange={e => setNewStory({ ...newStory, title: e.target.value })} fullWidth />
          <TextField label="作者" value={newStory.author} onChange={e => setNewStory({ ...newStory, author: e.target.value })} fullWidth />
          <TextField label="主题" value={newStory.theme} onChange={e => setNewStory({ ...newStory, theme: e.target.value })} fullWidth select>
            {categories.filter(c => c).map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
          <TextField label="适龄" value={newStory.age_range} onChange={e => setNewStory({ ...newStory, age_range: e.target.value })} fullWidth />
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button onClick={() => setCreateOpen(false)} sx={{ mr: 1 }}>取消</Button>
            <Button variant="contained" onClick={() => {
              const now = new Date().toISOString().slice(0, 10);
              // 这里只做本地演示，实际应调用API
              setNewStory({ title: '', author: '', age_range: '', theme: '', style_id: 1, created_at: '', updated_at: '' });
              setCreateOpen(false);
            }}>提交</Button>
          </Box>
        </Box>
      </Dialog>
      {/* 故事详情弹窗 */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>故事详情</Typography>
          {detailStory && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography>标题：{detailStory.title}</Typography>
              <Typography>作者：{detailStory.author}</Typography>
              <Typography>主题：{detailStory.theme}</Typography>
              <Typography>适龄：{detailStory.age_range}</Typography>
              <Typography>风格ID：{detailStory.style_id}</Typography>
              <Typography>创建时间：{detailStory.created_at}</Typography>
              <Typography>更新时间：{detailStory.updated_at}</Typography>
            </Box>
          )}
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
          </Box>
        </Box>
      </Dialog>
      {/* 编辑故事弹窗 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>编辑故事</Typography>
          {editStory && <>
            <TextField label="标题" value={editStory.title} onChange={e => setEditStory({ ...editStory, title: e.target.value })} fullWidth />
            <TextField label="作者" value={editStory.author} onChange={e => setEditStory({ ...editStory, author: e.target.value })} fullWidth />
            <TextField label="主题" value={editStory.theme} onChange={e => setEditStory({ ...editStory, theme: e.target.value })} fullWidth select>
              {categories.filter(c => c).map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            <TextField label="适龄" value={editStory.age_range} onChange={e => setEditStory({ ...editStory, age_range: e.target.value })} fullWidth />
          </>}
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ mr: 1 }}>取消</Button>
            <Button variant="contained" onClick={() => {
              // 这里只做本地演示，实际应调用API
              setEditStory({ ...editStory, updated_at: new Date().toISOString().slice(0, 10) });
              setEditOpen(false);
            }}>保存</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
} 
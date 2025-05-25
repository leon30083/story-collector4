import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function StoryList({ stories, categories, onCategoryChange }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [detailStory, setDetailStory] = useState(null);
  const [editStory, setEditStory] = useState(null);
  const [deleteStory, setDeleteStory] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', content: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setSelectedCategory(category);
    onCategoryChange(category);
  };

  // 关键词过滤
  const filteredStories = stories.filter((story) => {
    const matchCategory = selectedCategory ? story.category === selectedCategory : true;
    const matchSearch = search
      ? (story.title && story.title.includes(search)) || (story.content && story.content.includes(search))
      : true;
    return matchCategory && matchSearch;
  });

  // 编辑弹窗初始化
  const openEditDialog = (story) => {
    setEditStory(story);
    setEditForm({
      title: story.title || '',
      category: story.category || '',
      content: story.content || ''
    });
  };

  // 编辑表单变更
  const handleEditChange = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  // 保存编辑
  const handleEditSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/story/${editStory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: '编辑成功', severity: 'success' });
        setEditStory(null);
        onCategoryChange(selectedCategory); // 刷新
      } else {
        setSnackbar({ open: true, message: data.error || '编辑失败', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    }
  };

  // 删除故事
  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/story/${deleteStory.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: '删除成功', severity: 'success' });
        setDeleteStory(null);
        onCategoryChange(selectedCategory); // 刷新
      } else {
        setSnackbar({ open: true, message: data.error || '删除失败', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>故事分类</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="故事分类"
          >
            <MenuItem value="">全部</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="关键词搜索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>标题</TableCell>
              <TableCell>分类</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>简介</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStories.map((story) => (
              <TableRow key={story.id}>
                <TableCell>{story.title}</TableCell>
                <TableCell>
                  <Chip label={story.category} color="primary" size="small" />
                </TableCell>
                <TableCell>{new Date(story.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {story.content
                    ? story.content.length > 50
                      ? story.content.slice(0, 50) + '...'
                      : story.content
                    : '无'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => setDetailStory(story)} title="详情">
                    <InfoIcon />
                  </IconButton>
                  <IconButton onClick={() => openEditDialog(story)} title="编辑">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => setDeleteStory(story)} title="删除" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredStories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 详情弹窗 */}
      <Dialog open={!!detailStory} onClose={() => setDetailStory(null)} maxWidth="sm" fullWidth>
        <DialogTitle>故事详情</DialogTitle>
        <DialogContent>
          {detailStory && (
            <>
              <Typography variant="h6" gutterBottom>{detailStory.title}</Typography>
              <Box sx={{ mb: 1 }}>
                <Chip label={detailStory.category} color="primary" size="small" sx={{ mr: 1 }} />
                <Chip label={detailStory.source} color="secondary" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                创建时间：{new Date(detailStory.created_at).toLocaleString()}
              </Typography>
              <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
                {detailStory.content || '无内容'}
              </DialogContentText>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={!!editStory} onClose={() => setEditStory(null)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑故事</DialogTitle>
        <DialogContent>
          <TextField
            label="标题"
            value={editForm.title}
            onChange={e => handleEditChange('title', e.target.value)}
            fullWidth sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>分类</InputLabel>
            <Select
              value={editForm.category}
              onChange={e => handleEditChange('category', e.target.value)}
              label="分类"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="简介"
            value={editForm.content}
            onChange={e => handleEditChange('content', e.target.value)}
            fullWidth multiline rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStory(null)}>取消</Button>
          <Button onClick={handleEditSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteStory} onClose={() => setDeleteStory(null)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>确定要删除该故事吗？操作不可撤销。</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteStory(null)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">删除</Button>
        </DialogActions>
      </Dialog>

      {/* 全局提示 */}
      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default StoryList; 
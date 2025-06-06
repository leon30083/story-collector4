import React, { useState, useEffect } from 'react';
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
import Checkbox from '@mui/material/Checkbox';
import DownloadIcon from '@mui/icons-material/Download';
import dayjs from 'dayjs';
import Pagination from '@mui/material/Pagination';

function StoryList({ stories, categories, onCategoryChange, batches = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailStory, setDetailStory] = useState(null);
  const [editStory, setEditStory] = useState(null);
  const [deleteStory, setDeleteStory] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', content: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchCategory, setBatchCategory] = useState('');
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // 新增：初始加载时清空所有筛选项，确保显示全部数据
  useEffect(() => {
    setSelectedCategory('');
    setSelectedBatch('');
    setSearch('');
    setStartDate('');
    setEndDate('');
  }, []);

  // 修复：批次下拉框始终使用props.batches渲染，不用stories数据动态生成
  const sortedBatches = Array.from(new Set(batches)).sort((a, b) => b.localeCompare(a));

  // 切换分类时只刷新分类
  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setSelectedCategory(category);
    onCategoryChange(category, selectedBatch);
  };
  // 切换批次时只刷新批次
  const handleBatchChange = (event) => {
    const batch = event.target.value;
    setSelectedBatch(batch);
    onCategoryChange(selectedCategory, batch);
  };

  // 时间区间筛选逻辑
  const filterByDate = (story) => {
    if (!startDate && !endDate) return true;
    const created = story.created_at ? dayjs(story.created_at) : null;
    if (!created) return false;
    if (startDate && created.isBefore(dayjs(startDate))) return false;
    if (endDate && created.isAfter(dayjs(endDate).endOf('day'))) return false;
    return true;
  };

  // 关键词过滤+分类+批次+时间区间
  const filteredStories = stories.filter((story) => {
    const matchCategory = selectedCategory ? story.category === selectedCategory : true;
    const matchBatch = selectedBatch ? story.batch === selectedBatch : true;
    const matchSearch = search
      ? (story.title && story.title.includes(search)) || (story.content && story.content.includes(search))
      : true;
    return matchCategory && matchBatch && matchSearch && filterByDate(story);
  });

  // 多选逻辑
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredStories.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const isAllSelected = filteredStories.length > 0 && selectedIds.length === filteredStories.length;

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('确定要批量删除选中的故事吗？')) return;
    try {
      const res = await fetch('http://localhost:5000/api/stories/batch_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        setSelectedIds([]);
        onCategoryChange(selectedCategory, selectedBatch);
      } else {
        setSnackbar({ open: true, message: data.error || '批量删除失败', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    }
  };

  // 批量分类
  const handleBatchCategory = async () => {
    if (selectedIds.length === 0 || !batchCategory) return;
    try {
      const res = await fetch('http://localhost:5000/api/stories/batch_update_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, category: batchCategory })
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        setSelectedIds([]);
        setBatchDialogOpen(false);
        onCategoryChange(selectedCategory, selectedBatch);
      } else {
        setSnackbar({ open: true, message: data.error || '批量分类失败', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    }
  };

  // 批量导出
  const handleBatchExport = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('http://localhost:5000/api/stories/batch_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
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
        setSnackbar({ open: true, message: '批量导出失败', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    }
  };

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
        onCategoryChange(selectedCategory, selectedBatch); // 刷新
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
        onCategoryChange(selectedCategory, selectedBatch); // 刷新
      } else {
        setSnackbar({ open: true, message: data.error || '删除失败', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    }
  };

  // 新增：自动同步筛选项，避免数据流不同步
  useEffect(() => {
    // 如果当前选中的分类/批次已不存在于最新数据，则重置
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory('');
    }
    if (selectedBatch && !batches.includes(selectedBatch)) {
      setSelectedBatch('');
    }
    // 如果当前筛选后无数据，且有全量数据，自动重置筛选
    if (stories.length > 0 && filteredStories.length === 0) {
      setSelectedCategory('');
      setSelectedBatch('');
      setSearch('');
    }
    // eslint-disable-next-line
  }, [stories, batches, categories]);

  // 排序函数
  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrder('asc');
    }
  };

  // 排序后的stories（必须放在分页等变量前面）
  const sortedStories = [...filteredStories].sort((a, b) => {
    let v1 = a[orderBy];
    let v2 = b[orderBy];
    if (orderBy === 'created_at') {
      v1 = v1 ? new Date(v1).getTime() : 0;
      v2 = v2 ? new Date(v2).getTime() : 0;
    } else {
      v1 = v1 || '';
      v2 = v2 || '';
    }
    if (v1 < v2) return order === 'asc' ? -1 : 1;
    if (v1 > v2) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sortedStories.length / PAGE_SIZE);
  const pagedStories = sortedStories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 翻页时自动滚动到表格顶部
  useEffect(() => {
    const table = document.getElementById('story-table');
    if (table) table.scrollIntoView({ behavior: 'smooth' });
  }, [page]);

  // 筛选条件变化时自动回到第一页
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedBatch, search, startDate, endDate, stories]);

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
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>整理批次</InputLabel>
          <Select
            value={selectedBatch}
            onChange={handleBatchChange}
            label="整理批次"
            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
          >
            <MenuItem value="">全部</MenuItem>
            {sortedBatches.map((batch) => (
              <MenuItem key={batch} value={batch}>{batch}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="开始时间"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          sx={{ minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="结束时间"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          sx={{ minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="关键词搜索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="error" onClick={handleBatchDelete} disabled={selectedIds.length === 0}>
          批量删除
        </Button>
        <Button variant="contained" onClick={() => setBatchDialogOpen(true)} disabled={selectedIds.length === 0}>
          批量分类
        </Button>
        <Button variant="contained" onClick={handleBatchExport} disabled={selectedIds.length === 0}>
          批量导出
        </Button>
      </Box>
      <TableContainer component={Paper} id="story-table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={selectedIds.length > 0 && !isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell onClick={() => handleSort('title')} style={{cursor:'pointer'}}>
                标题{orderBy==='title' ? (order==='asc'?' ↑':' ↓') : ''}
              </TableCell>
              <TableCell onClick={() => handleSort('category')} style={{cursor:'pointer'}}>
                分类{orderBy==='category' ? (order==='asc'?' ↑':' ↓') : ''}
              </TableCell>
              <TableCell onClick={() => handleSort('batch')} style={{cursor:'pointer'}}>
                批次{orderBy==='batch' ? (order==='asc'?' ↑':' ↓') : ''}
              </TableCell>
              <TableCell onClick={() => handleSort('created_at')} style={{cursor:'pointer'}}>
                创建时间{orderBy==='created_at' ? (order==='asc'?' ↑':' ↓') : ''}
              </TableCell>
              <TableCell onClick={() => handleSort('content')} style={{cursor:'pointer'}}>
                简介{orderBy==='content' ? (order==='asc'?' ↑':' ↓') : ''}
              </TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedStories.map((story) => (
              <TableRow key={story.id} selected={selectedIds.includes(story.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(story.id)}
                    onChange={() => handleSelectOne(story.id)}
                  />
                </TableCell>
                <TableCell>{story.title}</TableCell>
                <TableCell>
                  <Chip label={story.category} color="primary" size="small" />
                </TableCell>
                <TableCell>{story.batch || '-'}</TableCell>
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
            {pagedStories.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>

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

      {/* 批量分类弹窗 */}
      <Dialog open={batchDialogOpen} onClose={() => setBatchDialogOpen(false)}>
        <DialogTitle>批量分类</DialogTitle>
        <DialogContent>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>选择分类</InputLabel>
            <Select
              value={batchCategory}
              onChange={e => setBatchCategory(e.target.value)}
              label="选择分类"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialogOpen(false)}>取消</Button>
          <Button onClick={handleBatchCategory} variant="contained">确定</Button>
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
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function CategoryManager({ onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 获取分类列表
  const fetchCategories = async () => {
    const res = await fetch('http://localhost:5000/api/categories');
    const data = await res.json();
    setCategories(data);
    if (onCategoryChange) onCategoryChange(data.map(c => c.name));
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  // 打开新增/编辑弹窗
  const handleOpen = (cat = null) => {
    setEditId(cat ? cat.id : null);
    setName(cat ? cat.name : '');
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setName('');
  };

  // 新增或编辑分类
  const handleSave = async () => {
    if (!name.trim()) {
      setSnackbar({ open: true, message: '分类名不能为空', severity: 'error' });
      return;
    }
    let res;
    if (editId) {
      res = await fetch(`http://localhost:5000/api/categories/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      });
    } else {
      res = await fetch('http://localhost:5000/api/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      });
    }
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: data.message, severity: 'success' });
      fetchCategories();
      handleClose();
    } else {
      setSnackbar({ open: true, message: data.error || '操作失败', severity: 'error' });
    }
  };

  // 删除分类
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该分类吗？')) return;
    const res = await fetch(`http://localhost:5000/api/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      setSnackbar({ open: true, message: data.message, severity: 'success' });
      fetchCategories();
    } else {
      setSnackbar({ open: true, message: data.error || '删除失败', severity: 'error' });
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">分类管理</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>新增分类</Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>分类名</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(cat)} title="编辑"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(cat.id)} title="删除" color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow><TableCell colSpan={2} align="center">暂无分类</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? '编辑分类' : '新增分类'}</DialogTitle>
        <DialogContent>
          <TextField
            label="分类名"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default CategoryManager; 
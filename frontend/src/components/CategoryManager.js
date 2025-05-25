import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// 接收 categories 和 onCategoriesUpdated prop
function CategoryManager({ categories = [], onCategoriesUpdated }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 添加新分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setSnackbar({ open: true, message: '分类名称不能为空', severity: 'warning' });
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: '分类添加成功', severity: 'success' });
        setNewCategoryName('');
        // 调用父组件传递的更新函数
        if (onCategoriesUpdated) {
            onCategoriesUpdated();
        }
      } else {
        setSnackbar({ open: true, message: data.error || '分类添加失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: '分类添加失败：' + error.message, severity: 'error' });
    }
  };

  // 打开编辑弹窗
  const openEditDialog = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
  };

  // 保存编辑
  const handleEditCategory = async () => {
    if (!editCategoryName.trim()) {
      setSnackbar({ open: true, message: '分类名称不能为空', severity: 'warning' });
      return;
    }
    if (editCategoryName.trim() === editingCategory.name) {
      setSnackbar({ open: true, message: '分类名称未改变', severity: 'info' });
      setEditingCategory(null);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCategoryName.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: '分类更新成功', severity: 'success' });
        setEditingCategory(null);
        // 调用父组件传递的更新函数
        if (onCategoriesUpdated) {
            onCategoriesUpdated();
        }
      } else {
        setSnackbar({ open: true, message: data.error || '分类更新失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: '分类更新失败：' + error.message, severity: 'error' });
    }
  };

  // 打开删除确认弹窗
  const openDeleteConfirm = (categoryId) => {
    setDeleteCategoryId(categoryId);
  };

  // 删除分类
  const handleDeleteCategory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${deleteCategoryId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: '分类删除成功', severity: 'success' });
        setDeleteCategoryId(null);
        // 调用父组件传递的更新函数
        if (onCategoriesUpdated) {
            onCategoriesUpdated();
        }
      } else {
        setSnackbar({ open: true, message: data.error || '分类删除失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: '分类删除失败：' + error.message, severity: 'error' });
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>分类管理</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="新分类名称"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleAddCategory}>添加分类</Button>
      </Box>
      <List>
        {/* 使用 Props 传递的分类列表 */}
        {categories.map((category) => (
          <ListItem
            key={category.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => openEditDialog(category)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => openDeleteConfirm(category.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText primary={category.name} />
          </ListItem>
        ))}
      </List>

      {/* 编辑分类弹窗 */}
      <Dialog open={!!editingCategory} onClose={() => setEditingCategory(null)}>
        <DialogTitle>编辑分类</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="分类名称"
            type="text"
            fullWidth
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingCategory(null)}>取消</Button>
          <Button onClick={handleEditCategory}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={!!deleteCategoryId}
        onClose={() => setDeleteCategoryId(null)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"确认删除分类?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            删除分类将无法恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCategoryId(null)}>取消</Button>
          <Button onClick={handleDeleteCategory} color="error" autoFocus>删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CategoryManager; 
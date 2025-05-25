import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function StoryUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && !selectedFile.name.endsWith('.csv')) {
      setError('请选择CSV文件');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请选择文件');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        if (typeof data.success_count !== 'undefined' && typeof data.duplicate_count !== 'undefined') {
          setSuccess(`上传成功，导入 ${data.success_count} 条，重复 ${data.duplicate_count} 条`);
        } else if (typeof data.count !== 'undefined') {
          setSuccess(`上传成功，共导入 ${data.count} 条故事`);
        } else {
          setSuccess('上传成功');
        }
        setFile(null);
        onUploadSuccess();
      } else {
        setError(data.error || '上传失败');
      }
    } catch (error) {
      setError('上传失败：' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '2px dashed #ccc',
          borderRadius: 2,
          bgcolor: '#fafafa',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          点击或拖拽文件到此处上传
        </Typography>
        <Typography variant="body2" color="text.secondary">
          支持CSV格式文件
        </Typography>
        {file && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            已选择: {file.name}
          </Typography>
        )}
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : null}
        >
          {uploading ? '上传中...' : '开始上传'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
}

export default StoryUpload; 
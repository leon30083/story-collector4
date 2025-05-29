import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

export default function StoryPageEditor({ page, onEdit }) {
  if (!page) return null;
  return (
    <Box>
      <Typography variant="h6" gutterBottom>第{page.page_no}页内容</Typography>
      <TextField
        label="中文内容"
        value={page.text_cn}
        onChange={e => onEdit('text_cn', e.target.value)}
        fullWidth
        multiline
        sx={{ mb: 2 }}
      />
      <TextField
        label="英文内容"
        value={page.text_en}
        onChange={e => onEdit('text_en', e.target.value)}
        fullWidth
        multiline
        sx={{ mb: 2 }}
      />
      <TextField
        label="配图建议"
        value={page.image_hint || ''}
        onChange={e => onEdit('image_hint', e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
    </Box>
  );
} 
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export default function EditorHistoryLog({ history }) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>操作日志</Typography>
      <List dense>
        {history.length === 0 && <ListItem><ListItemText primary="暂无操作" /></ListItem>}
        {history.map((item, idx) => (
          <ListItem key={idx}>
            <ListItemText
              primary={
                item.type === 'edit'
                  ? `编辑第${item.page + 1}页 ${item.field}：${item.value}`
                  : item.type === 'apply_style'
                  ? `第${item.page + 1}页应用风格：${item.styleId}`
                  : JSON.stringify(item)
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 
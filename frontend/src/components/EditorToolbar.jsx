import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';

export default function EditorToolbar({ onBack, onExportMarkdown, onImportMarkdown, onBatchSplit }) {
  return (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
      <ButtonGroup>
        <Button variant="outlined" onClick={onBack}>返回故事库</Button>
        <Button variant="contained">保存</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outlined" onClick={onExportMarkdown}>导出markdown</Button>
        <Button variant="outlined" onClick={onImportMarkdown}>导入markdown</Button>
        <Button variant="outlined" onClick={onBatchSplit}>批量分段</Button>
      </ButtonGroup>
    </Box>
  );
} 
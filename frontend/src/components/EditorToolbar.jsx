import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';

export default function EditorToolbar({ onExportMarkdown, onImportMarkdown, onBatchSplit }) {
  return (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <ButtonGroup>
        <Button variant="outlined" onClick={onExportMarkdown}>导出markdown</Button>
        <Button variant="outlined" onClick={onImportMarkdown}>导入markdown</Button>
        <Button variant="outlined" onClick={onBatchSplit}>批量分段</Button>
      </ButtonGroup>
    </Box>
  );
} 
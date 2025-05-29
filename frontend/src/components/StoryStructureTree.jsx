import React from 'react';
import { List, ListItem, ListItemButton, ListItemText, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function StoryStructureTree({ pages, currentPage, onSelectPage, onInsertPage, onDeletePage }) {
  return (
    <List>
      {pages.map((page, idx) => (
        <ListItem key={page.page_no} disablePadding secondaryAction={
          <>
            <IconButton size="small" onClick={() => onInsertPage(idx + 1)}><AddIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => onDeletePage(idx)}><DeleteIcon fontSize="small" /></IconButton>
          </>
        }>
          <ListItemButton selected={currentPage === idx} onClick={() => onSelectPage(idx)}>
            <ListItemText primary={`第${page.page_no}页`} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
} 
import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';

const mockStyles = [
  { id: 1, name: '温馨童话', desc: '适合低幼儿童，语言温暖，画面柔和。' },
  { id: 2, name: '冒险成长', desc: '强调成长与挑战，情节紧凑。' },
];

export default function StyleRecommendation({ currentStyleId, onApplyStyle }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>风格推荐</Typography>
      {mockStyles.map(style => (
        <Card key={style.id} sx={{ mb: 2, border: currentStyleId === style.id ? '2px solid #1976d2' : '1px solid #eee' }}>
          <CardContent>
            <Typography variant="subtitle1">{style.name}</Typography>
            <Typography variant="body2" color="text.secondary">{style.desc}</Typography>
            <Button
              size="small"
              variant={currentStyleId === style.id ? 'contained' : 'outlined'}
              sx={{ mt: 1 }}
              onClick={() => onApplyStyle(style.id)}
            >
              {currentStyleId === style.id ? '已应用' : '应用'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
} 
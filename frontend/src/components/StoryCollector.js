import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';

function StoryCollector({ onStoryGenerated = () => {}, categories = [] }) {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [log, setLog] = useState([]);
  const [logOpen, setLogOpen] = useState(false);
  const [count, setCount] = useState(1);

  // 从 localStorage 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      setSelectedModel(parsedSettings.selectedModel || '');
    }
  }, [selectedModel, settings]);

  const appendLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleCollect = async () => {
    if (!prompt) {
      setError('请输入故事主题或提示词');
      return;
    }

    if (!category) {
      setError('请选择故事分类');
      return;
    }

    if (!settings || !selectedModel) {
      setError('请先在设置中配置API和模型');
      return;
    }

    setCollecting(true);
    setError('');
    setSuccess('');
    setLog([]);
    appendLog('正在发送采集请求...');

    try {
      const response = await fetch('http://localhost:5000/api/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: `收集${category}，${prompt}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          top_p: settings.topP,
          category: category,
          count: count
        }),
      });
      appendLog('请求已发送，等待响应...');
      const data = await response.json();
      appendLog('收到响应：' + JSON.stringify(data));

      if (response.ok) {
        if (Array.isArray(data.stories)) {
          setSuccess(`收集成功，已保存${data.saved?.length || 0}条，重复${data.duplicate?.length || 0}条`);
          appendLog('保存的故事：' + (data.saved || []).join('，'));
          appendLog('重复的故事：' + (data.duplicate || []).join('，'));
          onStoryGenerated(data.stories);
        } else if (data.message && data.message.includes('有效收集数量不足')) {
          setError('有效收集数量不足，建议更换提示词或缩小范围。');
          setSuccess('');
          appendLog(data.message);
        } else if (data.duplicate) {
          setError('故事已存在，未保存');
          setSuccess('');
          onStoryGenerated();
        } else {
          setSuccess('故事收集成功！');
          setPrompt('');
          setError('');
          onStoryGenerated();
        }
      } else {
        setError(data.error || '故事收集失败');
      }
    } catch (error) {
      setError('故事收集失败：' + error.message);
      appendLog('采集失败：' + error.message);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          故事采集
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>故事分类</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="故事分类"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="采集数量"
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              inputProps={{ min: 1, max: 20 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="故事主题或提示词"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入故事主题或提示词，例如：'写一个关于友谊的成语故事'"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="成语故事"
                onClick={() => setPrompt(prev => prev + ' 成语故事')}
                variant="outlined"
              />
              <Chip
                label="童话故事"
                onClick={() => setPrompt(prev => prev + ' 童话故事')}
                variant="outlined"
              />
              <Chip
                label="神话故事"
                onClick={() => setPrompt(prev => prev + ' 神话故事')}
                variant="outlined"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleCollect}
              disabled={collecting || !settings || !selectedModel}
              startIcon={collecting ? <CircularProgress size={20} /> : null}
              fullWidth
            >
              {collecting ? '收集中...' : '收集故事'}
            </Button>
          </Grid>
        </Grid>

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

        {!settings && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            请先在设置中配置API和模型
          </Alert>
        )}

        {/* 日志区域 */}
        <Box sx={{ mt: 2 }}>
          <Button size="small" onClick={() => setLogOpen(v => !v)}>
            {logOpen ? '收起日志' : '展开日志'}
          </Button>
          {logOpen && (
            <Box sx={{ mt: 1, bgcolor: '#f5f5f5', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
              {log.length === 0 ? <Typography variant="body2">暂无日志</Typography> : log.map((item, idx) => (
                <Typography key={idx} variant="body2">{item}</Typography>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default StoryCollector; 
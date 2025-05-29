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
  const [batchSize, setBatchSize] = useState(20);
  const [progress, setProgress] = useState({current: 0, total: 0, logs: []});

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

  // 采集故事
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
    setProgress({current: 0, total: 0, logs: []});
    appendLog('正在分批采集...');
    let total = Math.max(1, Math.min(100, Number(count) || 1));
    let batch = Math.max(1, Math.min(50, Number(batchSize) || 20));
    let collected = [];
    let duplicate = [];
    let progressLogs = [];
    let attempt = 0;
    try {
      const doBatch = async (need, attemptIndex) => {
        setProgress(p => ({...p, current: attemptIndex + 1, total: Math.ceil(total / batch), logs: [...progressLogs, `第${attemptIndex + 1}批，目标${need}条...`]}));
        appendLog(`第${attemptIndex + 1}批采集，目标${need}条...`);
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
            count: need,
            batch_size: need
          }),
        });
        appendLog('请求已发送，等待响应...');
        const data = await response.json();
        appendLog('收到响应：' + JSON.stringify(data));
        if (response.ok) {
          if (Array.isArray(data.stories)) {
            // 合并去重
            let newStories = data.stories.filter(s => !collected.some(c => c.title === s.title));
            collected = [...collected, ...newStories];
            duplicate = [...duplicate, ...(data.duplicate || [])];
            progressLogs.push(`第${attemptIndex + 1}批：采集${newStories.length}条，重复${(data.duplicate || []).length}条`);
            setProgress(p => ({...p, current: attemptIndex + 1, total: Math.ceil(total / batch), logs: [...progressLogs]}));
            if (newStories.length === 0) return; // AI返回空数组，提前结束
          } else if (data.message && data.message.includes('有效收集数量不足')) {
            setError('有效收集数量不足，建议更换提示词或缩小范围。');
            setSuccess('');
            appendLog(data.message);
            return;
          } else if (data.duplicate) {
            setError('故事已存在，未保存');
            setSuccess('');
            onStoryGenerated();
            return;
          } else {
            setSuccess('故事收集成功！');
            setPrompt('');
            setError('');
            onStoryGenerated();
            return;
          }
        } else {
          setError(data.error || '故事收集失败');
          return;
        }
      };
      while (collected.length < total && attempt < 10) {
        let need = Math.min(batch, total - collected.length);
        await doBatch(need, attempt);
        attempt++;
      }
      setSuccess(`收集完成，已保存${collected.length}条，重复${duplicate.length}条`);
      appendLog('采集完成。');
      onStoryGenerated(collected);
    } catch (e) {
      setError('采集失败：' + e.message);
      appendLog('采集失败：' + e.message);
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
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="采集数量"
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="每批数量"
              value={batchSize}
              onChange={e => setBatchSize(Math.max(1, Math.min(50, Number(e.target.value) || 20)))}
              inputProps={{ min: 1, max: 50 }}
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
              {collecting ? `分批收集中...（第${progress.current}/${progress.total}批）` : '收集故事'}
            </Button>
          </Grid>
        </Grid>
        {progress.logs && progress.logs.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              {progress.logs.map((l, i) => <div key={i}>{l}</div>)}
            </Alert>
          </Box>
        )}
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
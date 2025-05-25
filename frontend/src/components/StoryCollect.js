import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  TextField,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';

function StoryCollect({ onCollectSuccess }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [modelGroups, setModelGroups] = useState([]);
  const [modelFilter, setModelFilter] = useState('');
  const [messages, setMessages] = useState('请生成一个关于友谊的童话故事');
  const [maxTokens, setMaxTokens] = useState(512);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [log, setLog] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState('');

  // 日志追加
  const appendLog = (msg) => setLog((prev) => [...prev, msg]);

  // 获取模型列表
  const fetchModels = async () => {
    setModelLoading(true);
    setModelError('');
    try {
      const response = await fetch('http://localhost:5000/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      });
      const data = await response.json();
      if (response.ok && data.data) {
        // 按type分组
        const groups = {};
        data.data.forEach(m => {
          const type = m.id.split('/')[0];
          if (!groups[type]) groups[type] = [];
          groups[type].push(m.id);
        });
        const groupArr = Object.keys(groups).map(type => ({ type, models: groups[type] }));
        setModelGroups(groupArr);
        setModel(groupArr[0]?.models[0] || '');
      } else {
        setModelGroups([]);
        setModel('');
        setModelError(data.error || '未获取到模型列表');
      }
    } catch (e) {
      setModelGroups([]);
      setModel('');
      setModelError('获取模型失败：' + e.message);
    } finally {
      setModelLoading(false);
    }
  };

  // API Key变化时自动获取模型
  useEffect(() => {
    if (apiKey) fetchModels();
    // eslint-disable-next-line
  }, [apiKey]);

  // 筛选模型分组
  const getFilteredModelGroups = () => {
    if (!modelFilter.trim()) return modelGroups;
    const keyword = modelFilter.trim().toLowerCase();
    return modelGroups
      .map(group => ({
        type: group.type,
        models: group.models.filter(m => m.toLowerCase().includes(keyword))
      }))
      .filter(group => group.models.length > 0);
  };

  // 测试连接
  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult('');
    setLog([]);
    try {
      appendLog('正在测试API连接...');
      const response = await fetch('http://localhost:5000/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          model,
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 32,
          temperature: 0.7,
          top_p: 0.7,
          test: true
        })
      });
      const data = await response.json();
      appendLog('请求已发送，等待响应...');
      if (response.ok) {
        setTestResult('连接成功！模型返回：' + (data.content || JSON.stringify(data)));
        appendLog('连接成功，模型返回内容：' + (data.content || JSON.stringify(data)));
      } else {
        setTestResult('连接失败：' + (data.error || '未知错误'));
        appendLog('连接失败：' + (data.error || '未知错误'));
      }
    } catch (e) {
      setTestResult('连接失败：' + e.message);
      appendLog('连接失败：' + e.message);
    } finally {
      setTestLoading(false);
    }
  };

  // 采集故事
  const handleCollect = async () => {
    if (!apiKey || !model || !messages) {
      setError('API Key、模型名称和对话内容不能为空');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setLog([]);
    try {
      appendLog('正在发送采集请求...');
      const reqBody = {
        api_key: apiKey,
        model,
        messages: [{ role: 'user', content: messages }],
        max_tokens: Number(maxTokens),
        temperature: Number(temperature),
        top_p: Number(topP)
      };
      appendLog('请求参数：' + JSON.stringify(reqBody));
      const response = await fetch('http://localhost:5000/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      const data = await response.json();
      appendLog('收到响应：' + JSON.stringify(data));
      if (response.ok) {
        setSuccess(`采集成功，已生成故事`);
        setMessages('');
        appendLog('采集成功，模型返回内容：' + (data.content || '无内容'));
        onCollectSuccess && onCollectSuccess();
      } else {
        setError(data.error || '采集失败');
        appendLog('采集失败：' + (data.error || '未知错误'));
      }
    } catch (e) {
      setError('采集失败：' + e.message);
      appendLog('采集失败：' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', my: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>采集/生成故事</Typography>
        <TextField
          label="API Key"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          fullWidth
          margin="normal"
        />
        {/* 关键字筛选输入框 */}
        <TextField
          label="模型关键字筛选"
          value={modelFilter}
          onChange={e => setModelFilter(e.target.value)}
          fullWidth
          margin="dense"
          placeholder="输入关键字快速查找模型"
          sx={{ mb: 1 }}
          disabled={modelGroups.length === 0}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FormControl fullWidth margin="normal" disabled={modelLoading || !modelGroups.length}>
            <InputLabel>模型名称</InputLabel>
            <Select
              value={model}
              onChange={e => setModel(e.target.value)}
              label="模型名称"
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
            >
              {getFilteredModelGroups().length === 0 ? <MenuItem value="">无匹配模型</MenuItem> :
                getFilteredModelGroups().map(group => [
                  <ListSubheader key={group.type}>{group.type}</ListSubheader>,
                  ...group.models.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))
                ])
              }
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="primary"
            sx={{ ml: 2, mt: 2, height: 40 }}
            onClick={fetchModels}
            disabled={modelLoading || !apiKey}
          >
            {modelLoading ? <CircularProgress size={20} /> : '获取模型'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            sx={{ ml: 2, mt: 2, height: 40 }}
            onClick={handleTestConnection}
            disabled={testLoading || !apiKey || !model}
          >
            {testLoading ? <CircularProgress size={20} /> : '测试连接'}
          </Button>
        </Box>
        {modelError && <Alert severity="error" sx={{ mb: 2 }}>{modelError}</Alert>}
        {testResult && <Alert severity={testResult.startsWith('连接成功') ? 'success' : 'error'} sx={{ mb: 2 }}>{testResult}</Alert>}
        <TextField
          label="对话内容（messages）"
          value={messages}
          onChange={e => setMessages(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
          placeholder="请生成一个关于友谊的童话故事"
        />
        <TextField
          label="max_tokens"
          type="number"
          value={maxTokens}
          onChange={e => setMaxTokens(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="temperature"
          type="number"
          value={temperature}
          onChange={e => setTemperature(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="top_p"
          type="number"
          value={topP}
          onChange={e => setTopP(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleCollect}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? '采集中...' : '开始采集'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {/* 调用日志区域 */}
        <Box sx={{ mt: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
          <Typography variant="subtitle2" color="text.secondary">调用日志：</Typography>
          {log.length === 0 ? <Typography variant="body2">暂无日志</Typography> : log.map((item, idx) => (
            <Typography key={idx} variant="body2">{item}</Typography>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

export default StoryCollect; 
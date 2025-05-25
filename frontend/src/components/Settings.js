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
  Slider,
  Divider
} from '@mui/material';

function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 512,
    topP: 0.7
  });

  // 从 localStorage 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setSelectedModel(parsed.selectedModel || '');
      setApiKey(parsed.apiKey || '');
    }
  }, []);

  // 获取模型列表
  const fetchModels = async () => {
    if (!apiKey) {
      setError('请先设置API密钥');
      return;
    }

    setLoadingModels(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await response.json();

      if (response.ok) {
        setModels(data.data || []);
      } else {
        setError(data.error || '获取模型列表失败');
      }
    } catch (error) {
      setError('获取模型列表失败：' + error.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey) {
      setError('请输入API密钥');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('设置已更新');
        // 保存设置到 localStorage（包含apiKey）
        localStorage.setItem('aiSettings', JSON.stringify({
          ...settings,
          selectedModel,
          apiKey
        }));
        // 获取模型列表
        await fetchModels();
      } else {
        setError(data.error || '设置更新失败');
      }
    } catch (error) {
      setError('设置更新失败：' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          系统设置
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="硅基流动API密钥"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
              fullWidth
            >
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>选择模型</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={loadingModels || models.length === 0}
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              温度 (Temperature): {settings.temperature}
            </Typography>
            <Slider
              value={settings.temperature}
              onChange={(_, value) => handleSettingsChange('temperature', value)}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              最大令牌数 (Max Tokens): {settings.maxTokens}
            </Typography>
            <Slider
              value={settings.maxTokens}
              onChange={(_, value) => handleSettingsChange('maxTokens', value)}
              min={100}
              max={2000}
              step={100}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              Top P: {settings.topP}
            </Typography>
            <Slider
              value={settings.topP}
              onChange={(_, value) => handleSettingsChange('topP', value)}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
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
      </Paper>
    </Box>
  );
}

export default Settings; 
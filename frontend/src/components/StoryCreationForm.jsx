import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import { saveStory } from '../utils/localStory';

const mockStylesData = [
  { id: '1', name: '沉静幻想型', age: '5-9岁', theme: ['夜间冒险', '记忆', '时空穿越'], template: ['那天夜里，{theme}在森林中醒来。', '他静静地走着，周围只有风的声音。'] },
  { id: '2', name: '哲思叙述型', age: '6-10岁', theme: ['生命教育', '地球', '成长感悟'], template: ['你正在看着{theme}。这就是我们生活的地方。', '有时候，{theme}很小，但它很重要。'] },
  { id: '3', name: '场景引导型', age: '5-8岁', theme: ['探险旅行', '认知世界'], template: ['你来到{theme}。这里有奇妙的事物。', '再往前，是一个神秘的地方。'] },
  { id: '4', name: '幽默夸张型', age: '3-7岁', theme: ['情绪发泄', '规则冲突'], template: ['等等——你说我不能这样做？不公平！', '我要大声喊三次，你就会答应的！'] },
  { id: '5', name: '情感共鸣型', age: '4-8岁', theme: ['家庭', '思念', '离别'], template: ['当你不在我身边时，我会想起那条线。', '我们用心，就能感觉彼此。'] },
  { id: '6', name: '低龄节奏型', age: '2-4岁', theme: ['认知启蒙', '颜色', '动物'], template: ['{theme}，{theme}，你看见什么？', '我看见{theme}，在看着我。'] },
  { id: '7', name: '寓言结构型', age: '5-9岁', theme: ['品格教育', '聪明与善良'], template: ['从前有只{theme}，它很聪明。', '最后，它明白了一个道理：善良最重要。'] },
  { id: '8', name: '问题驱动型', age: '6-10岁', theme: ['自我成长', '情绪应对'], template: ['这个问题一直跟着我，像影子一样。', '我开始想，它到底想告诉我什么？'] },
  { id: '9', name: '科学启蒙型', age: '4-8岁', theme: ['自然知识', '原理机制'], template: ['你知道吗？{theme}是因为科学原理。', '看！这就是{theme}工作的方式。'] },
  { id: '10', name: '多角色互动型', age: '5-9岁', theme: ['团队关系', '表达自我'], template: ['亲爱的{theme}：我不开心。', '我是{theme}，你总是忘了我。'] },
];

export default function StoryCreationForm({ onConfirm, onCancel }) {
  const [styles, setStyles] = useState([]); // 动态风格数据
  const [theme, setTheme] = useState('');
  const [style, setStyle] = useState('');
  const [age, setAge] = useState('');
  const [lang, setLang] = useState('zh');
  const [words, setWords] = useState(600);
  const [themeExamples, setThemeExamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 动态加载风格数据，失败时用mock兜底
  useEffect(() => {
    fetch('/text/ai_picturebook_styles.json')
      .then(res => res.json())
      .then(data => {
        const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        setStyles(arr);
      })
      .catch(() => {
        setStyles(mockStylesData);
      });
  }, []);

  // 风格-年龄-主题联动
  useEffect(() => {
    if (!style) {
      setAge('');
      setThemeExamples([]);
      return;
    }
    const s = styles.find(s => s.id === style);
    if (s) {
      setAge(s.age || '');
      setThemeExamples(s.theme || []);
    }
  }, [style, styles]);

  // 年龄下拉：所有风格的年龄去重合并
  const allAges = Array.from(new Set(styles.map(s => s.age).filter(Boolean)));
  const ageOptions = allAges.map(a => ({ value: a, label: a }));

  const langOptions = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: '英文' },
  ];
  const wordCountOptions = [
    { value: 300, label: '300字' },
    { value: 600, label: '600字' },
    { value: 1000, label: '1000字' },
  ];

  // AI一键生成
  const handleAIGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          style_id: style,
          age,
          lang,
          words,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.pages && data.pages.length > 0) {
          onConfirm && onConfirm(data);
          setLoading(false);
          return;
        }
      }
      throw new Error('AI生成内容为空');
    } catch (e) {
      // mock降级：用风格模板和主题生成结构化pages
      const s = styles.find(s => s.id === style) || mockStylesData[0];
      const templates = s.template || ['AI生成的第一页内容', 'AI生成的第二页内容'];
      const story = {
        title: theme || 'AI生成故事',
        style_id: style,
        age,
        lang,
        words,
        pages: templates.map((tpl, idx) => ({
          page_no: idx + 1,
          text_cn: tpl.replace(/\{theme\}/g, theme || '主角'),
          text_en: 'AI generated page ' + (idx + 1),
          image_hint: '',
          style_id: style,
        })),
      };
      setError('AI生成失败，已用mock内容填充');
      onConfirm && onConfirm(story);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const story = {
      theme,
      style: style,
      age,
      lang,
      words,
      pages: [],
    };
    const id = saveStory(story);
    if (onConfirm) onConfirm({ ...story, id });
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 6 }}>
      <Typography variant="h5" align="center" gutterBottom>新建绘本故事</Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        请输入简短主题，或从内容库导入主题。主题示例：
      </Typography>
      {themeExamples.length > 0 ? (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          {themeExamples.map((ex, i) => (
            <Chip
              key={i}
              label={ex}
              size="small"
              sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
              onClick={() => setTheme(ex)}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          友谊拼图大冒险、海洋垃圾大作战、刷牙小卫士
        </Typography>
      )}
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleConfirm}>
        <TextField
          label="故事主题"
          value={theme}
          onChange={e => setTheme(e.target.value)}
          fullWidth
          required
          inputProps={{ maxLength: 50 }}
          sx={{ mb: 3 }}
        />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              select
              label="文稿风格"
              value={style}
              onChange={e => setStyle(e.target.value)}
              fullWidth
            >
              <MenuItem value="">不限</MenuItem>
              {styles.map(opt => (
                <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="年龄段"
              value={age}
              onChange={e => setAge(e.target.value)}
              fullWidth
            >
              <MenuItem value="">不限</MenuItem>
              {ageOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="语言"
              value={lang}
              onChange={e => setLang(e.target.value)}
              fullWidth
            >
              {langOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="字数"
              value={words}
              onChange={e => setWords(Number(e.target.value))}
              fullWidth
            >
              {wordCountOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel} disabled={loading}>取消</Button>
          <Button variant="outlined" color="secondary" onClick={handleAIGenerate} disabled={loading} startIcon={loading && <CircularProgress size={18} />}>AI一键生成</Button>
          <Button type="submit" variant="contained" disabled={loading} onClick={handleConfirm}>确认</Button>
        </Box>
      </form>
    </Paper>
  );
} 
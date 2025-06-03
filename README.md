# 故事整理系统 - Windows本地快速部署

## 环境要求
- Python 3.8+
- Node.js 16+（含npm）

## 一键启动
1. 双击 `start_all.bat`
2. 前端访问：http://localhost:3000
3. 后端API：http://localhost:5000

## 手动启动（可选）
### 后端
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
### 前端
```
cd frontend
npm install
npm start
```

## 常见问题
- **端口被占用**：修改`app.py`或`package.json`中的端口配置。
- **数据库丢失**：删除`stories.db`后重启后端会自动新建。
- **依赖安装慢**：可用国内镜像源（如`pip install -i https://pypi.tuna.tsinghua.edu.cn/simple`）。

## 进阶（可选）
- 前端打包：`npm run build`，可用Nginx等托管静态文件。
- 后端用`pyinstaller`打包为exe（适合无Python环境用户）。
- 也可用Docker一键部署（如有需求可再详细指导）。

# 儿童绘本故事收集系统

这是一个用于收集和整理儿童绘本故事题材的Web应用程序。

## 主要功能

1. 故事分类管理
   - 成语故事
   - 童话故事
   - 神话故事

2. 数据导入功能
   - 支持CSV文件上传
   - 自动查重和过滤

3. 故事收集功能
   - **基于用户设定的数量和指定分类进行智能收集**
   - 通过硅基流动API进行内容生成
   - **后端动态构建Prompt，结合数据库已有故事进行去重，确保收集内容的独特性**
   - 确保故事内容的真实性和经典性
   - **前端提供收集过程实时日志和进度展示**

4. 数据存储
   - 本地数据库存储
   - 支持历史记录查询
   - 数据查重功能

5. 故事批次筛选：批次下拉框支持全局批次切换，始终显示所有批次选项，切换体验优化。

## 技术栈

- 后端：Python Flask
- 前端：React
- 数据库：SQLite
- API：硅基流动API

## 安装说明

1. 安装Python依赖：
```bash
pip install -r requirements.txt
```

2. 配置环境变量：
创建.env文件并设置以下变量：
- SILICON_API_KEY：硅基流动API密钥
- DATABASE_URL：数据库连接URL

3. 运行应用：
```bash
python app.py
``` 
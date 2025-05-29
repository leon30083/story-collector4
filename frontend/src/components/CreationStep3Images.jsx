import React, { useState } from 'react';
import axios from 'axios';

const CreationStep3Images = ({ project, onPrev, onOpenApiSettings }) => {
  const [tasks, setTasks] = useState([
    { id: 1, status: 'processing', progress: 60, result_url: null },
    { id: 2, status: 'done', progress: 100, result_url: '/mock/img2.png' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleBatchGenerate = async () => {
    setLoading(true);
    await axios.post('/api/image/doubao/batch', { prompts: project?.pages?.map(p => p.image_hint) || [] });
    const res = await axios.get('/api/image/tasks');
    setTasks(res.data);
    setLoading(false);
  };

  const handleRetry = async (id) => {
    await axios.post(`/api/image/tasks/${id}/retry`);
    const res = await axios.get('/api/image/tasks');
    setTasks(res.data);
  };

  const handleDownload = async (id) => {
    const res = await axios.get(`/api/image/tasks/${id}/download`);
    window.open(res.data.file_url, '_blank');
  };

  const handleLog = async (id) => {
    const res = await axios.get(`/api/image/tasks/${id}/log`);
    alert(res.data.log);
  };

  const handleExport = async () => {
    const res = await axios.post('/api/export/', { project_id: project.id, type: 'PDF', range: 'all' });
    window.open(res.data.file_url, '_blank');
  };

  return (
    <section className="bg-white rounded p-6 shadow mt-6 flex flex-col">
      <div className="flex justify-end mb-4 space-x-2">
        <button className="px-4 py-1 bg-blue-600 text-white rounded">配置 ComfyUI 工作流</button>
        <button className="px-4 py-1 bg-gray-200 text-gray-700 rounded" onClick={onOpenApiSettings}>API设置</button>
      </div>
      <div className="flex">
        <aside className="w-1/4 space-y-4">
          <div className="border rounded h-32 flex items-center justify-center text-gray-400">上传图片</div>
          <input type="file" accept="image/*" className="w-full" />
        </aside>
        <div className="flex-1 mx-4">
          <div className="h-96 bg-gray-200 flex items-center justify-center text-gray-500">ComfyUI 节点编辑器</div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">批量图像生成任务</h3>
        <div className="space-y-4">
          {tasks.map(t => (
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded" key={t.id}>
              <img src={t.result_url || 'https://placehold.co/80x60'} className="rounded" alt="img" />
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded mb-1">
                  <div className="h-2 bg-green-400 rounded" style={{ width: `${t.progress}%` }}></div>
                </div>
                <div className="text-xs text-gray-500">状态：{t.status}</div>
              </div>
              <button className="bg-gray-100 px-2 py-1 rounded" onClick={() => handleRetry(t.id)}>重试</button>
              <button className="bg-blue-100 px-2 py-1 rounded" onClick={() => handleDownload(t.id)}>下载</button>
              <button className="bg-gray-100 px-2 py-1 rounded" onClick={() => handleLog(t.id)}>日志</button>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <div className="space-x-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleBatchGenerate} disabled={loading}>全部生成</button>
            <button className="bg-gray-100 px-3 py-1 rounded" onClick={() => tasks.forEach(t => handleRetry(t.id))}>全部重试</button>
            <button className="bg-gray-100 px-3 py-1 rounded" onClick={() => tasks.forEach(t => handleDownload(t.id))}>全部下载</button>
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleExport}>资产导出</button>
        </div>
      </div>
    </section>
  );
};

export default CreationStep3Images; 
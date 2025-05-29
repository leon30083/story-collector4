import React, { useState } from 'react';
import axios from 'axios';

const ExportModal = ({ visible, onClose, projectId }) => {
  const [type, setType] = useState('PDF');
  const [range, setRange] = useState('全部内容');
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const res = await axios.post('/api/export/', { project_id: projectId, type, range });
    let percent = 0;
    const timer = setInterval(async () => {
      const prog = await axios.get(`/api/export/${res.data.export_id}/progress`);
      setProgress(prog.data.progress);
      if (prog.data.progress >= 100) {
        clearInterval(timer);
        setExporting(false);
        const file = await axios.get(`/api/export/${res.data.export_id}/download`);
        window.open(file.data.file_url, '_blank');
        onClose();
      }
    }, 500);
  };

  if (!visible) return null;
  return (
    <section className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-1/3 p-8 rounded shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">资产导出</h2>
        <button className="absolute top-4 right-6 text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        <div className="mb-4">
          <label className="block mb-1">导出类型</label>
          <select className="w-full border rounded p-2" value={type} onChange={e => setType(e.target.value)}>
            <option>PDF</option>
            <option>EPUB</option>
            <option>ZIP</option>
            <option>PPTX</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">导出范围</label>
          <select className="w-full border rounded p-2" value={range} onChange={e => setRange(e.target.value)}>
            <option>全部内容</option>
            <option>仅脚本与提示词</option>
            <option>仅图片</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">导出进度</label>
          <div className="w-full h-2 bg-gray-200 rounded">
            <div className="h-2 bg-green-400 rounded" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">{progress}%</div>
        </div>
        <div className="flex justify-end space-x-2">
          <button className="px-4 py-1 bg-gray-200 rounded" onClick={onClose}>取消</button>
          <button className="px-4 py-1 bg-blue-500 text-white rounded" onClick={handleExport} disabled={exporting}>导出</button>
        </div>
      </div>
    </section>
  );
};

export default ExportModal; 
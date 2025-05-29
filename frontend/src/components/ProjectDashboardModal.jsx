import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProjectDashboardModal = ({ visible, onClose, onEnter }) => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (visible) fetchProjects();
  }, [visible]);

  const fetchProjects = async () => {
    const res = await axios.get('/api/projects/');
    setProjects(res.data);
  };

  const handleNew = async () => {
    if (!newTitle) return;
    await axios.post('/api/projects/', { title: newTitle });
    setNewTitle('');
    fetchProjects();
  };

  const handleRename = async (id) => {
    const title = prompt('新项目名');
    if (title) {
      await axios.patch(`/api/projects/${id}`, { title });
      fetchProjects();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该项目？')) {
      await axios.delete(`/api/projects/${id}`);
      fetchProjects();
    }
  };

  const filtered = projects.filter(p => !search || p.title.includes(search));

  if (!visible) return null;
  return (
    <section className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-3/4 max-w-4xl p-8 rounded shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">项目仪表盘</h2>
        <button className="absolute top-4 right-6 text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        <div className="flex justify-between mb-4">
          <div>
            <input className="border rounded px-2 py-1 mr-2" placeholder="新建项目名..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={handleNew}>+ 新建项目</button>
          </div>
          <input className="border rounded px-2 py-1" placeholder="搜索项目..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div className="bg-gray-50 rounded shadow p-4 flex flex-col" key={p.id}>
              <div className="font-semibold text-lg">{p.title}</div>
              <div className="text-sm text-gray-500">场景数：{p.scene_count}</div>
              <div className="text-xs text-gray-400">最后编辑：{p.last_edit?.slice(0,10)}</div>
              <div className="mt-2 h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-400 rounded" style={{ width: `${Math.round((p.progress||0)*100)}%` }}></div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button className="text-blue-500" onClick={() => onEnter(p)}>进入</button>
                <button className="text-gray-400" onClick={() => handleRename(p.id)}>重命名</button>
                <button className="text-red-400" onClick={() => handleDelete(p.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center text-gray-400 mt-8">暂无项目，点击新建</div>}
      </div>
    </section>
  );
};

export default ProjectDashboardModal; 
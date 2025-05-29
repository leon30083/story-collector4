import React, { useState } from 'react';
import CreationStep0BasicInfo from './CreationStep0BasicInfo';
import CreationStep1Script from './CreationStep1Script';
import CreationStep2Prompts from './CreationStep2Prompts';
import CreationStep3Images from './CreationStep3Images';
import ProjectDashboardModal from './ProjectDashboardModal';
import PromptManagerModal from './PromptManagerModal';
import ExportModal from './ExportModal';
import APISettingsModal from './APISettingsModal';

const steps = [
  { label: '0 用户输入基本信息', component: CreationStep0BasicInfo },
  { label: '1 故事文案创作', component: CreationStep1Script },
  { label: '2 分镜提示词生成', component: CreationStep2Prompts },
  { label: '3 绘本画面局部修改', component: CreationStep3Images },
];

export default function MainFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [promptMngOpen, setPromptMngOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [project, setProject] = useState({});

  const StepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(90deg, #E0F7FA 50%, #FCE4EC 50%)' }}>
      {/* 顶部导航 */}
      <header className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center space-x-4">
          <button onClick={() => setDashboardOpen(true)} className="text-gray-600 hover:text-gray-800">📁 项目仪表盘</button>
          <nav className="flex items-center text-sm space-x-2 ml-4">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <span
                  className={`cursor-pointer ${i === currentStep ? 'text-blue-500' : 'text-gray-400'}`}
                  onClick={() => setCurrentStep(i)}
                >{s.label}</span>
                {i < steps.length - 1 && <span>→</span>}
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-3 py-1 bg-indigo-500 text-white rounded" onClick={() => setPromptMngOpen(true)}>提示词管理</button>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setApiSettingsOpen(true)}>API设置</button>
          <button className="px-4 py-1 bg-yellow-400 text-white rounded">开通会员</button>
          <span>积分：196</span>
        </div>
      </header>

      {/* 主流程内容 */}
      <main className="flex-1 overflow-auto p-6">
        <StepComponent
          project={project}
          onChange={setProject}
          onNext={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
          onPrev={() => setCurrentStep(Math.max(currentStep - 1, 0))}
          onOpenApiSettings={() => setApiSettingsOpen(true)}
        />
      </main>

      {/* 底部按钮 */}
      <footer className="p-4 bg-white shadow text-center">
        {currentStep > 0 && (
          <button className="px-6 py-2 bg-gray-200 rounded mr-4" onClick={() => setCurrentStep(currentStep - 1)}>返回</button>
        )}
        <button
          className="px-6 py-2 bg-pink-500 text-white rounded"
          onClick={() => {
            if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
            else alert('创作流程完成！');
          }}
        >{currentStep < steps.length - 1 ? '下一步 →' : '完成'}</button>
      </footer>

      {/* 弹窗区 */}
      <ProjectDashboardModal visible={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <PromptManagerModal visible={promptMngOpen} onClose={() => setPromptMngOpen(false)} />
      <ExportModal visible={exportOpen} onClose={() => setExportOpen(false)} />
      <APISettingsModal visible={apiSettingsOpen} onClose={() => setApiSettingsOpen(false)} />
    </div>
  );
} 
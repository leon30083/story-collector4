import requests

BASE = 'http://127.0.0.1:5000/api'

def test_projects():
    r = requests.get(f'{BASE}/projects/')
    print('项目列表:', r.json())
    r = requests.post(f'{BASE}/projects/', json={"title": "测试项目"})
    pid = r.json().get('id')
    print('新建项目:', pid)
    r = requests.get(f'{BASE}/projects/{pid}')
    print('获取项目:', r.json())
    r = requests.patch(f'{BASE}/projects/{pid}', json={"title": "新名字"})
    print('重命名:', r.json())
    r = requests.delete(f'{BASE}/projects/{pid}')
    print('删除:', r.json())

def test_styles():
    r = requests.get(f'{BASE}/styles/')
    print('风格列表:', r.json())
    if r.json():
        sid = r.json()[0]['id']
        r2 = requests.get(f'{BASE}/styles/{sid}')
        print('风格详情:', r2.json())

def test_script():
    r = requests.post(f'{BASE}/script/generate', json={"theme": "测试", "age_range": "3-5岁", "style_id": 1})
    print('AI生成脚本:', r.json())

def test_prompt():
    r = requests.post(f'{BASE}/prompt/generate', json={"script": "测试脚本", "style_id": 1})
    print('AI生成分镜:', r.json())

def test_image():
    r = requests.post(f'{BASE}/image/doubao/batch', json={"prompts": ["a", "b"]})
    print('批量生成图片:', r.json())
    r = requests.get(f'{BASE}/image/tasks')
    print('图片任务:', r.json())
    r = requests.post(f'{BASE}/image/tasks/1/retry')
    print('重试图片:', r.json())
    r = requests.get(f'{BASE}/image/tasks/1/download')
    print('下载图片:', r.json())
    r = requests.get(f'{BASE}/image/tasks/1/log')
    print('图片日志:', r.json())

def test_export():
    r = requests.post(f'{BASE}/export/', json={"project_id": 1, "type": "PDF", "range": "all"})
    print('发起导出:', r.json())
    r = requests.get(f'{BASE}/export/1/progress')
    print('导出进度:', r.json())
    r = requests.get(f'{BASE}/export/1/download')
    print('导出下载:', r.json())

def test_settings():
    r = requests.post(f'{BASE}/settings/', json={"siliconflow_key": "test", "model": "sf-chat-2.0"})
    print('保存设置:', r.json())
    r = requests.get(f'{BASE}/settings/')
    print('获取设置:', r.json())
    r = requests.post(f'{BASE}/settings/test')
    print('测试连通性:', r.json())

if __name__ == '__main__':
    test_projects()
    test_styles()
    test_script()
    test_prompt()
    test_image()
    test_export()
    test_settings() 
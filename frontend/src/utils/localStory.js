// 本地故事存储工具
export function saveStory(story) {
  let id = story.id;
  if (!id) {
    id = 's_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    story.id = id;
  }
  localStorage.setItem('story_' + id, JSON.stringify(story));
  return id;
}

export function loadStory(id) {
  const data = localStorage.getItem('story_' + id);
  return data ? JSON.parse(data) : null;
}

export function listStories() {
  const stories = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('story_')) {
      const story = JSON.parse(localStorage.getItem(key));
      stories.push(story);
    }
  }
  return stories;
}

export function removeStory(id) {
  localStorage.removeItem('story_' + id);
} 
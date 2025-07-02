import React, { useEffect, useState } from 'react';

interface NewsItem {
  date: string;
  description: string;
}

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch('/newsFeedData.json')
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch(() => setNews([]));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Latest Major Updates</h2>
      <ul className="space-y-4">
        {news.map((item: NewsItem, idx: number) => (
          <li key={idx} className="bg-white dark:bg-[#23408e] rounded-lg shadow p-4 border border-gray-200 dark:border-[#2d437a]">
            <div className="text-sm text-gray-500 dark:text-blue-100 mb-1">{new Date(item.date).toLocaleString()}</div>
            <div className="text-gray-900 dark:text-white font-medium">{item.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsFeed; 
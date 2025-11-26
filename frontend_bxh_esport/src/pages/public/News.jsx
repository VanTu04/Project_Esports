import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { apiClient } from '../../services/api';

const demoNews = [
  { id: 1, title: 'Team Flash vô địch giải mùa hè với thành tích ấn tượng', date: '20/11/2025', category: 'Tin tức', desc: 'Đội tuyển Team Flash đã xuất sắc giành chức vô địch với tỷ số 3-1 trước GAM Esports...', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop' },
  { id: 2, title: 'Lịch thi đấu tháng 12 chính thức được công bố', date: '18/11/2025', category: 'Thông báo', desc: 'Ban tổ chức vừa công bố lịch thi đấu chính thức cho tháng 12 với nhiều trận đấu hấp dẫn...', img: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=200&fit=crop' },
  { id: 3, title: 'Hướng dẫn đăng ký đội tuyển tham gia giải đấu', date: '15/11/2025', category: 'Hướng dẫn', desc: 'Bài viết chi tiết hướng dẫn các bước đăng ký đội tuyển tham gia các giải đấu trên nền tảng...', img: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=200&fit=crop' },
];
import { API_ENDPOINTS } from '../../utils/constants';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await apiClient.get(API_ENDPOINTS.NEWS); // Try backend /news
        const payload = resp?.data?.data ?? resp?.data ?? resp;
        if (mounted) {
          if (Array.isArray(payload) && payload.length > 0) setNews(payload);
          else setNews(demoNews);
        }
      } catch (err) {
        // Fallback to demo data if API not available
        if (mounted) setNews(demoNews);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tin tức</h1>
        {loading ? (
          <div className="text-gray-400">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map(n => (
              <article key={n.id} className="bg-[#081018] rounded-lg overflow-hidden border border-neutral-800">
                {n.img && <img src={n.img} alt={n.title} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <div className="text-xs text-cyan-300 mb-1">{n.category} • {new Date(n.date).toLocaleDateString('vi-VN')}</div>
                  <h2 className="font-semibold text-lg mb-2">{n.title}</h2>
                  <p className="text-sm text-gray-300 line-clamp-3">{n.desc}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default News;

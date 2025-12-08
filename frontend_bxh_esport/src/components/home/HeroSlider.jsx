import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const HeroSlider = ({ tournaments = [] }) => {
  // Calculate total prize from rewards array
  const calculateTotalPrize = (tournament) => {
    if (tournament?.rewards && Array.isArray(tournament.rewards)) {
      return tournament.rewards.reduce((sum, reward) => sum + (Number(reward.reward_amount) || 0), 0);
    }
    return tournament?.prize || tournament?.prize_pool || tournament?.total_prize || 0;
  };
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % tournaments.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + tournaments.length) % tournaments.length);
  };

  useEffect(() => {
    if (tournaments.length === 0) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Auto slide every 5 seconds

    return () => clearInterval(interval);
  }, [tournaments.length]);

  if (tournaments.length === 0) {
    return null;
  }

  const currentTournament = tournaments[currentSlide];
  const rawBannerUrl = currentTournament?.banner || currentTournament?.image;
  const bannerUrl = rawBannerUrl 
    ? (rawBannerUrl.startsWith('http') ? rawBannerUrl : `${import.meta.env.VITE_API_URL}${rawBannerUrl}`)
    : '/default-tournament-bg.jpg';

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-xl">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ 
            backgroundImage: `url(${bannerUrl})`,
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center px-8 md:px-16">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 border border-primary-500/50 rounded-full">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <span className="text-primary-300 font-semibold text-sm uppercase tracking-wider">
              Giải đấu hot
            </span>
          </div>

          {/* Tournament Name */}
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
            {currentTournament?.name || currentTournament?.tournament_name}
          </h1>

          {/* Info Row */}
          <div className="flex flex-wrap gap-6 text-white/90">
            {/* Prize Pool */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Giải thưởng</p>
                <p className="text-lg font-bold text-yellow-400">
                  {calculateTotalPrize(currentTournament)} ETH
                </p>
              </div>
            </div>

            {/* Start Date */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Bắt đầu</p>
                <p className="text-lg font-bold">
                  {formatDate(currentTournament?.start_date || currentTournament?.startDate, 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            {/* Teams Count */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Đội tham gia</p>
                <p className="text-lg font-bold">
                  {currentTournament?.participants?.length || currentTournament?.participants_count || 0}/{currentTournament?.total_team || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => navigate(`/tournaments/${currentTournament.id}/register`)}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/50 transform hover:scale-105 transition-all duration-200"
            >
              Đăng ký ngay
            </button>
            <button
              onClick={() => navigate(`/tournaments/${currentTournament.id}`)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg border border-white/20 transform hover:scale-105 transition-all duration-200"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {tournaments.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all group"
          >
            <ChevronLeftIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all group"
          >
            <ChevronRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {tournaments.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {tournaments.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-primary-500'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;

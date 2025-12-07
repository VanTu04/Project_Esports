import React, { useState, useEffect } from 'react';
import { getAllGames } from '../../services/gameService';

const GameFilter = ({ selectedGame, onGameSelect, games: gamesFromParent }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get selected game name
  const selectedGameName = selectedGame ? games.find(g => g.id === selectedGame)?.name || '' : 'Tất cả';

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await getAllGames('ACTIVE');
        const data = response?.data?.data || response?.data || response || [];
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="py-8 border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Lọc theo game: <span className="text-primary-400">{selectedGameName}</span>
        </h2>

        <div className="flex flex-wrap gap-4">
          {/* All Games Button */}
          <button
            onClick={() => onGameSelect(null)}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              selectedGame === null
                ? 'bg-gradient-to-br from-primary-600 to-primary-500 shadow-lg shadow-primary-500/50'
                : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
              selectedGame === null
                ? 'bg-white/20'
                : 'bg-primary-500/20 group-hover:bg-primary-500/30'
            }`}>
              <svg className={`w-8 h-8 ${selectedGame === null ? 'text-white' : 'text-primary-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className={`text-sm font-semibold ${
              selectedGame === null ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`}>
              Tất cả
            </span>
            {selectedGame === null && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full" />
            )}
          </button>

          {/* Individual Game Buttons */}
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onGameSelect(game.id)}
              className={`group relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                selectedGame === game.id
                  ? 'bg-gradient-to-br from-primary-600 to-primary-500 shadow-lg shadow-primary-500/50'
                  : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 overflow-hidden ${
                selectedGame === game.id
                  ? 'bg-white/20 ring-2 ring-white/50'
                  : 'bg-gray-700/50 group-hover:bg-gray-600/50'
              }`}>
                {game.logo ? (
                  <img
                    src={game.logo}
                    alt={game.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <svg className={`w-8 h-8 ${selectedGame === game.id ? 'text-white' : 'text-primary-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-semibold text-center min-w-[80px] max-w-[120px] line-clamp-2 ${
                selectedGame === game.id ? 'text-white' : 'text-gray-300 group-hover:text-white'
              }`}>
                {game.name || game.game_name}
              </span>
              {selectedGame === game.id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameFilter;

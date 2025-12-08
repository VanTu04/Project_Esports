import React, { useState, useMemo } from 'react';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import { Trash2, Users } from 'lucide-react';
import { API_CONFIG } from '../../config';

const MembersList = ({ members = [], onRemove }) => {
  if (!members || members.length === 0) {
    return (
      <div className="col-span-2 py-12 text-center border-2 border-dashed border-gray-700 rounded-2xl">
        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Chưa có thành viên nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {members.map((m) => (
        <div key={m.id} className="group bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/60 transition-all flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gray-900 overflow-hidden border border-gray-600">
            {(() => {
              const avatar = m.avatar;

              const buildCandidates = (url) => {
                if (!url) return [];
                const candidates = [];
                if (/^https?:\/\//.test(url)) candidates.push(url);
                else {
                  const base = API_CONFIG?.baseURL || '';
                  const origin = base.replace(/\/api\/?$/, '') || '';
                  if (origin) candidates.push(`${origin}${url.startsWith('/') ? url : `/${url}`}`);
                  try { candidates.push(`${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`); } catch(e){}
                  candidates.push(url);
                }
                return candidates;
              };

              const src = normalizeImageUrl(avatar) || null;
              if (!src) return <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>;
              return <img src={src} alt={m.name} className="w-full h-full object-cover" />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate">{m.name}</h3>
            <div className="text-xs font-bold text-cyan-600 bg-cyan-900/20 px-2 py-0.5 rounded w-fit mt-1 uppercase tracking-wider">{m.position}</div>
            {m.in_game_name && <p className="text-xs text-gray-500 mt-1 truncate">IGN: {m.in_game_name}</p>}
          </div>
          <button onClick={() => onRemove(m.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Xóa thành viên"><Trash2 className="w-5 h-5" /></button>
        </div>
      ))}
    </div>
  );
};

export default MembersList;

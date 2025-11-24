import React from 'react';
import { Card } from '../common/Card';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import { getStatusBadge } from './TournamentInfo';

const TournamentTeams = ({ teams = [], findTeamLogo }) => {
  return (
    <Card padding="lg">
      {teams.length === 0 ? (
        <div className="text-center py-12 text-gray-300">Chưa có đội tham gia</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-700/20">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">LOGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tên đội</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                // Prefer explicit participant `logo_url` or `avatar`, then nested `team.avatar`, then external finder
                const candidate = team.logo_url ?? team.avatar ?? team?.team?.avatar ?? team.logo ?? (typeof findTeamLogo === 'function' ? findTeamLogo(team) : null) ?? null;
                const logo = resolveTeamLogo(typeof candidate === 'string' ? { logo: candidate } : team);
                return (
                  <tr key={team.id} className="hover:bg-primary-500/10 transition-colors">
                    <td className="px-6 py-4 text-white font-bold">#{index + 1}</td>
                    <td className="px-6 py-4">
                      {logo ? (
                        <img
                          src={logo}
                          alt="logo"
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-700/30" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{team.team_name}</td>
                    <td className="px-6 py-4 text-gray-300">{team.wallet_address ? `${team.wallet_address.substring(0, 10)}...` : 'N/A'}</td>
                    <td className="px-6 py-4">{getStatusBadge(team.status || 'APPROVED')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default TournamentTeams;

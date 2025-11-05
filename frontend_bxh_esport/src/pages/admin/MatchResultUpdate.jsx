import { useEffect, useState } from 'react';
import matchService from '../../services/matchService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';

export const MatchResultUpdate = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await matchService.getAllMatches({ status: 'completed' });
      setMatches(data.matches || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Trận đấu',
      accessor: 'id',
      render: (value, row) => (
        <div>
          <p className="text-white">{row.team1?.name} vs {row.team2?.name}</p>
        </div>
      ),
    },
    {
      header: 'Tỉ số',
      accessor: 'score',
      render: (value, row) => (
        <span className="font-bold text-primary-500">
          {row.team1Score} - {row.team2Score}
        </span>
      ),
    },
    { header: 'Giải đấu', accessor: 'tournament.name' },
    {
      header: 'Hành động',
      accessor: 'id',
      render: (value) => (
        <Button size="sm">Cập nhật</Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Cập nhật kết quả</h1>
      <Table columns={columns} data={matches} loading={loading} />
    </div>
  );
};

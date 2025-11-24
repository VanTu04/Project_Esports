import React from 'react';
import TournamentDetail from '../../components/tournament/TournamentDetail';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const TournamentDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <TournamentDetail />
      </main>
      <Footer />
    </div>
  );
};

export default TournamentDetailPage;

import { useEffect, useState } from "react";
import blockchainService from "../../services/blockchainService";

export const BlockchainTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions(page);
  }, [page]);

  const loadTransactions = async (page) => {
    try {
      setLoading(true);
      const res = await blockchainService.getAllTransactions({ page, limit });

      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("Error loading blockchain transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold">Giao dịch Blockchain</h1>

      {loading ? (
        <p className="text-gray-400">Đang tải dữ liệu...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-400">Không có giao dịch nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#1c1c1e] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#2c2c2e] text-left">
                <th className="px-4 py-3">Hash</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Value (ETH)</th>
                <th className="px-4 py-3">Block</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-700 hover:bg-[#2a2a2c]"
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-400 cursor-pointer">
                      {tx.hash.substring(0, 10)}...
                    </span>
                  </td>
                  <td className="px-4 py-3">{tx.from}</td>
                  <td className="px-4 py-3">{tx.to || "Contract"}</td>
                  <td className="px-4 py-3">{tx.value}</td>
                  <td className="px-4 py-3">{tx.blockNumber}</td>
                  <td className="px-4 py-3">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-600 rounded disabled:opacity-40"
            >
              Trang trước
            </button>

            <span className="px-4 py-2">
              Trang {page}/{totalPages}
            </span>

            <button
              onClick={nextPage}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-600 rounded disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

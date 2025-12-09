import clsx from 'clsx';
import { Loading } from './Loading';

export const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  onRowClick,
  hoverable = true,
  noHorizontalScroll = false,
}) => {
  if (loading) {
    return <Loading />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const wrapperClass = noHorizontalScroll ? '' : 'overflow-x-auto';
  const tableClass = noHorizontalScroll ? 'w-full table-fixed divide-y divide-primary-700/20' : 'min-w-full divide-y divide-primary-700/20';

  return (
    <div className={wrapperClass}>
      <table className={tableClass}>
        <thead className="bg-dark-500">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider',
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-dark-400 divide-y divide-primary-700/20">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={clsx(
                hoverable && 'hover:bg-dark-300 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={clsx(
                    'px-6 py-4 whitespace-nowrap text-sm text-gray-300',
                    column.cellClassName
                  )}
                >
                  {column.render
                    ? column.render(row[column.accessor], row, rowIndex)
                    : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
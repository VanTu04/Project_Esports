
// ==================== Loading.jsx ====================
import clsx from 'clsx';

export const Loading = ({ size = 'md', fullScreen = false, text }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const loader = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={clsx(
          'animate-spin rounded-full border-4 border-primary-700/30 border-t-primary-500',
          sizes[size]
        )}
      />
      {text && <p className="mt-4 text-gray-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-500/80 backdrop-blur-sm flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{loader}</div>;
};

export const Skeleton = ({ className, variant = 'text' }) => {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-24 w-24 rounded',
  };

  return (
    <div
      className={clsx(
        'animate-pulse bg-dark-300 rounded',
        variants[variant],
        className
      )}
    />
  );
};

export const LoadingDots = () => (
  <div className="flex space-x-2 justify-center items-center">
    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" />
  </div>
);

export default Loading;
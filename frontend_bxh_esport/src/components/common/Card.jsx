// ==================== Card.jsx ====================
import clsx from 'clsx';

export const Card = ({
  children,
  className,
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(
        'bg-dark-400 border border-primary-700/20 rounded-lg',
        hover && 'hover:border-primary-600/50 hover:shadow-gold transition-all duration-300',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => (
  <div className={clsx('border-b border-primary-700/20 pb-3 mb-4', className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-white', className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={clsx('text-gray-300', className)}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={clsx('border-t border-primary-700/20 pt-3 mt-4', className)}>
    {children}
  </div>
);

export default Card;


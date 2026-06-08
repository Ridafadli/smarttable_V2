export default function Card({ children, className = '', hover = true, padding = true }) {
  return (
    <div
      className={`surface-card ${hover ? 'surface-card-hover' : ''} ${padding ? 'p-5 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

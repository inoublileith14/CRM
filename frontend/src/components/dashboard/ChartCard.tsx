import { ReactNode } from 'react';

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  description,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

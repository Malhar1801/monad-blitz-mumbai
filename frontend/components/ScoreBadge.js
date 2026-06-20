'use client';

export default function ScoreBadge({ score, label, size = 'md' }) {
  const color =
    score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400';

  const sizeClass = size === 'lg' ? 'text-3xl font-black px-4 py-2' : 'text-sm font-bold px-2 py-1';

  return (
    <span className={`font-mono ${sizeClass} ${color} border-2 border-black inline-flex items-center gap-1 shadow-brutal-sm`}>
      {label && <span className="text-xs opacity-70">{label}</span>}
      <span>{score}</span>
    </span>
  );
}

import React from 'react';

interface ScoreRingProps {
  score: number;
}

export default function ScoreRing({ score }: ScoreRingProps) {
  let color = 'text-red-500';
  let stroke = 'stroke-red-500';
  
  if (score >= 80) {
    color = 'text-green-500';
    stroke = 'stroke-green-500';
  } else if (score >= 50) {
    color = 'text-yellow-500';
    stroke = 'stroke-yellow-500';
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
        <circle
          cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="8" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={`${stroke} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-black ${color}`}>{score}</span>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Score</span>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Timer, Play, Calendar } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  isActive: boolean;
}

export default function CountdownTimer({ targetDate, isActive }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'ended'>('upcoming');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (!isActive) {
        setStatus('ended');
        setTimeLeft('已結束');
        return;
      }

      if (difference > 0) {
        setStatus('upcoming');
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let parts: string[] = [];
        if (days > 0) {
          parts.push(`${days}天`);
        }
        const hrsStr = String(hours).padStart(2, '0');
        const minsStr = String(minutes).padStart(2, '0');
        const secsStr = String(seconds).padStart(2, '0');
        parts.push(`${hrsStr}:${minsStr}:${secsStr}`);

        setTimeLeft(parts.join(' '));
      } else {
        setStatus('ongoing');
        const elapsed = Math.abs(difference);
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        const hrsStr = String(hours).padStart(2, '0');
        const minsStr = String(minutes).padStart(2, '0');
        const secsStr = String(seconds).padStart(2, '0');
        
        setTimeLeft(`${hrsStr}:${minsStr}:${secsStr}`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isActive]);

  if (status === 'ended') {
    return (
      <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-lg border border-slate-200/60 select-none">
        <Timer className="w-3 h-3 text-slate-400" />
        <span>活動截止</span>
      </div>
    );
  }

  if (status === 'ongoing') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg border border-emerald-100/80 animate-pulse select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <Play className="w-2.5 h-2.5 text-emerald-600 fill-current" />
        <span>進行中 {timeLeft}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border border-indigo-100/80 select-none shadow-3xs hover:bg-indigo-100/30 transition-colors">
      <Timer className="w-3 h-3 text-indigo-500 animate-spin-slow" style={{ animationDuration: '6s' }} />
      <span>倒數 {timeLeft}</span>
    </div>
  );
}

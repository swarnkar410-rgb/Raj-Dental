'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Award, Users, Star, CalendarDays } from 'lucide-react';

interface CounterProps {
  end: number;
  suffix: string;
  duration?: number;
}

function AnimatedCounter({ end, suffix, duration = 1500 }: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return (
    <div ref={elementRef} className="font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
      <span>{count}</span>
      <span className="text-[#D4AF37] ml-0.5">{suffix}</span>
    </div>
  );
}

export default function Trust() {
  const stats = [
    {
      icon: <Star className="text-[#D4AF37] w-6 h-6" />,
      end: 145,
      suffix: '+',
      label: 'Google & Direct Reviews',
      description: '5-star rated service rating'
    },
    {
      icon: <Award className="text-[#3B82F6] w-6 h-6" />,
      end: 17,
      suffix: '+',
      label: 'Years Experience',
      description: 'Established clinic since 2009'
    },
    {
      icon: <Users className="text-[#3B82F6] w-6 h-6" />,
      end: 20000,
      suffix: '+',
      label: 'Patients Treated',
      description: 'Confidence restored daily'
    },
    {
      icon: <CalendarDays className="text-[#D4AF37] w-6 h-6" />,
      end: 2009,
      suffix: '',
      label: 'Established Year',
      description: 'Serving Patna community'
    }
  ];

  return (
    <section className="py-12 bg-[#0B1220] relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:border-[#3B82F6]/30"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  {stat.icon}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
              <div className="space-y-1">
                <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                <h4 className="font-semibold text-gray-200 text-sm">{stat.label}</h4>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

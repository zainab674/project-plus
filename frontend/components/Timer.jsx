"use client"
import React, { useEffect, useRef, useState } from 'react';

const Timer = ({ startTime }) => {
  const [seconds, setSeconds] = useState(0);
  const [time, setTime] = useState("00:00:00");
  const timerRef = useRef(null);

  useEffect(() => {
    // Calculate elapsed seconds from the given startTime
    const start = new Date(startTime).getTime();

    const updateElapsedTime = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000); // Elapsed time in seconds
      setSeconds(elapsed);
    };

    // Initial call
    updateElapsedTime();

    // Update every second
    timerRef.current = setInterval(updateElapsedTime, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [startTime]);

  useEffect(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const formattedTime = `${hours.toString().padStart(2, '0')}:` +
                          `${minutes.toString().padStart(2, '0')}:` +
                          `${secs.toString().padStart(2, '0')}`;
    setTime(formattedTime);
  }, [seconds]);

  return <>{time}</>;
};

export default Timer;

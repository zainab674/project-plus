export function getHourMinDiff(start, end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffInMs = endTime - startTime;
  
    const totalMinutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
  
    return `${paddedHours}:${paddedMinutes}`;
  }
  
export const getRecentDatesWithLabels = (days=5) => {
    const dates = [];
  
    // Get today's date
    const today = new Date();
    dates.push({ label: 'today', date: formatDate(today) });
  
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Subtract one day
    dates.push({ label: 'yesterday', date: formatDate(yesterday) });
  
    // Get the previous 3 days
    for (let i = 2; i <= days; i++) {
      const prevDate = new Date(today);
      prevDate.setDate(today.getDate() - i); // Subtract i days
      dates.push({ label: formatDate(prevDate), date: formatDate(prevDate) });
    }
  
    return dates;
  };
  
  // Helper function to format dates in YYYY-MM-DD format
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
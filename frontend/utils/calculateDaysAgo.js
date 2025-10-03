export const calculateDaysAgo = (dateString) => {
  // Parse the given date string
  const givenDate = new Date(dateString);

  // Get today's date without the time part
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset hours, minutes, seconds, and milliseconds

  // Get the given date without the time part
  givenDate.setHours(0, 0, 0, 0); // Reset hours, minutes, seconds, and milliseconds

  //hi
  // Calculate the difference in milliseconds
  const diffInMs = today - givenDate;

  // Convert milliseconds to days
  const daysAgo = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  return daysAgo;
};

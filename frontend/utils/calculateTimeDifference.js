export function calculateTimeDifference(givenTime) {
  const now = Date.now(); // Current time in milliseconds
  const differenceInMs = now - givenTime; // Time difference in milliseconds

  if (differenceInMs < 0) {
    throw new Error("Given time is in the future. Please provide a past time.");
  }

  const differenceInSeconds = Math.floor(differenceInMs / 1000); // Convert to seconds
  const minutes = Math.floor(differenceInSeconds / 60); // Calculate full minutes

  if (minutes === 0) {
    return `${differenceInSeconds} sec`;
  } else {
    return `${minutes} min`;
  }
}

export const bytesToMB = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2); // Rounds to 2 decimal places
};
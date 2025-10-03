export function formatDate(inputDate) {
    const date = new Date(inputDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
  
    return `${day} ${month}`;
  }
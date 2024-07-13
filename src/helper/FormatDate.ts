export function formatDate(date: Date): string | null {
  if (isNaN(date.getTime())) {
    console.error("Invalid date string format");
    return null;
  }

  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();

  // Zero-pad day and month if needed
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;

  return `${formattedDay}/${formattedMonth}/${year}`;
}

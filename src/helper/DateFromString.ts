function createDateFromString(dateString: string | null): Date | null {
  if (!dateString || typeof dateString !== "string") return null;
  const [day, month, year] = dateString.split("/").map(Number);

  // Check if the components are valid
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    console.error("Invalid date string format");
    return null;
  }

  // Months are 0-based in JavaScript Date objects
  const jsMonth = month - 1;

  // Create a new Date object
  const date = new Date(year, jsMonth, day);

  return date;
}

export default createDateFromString;

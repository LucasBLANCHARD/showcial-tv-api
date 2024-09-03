const getLastMondayAndNextSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate last Monday
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  // Calculate next Sunday
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + ((7 - dayOfWeek) % 7));

  // Format dates as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2); // Months are zero-indexed
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  return {
    lastMonday: formatDate(lastMonday),
    nextSunday: formatDate(nextSunday),
  };
};

module.exports = getLastMondayAndNextSunday;

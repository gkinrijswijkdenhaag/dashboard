// src/lib/date-utils.js
// Shared date utility functions to ensure consistent dates across components

/**
 * Format a date as a relative time string (e.g. "2 hours ago")
 * @param {Date} date - The date to format
 * @returns {string} Formatted relative time string
 */
export function formatDistanceToNow(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  // Format as date for older items
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Get the next N Sundays starting from today or the current/next Sunday
export function getUpcomingSundays(count = 8) {
  const sundays = [];
  const today = new Date();

  // For testing specific dates (comment out in production)
  // const today = new Date('2025-07-12'); // July 12, 2025 (Saturday)

  today.setHours(0, 0, 0, 0);

  // Find the current or next Sunday (day 0 is Sunday in JavaScript)
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startingSunday = new Date(today);

  if (currentDay === 0) {
    // Today is Sunday, start with today
  } else {
    // Find the next Sunday by adding days needed to reach Sunday (day 0)
    const daysUntilSunday = 7 - currentDay;
    startingSunday.setDate(today.getDate() + daysUntilSunday);
  }

  // Generate Sundays
  for (let i = 0; i < count; i++) {
    const sunday = new Date(startingSunday);
    // For the first Sunday, use the starting Sunday
    // For subsequent Sundays, add 7 days to the previous Sunday
    if (i > 0) {
      sunday.setDate(startingSunday.getDate() + i * 7);
    }

    // Double check that it's actually Sunday (day 0)
    if (sunday.getDay() !== 0) {
      console.error("Date calculation error: Not a Sunday", sunday);
      // Force correction to the nearest Sunday
      const adjustment = sunday.getDay() === 6 ? 1 : 7 - sunday.getDay();
      sunday.setDate(sunday.getDate() + adjustment);
    }

    // Calculate days remaining accurately
    const todayTime = today.getTime();
    const sundayTime = sunday.getTime();
    const diffTime = sundayTime - todayTime;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    sundays.push({
      date: sunday,
      // Format date as YYYY-MM-DD without timezone conversion
      dateString: `${sunday.getFullYear()}-${String(
        sunday.getMonth() + 1
      ).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`,
      title: sunday.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      daysRemaining: daysRemaining,
      isCurrent: i === 0,
      status: daysRemaining < 0 ? "past" : i === 0 ? "active" : "upcoming",
    });
  }

  return sundays;
}

// Generate service data for upcoming Sundays
export function generateServiceData(count = 4) {
  const sundays = getUpcomingSundays(count);

  return sundays.map((sunday, index) => ({
    id: index + 1,
    date: sunday.dateString,
    title: `Sunday Service - ${sunday.title}`,
    status: index === 0 ? "in-progress" : "pending",
    currentStep: index === 0 ? 1 : 0,
    totalSteps: 7,
    assignedTo: "liturgy",
    documents: [], // Start with empty documents
  }));
}

// Get the default selected week (first upcoming Sunday)
export function getDefaultSelectedWeek() {
  const sundays = getUpcomingSundays(1);
  return sundays[0]?.dateString || null;
}

// Format date nicely
export function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

// Get status color based on days remaining
export function getStatusColor(daysRemaining) {
  // Today - green (it's happening now!)
  if (daysRemaining === 0)
    return "bg-green-100 text-green-800 border-green-300";
  // Past dates - gray
  if (daysRemaining < 0) return "bg-gray-100 text-gray-800 border-gray-300";
  // Tomorrow - blue (coming up very soon)
  if (daysRemaining === 1) return "bg-blue-100 text-blue-800 border-blue-300";
  // 2-3 days - yellow (getting close)
  if (daysRemaining <= 3)
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  // 4-7 days - orange (approaching)
  if (daysRemaining <= 7)
    return "bg-orange-100 text-orange-800 border-orange-300";
  // More than a week - green (plenty of time)
  return "bg-green-100 text-green-800 border-green-300";
}

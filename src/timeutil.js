/**
 * Intl.DateTimeFormat object
 * 
 * example:
 * 
 *   console.log(dateTime.format(new Date()));
 */
export const dateTime = new Intl.DateTimeFormat('de-ch' /* navigator.language */, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * format time relative to now, such as 5min ago
 * 
 * @param {Date} time 
 * @param {string} locale
 * @returns string
 * 
 * example:
 * 
 *   console.log(timeAgo(new Date(Date.now() - 10000)));
 * 
 */
const timeAgo = (time, locale = 'en') => {
  const relativeTime = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'long',
  });
  const timeSince = (Date.now() - time.getTime()) * 0.001;
  const minutes = Math.floor(timeSince / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return relativeTime.format(0 - years, 'year');
  } else if (months > 0) {
    return relativeTime.format(0 - months, 'month');
  } else if (days > 0) {
    return relativeTime.format(0 - days, 'day');
  } else if (hours > 0) {
    return relativeTime.format(0 - hours, 'hour');
  } else if (minutes > 0) {
    return relativeTime.format(0 - minutes, 'minute');
  } else {
    return relativeTime.format(Math.round(0 - timeSince), 'second');
  }
};

/**
 * formatTime shows relative time if it is less than 24h else absolute datetime
 *
 * @param {time} date object to format
 * @return string
 */
export const formatTime = (time) => {
  const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000));
  if (time > yesterday) {
    return timeAgo(time);
  } else {
    return dateTime.format(time);
  };
};

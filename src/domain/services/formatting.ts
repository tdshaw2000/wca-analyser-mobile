/**
 * Formatting of WCA results for display. Pure domain logic ported from the
 * Python source's formatting.py. Singles are stored as centiseconds.
 */
const CENTISECONDS_PER_SECOND = 100;
const SECONDS_PER_MINUTE = 60;
const CENTISECONDS_PER_MINUTE = CENTISECONDS_PER_SECOND * SECONDS_PER_MINUTE;

const TWO_DIGIT_WIDTH = 2;
const PAD_CHARACTER = '0';

function padTwoDigits(value: number): string {
  return String(value).padStart(TWO_DIGIT_WIDTH, PAD_CHARACTER);
}

/** Render a result in centiseconds as a cubing time string (e.g. 7674 -> "1:16.74"). */
export function formatTime(centiseconds: number): string {
  const minutes = Math.floor(centiseconds / CENTISECONDS_PER_MINUTE);
  const withinMinute = centiseconds % CENTISECONDS_PER_MINUTE;
  const seconds = Math.floor(withinMinute / CENTISECONDS_PER_SECOND);
  const hundredths = withinMinute % CENTISECONDS_PER_SECOND;

  if (minutes > 0) {
    return `${minutes}:${padTwoDigits(seconds)}.${padTwoDigits(hundredths)}`;
  }
  return `${seconds}.${padTwoDigits(hundredths)}`;
}

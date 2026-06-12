import { formatTime } from '@/domain/services/formatting';

// Ported from the Python source's tests/test_formatting.py. Singles are stored
// as centiseconds; formatTime renders them as a cubing time string.
describe('formatTime', () => {
  it('shows seconds and hundredths under a minute', () => {
    expect(formatTime(585)).toBe('5.85');
  });

  it('keeps two hundredths digits', () => {
    expect(formatTime(1498)).toBe('14.98');
  });

  it('shows minutes when at least a minute', () => {
    expect(formatTime(7674)).toBe('1:16.74');
  });

  it('pads seconds and hundredths within a minute value', () => {
    expect(formatTime(6000)).toBe('1:00.00');
  });
});

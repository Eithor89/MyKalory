/**
 * Animated progress bar for macros and calories.
 * @param {number} value - current amount
 * @param {number} max - target amount
 * @param {string} color - CSS color or variable
 * @param {boolean} showOverflow - if true, shows red overflow instead of clamping
 */
export default function ProgressBar({ value, max, color = 'var(--color-accent)', showOverflow = true, height = 6 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const isOver = pct > 100 && showOverflow;

  return (
    <div
      className="progress-track"
      style={{ height, borderRadius: 'var(--radius-full)' }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className="progress-fill"
        style={{
          width: `${clamped}%`,
          background: isOver ? 'var(--color-red)' : color,
        }}
      />
    </div>
  );
}

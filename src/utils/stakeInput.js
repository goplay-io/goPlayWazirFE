/** Bet slip stake field — max two decimal places. */
export function sanitizeStakeInput(raw) {
  if (raw === '' || raw == null) {
    return { text: '', value: null };
  }

  const cleaned = String(raw).replace(/[^\d.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  let text;

  if (dotIndex === -1) {
    text = cleaned;
  } else {
    const whole = cleaned.slice(0, dotIndex);
    const fraction = cleaned.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2);
    text = `${whole}.${fraction}`;
  }

  if (text === '' || text === '.') {
    return { text: '', value: null };
  }

  const numericText = text.endsWith('.') ? text.slice(0, -1) : text;
  if (numericText === '') {
    return { text: '', value: null };
  }

  const value = Number(numericText);
  if (Number.isNaN(value)) {
    return { text: '', value: null };
  }

  return {
    text,
    value: Math.round(value * 100) / 100,
  };
}

export function applyStakeInput(bet, event) {
  const { text, value } = sanitizeStakeInput(event.target.value);
  if (event.target.value !== text) {
    event.target.value = text;
  }
  bet.stake = value;
}

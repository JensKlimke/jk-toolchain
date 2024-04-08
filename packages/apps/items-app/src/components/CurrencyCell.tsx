export default function CurrencyCell({amount, colored, fracDigits}: {
  amount: number,
  colored?: boolean,
  fracDigits?: number
}) {
  amount = Math.abs(amount) < 1e-3 ? 0.0 : amount;
  const className = (colored && amount !== undefined) ? (amount >= 0.0 ? 'text-success' : 'text-danger') : undefined;
  return amount ?
    <code className={className}>{Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: (fracDigits === undefined ? 2 : fracDigits),
    }).format(amount)}</code> :
    <code>-</code>
}

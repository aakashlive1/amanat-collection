export interface UpiPaymentParams {
  upiVpa: string;
  upiName: string;
  amount: number;
  note?: string;
  memberCode?: string;
}

/**
 * Builds the standard NPCI UPI URI
 * e.g., upi://pay?pa=amanat@upi&pn=Amanat%20Collection&am=500&tn=AC-1001-DailyPay&cu=INR
 */
export const buildUpiUri = ({
  upiVpa,
  upiName,
  amount,
  note = 'Daily Collection Deposit',
  memberCode = '',
}: UpiPaymentParams): string => {
  const transactionNote = memberCode ? `${memberCode} - ${note}` : note;
  const params = new URLSearchParams({
    pa: upiVpa.trim(),
    pn: upiName.trim(),
    am: amount.toFixed(2),
    tn: transactionNote.slice(0, 50),
    cu: 'INR',
  });

  return `upi://pay?${params.toString()}`;
};

/**
 * Opens the native UPI intent or fallback
 */
export const launchUpiApp = (params: UpiPaymentParams): void => {
  const uri = buildUpiUri(params);
  window.location.href = uri;
};

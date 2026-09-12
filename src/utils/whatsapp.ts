import { formatCurrency, formatDateTime } from './formatters';

export interface WhatsAppReceiptParams {
  memberPhone: string;
  memberName: string;
  memberCode: string;
  amount: number;
  paymentMode: 'cash' | 'online';
  collectorName: string;
  uniqueToken: string;
  appName?: string;
}

/**
 * Builds a free WhatsApp direct message link without API charges
 */
export const buildWhatsAppReceiptUrl = ({
  memberPhone,
  memberName,
  memberCode,
  amount,
  paymentMode,
  collectorName,
  uniqueToken,
  appName = 'Amanat Collection',
}: WhatsAppReceiptParams): string => {
  // Format phone to international format without + or spaces
  let cleanPhone = memberPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const passbookUrl = `${window.location.origin}/#/m/${uniqueToken}`;
  const modeText = paymentMode === 'cash' ? '💵 Cash' : '📲 Online UPI';
  const now = formatDateTime(new Date().toISOString());

  const message = `*${appName} - Payment Receipt*\n\n` +
    `Hello *${memberName}*,\n` +
    `Your daily collection payment has been received successfully.\n\n` +
    `📌 *Member Code:* ${memberCode}\n` +
    `💰 *Amount Received:* ${formatCurrency(amount)}\n` +
    `💳 *Payment Mode:* ${modeText}\n` +
    `👤 *Collector:* ${collectorName}\n` +
    `🕒 *Date & Time:* ${now}\n\n` +
    `To view your complete passbook statement and deposit history, visit:\n` +
    `👉 ${passbookUrl}\n\n` +
    `_Thank you, ${appName}_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export interface WhatsAppWithdrawalParams {
  memberPhone: string;
  memberName: string;
  memberCode: string;
  amount: number;
  paymentMode: 'cash' | 'online';
  processedByName: string;
  remainingBalance: number;
  uniqueToken: string;
  appName?: string;
}

/**
 * Builds a free WhatsApp direct payout / withdrawal receipt message link
 */
export const buildWhatsAppWithdrawalReceiptUrl = ({
  memberPhone,
  memberName,
  memberCode,
  amount,
  paymentMode,
  processedByName,
  remainingBalance,
  uniqueToken,
  appName = 'Amanat Collection',
}: WhatsAppWithdrawalParams): string => {
  let cleanPhone = memberPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const passbookUrl = `${window.location.origin}/#/m/${uniqueToken}`;
  const modeText = paymentMode === 'cash' ? '💵 Cash Payout' : '📲 Bank / Online UPI Payout';
  const now = formatDateTime(new Date().toISOString());

  const message = `*${appName} - Withdrawal / Payout Receipt*\n\n` +
    `Hello *${memberName}*,\n` +
    `Your payout / withdrawal has been processed successfully.\n\n` +
    `📌 *Member Code:* ${memberCode}\n` +
    `💸 *Amount Paid Out:* ${formatCurrency(amount)}\n` +
    `💳 *Payment Mode:* ${modeText}\n` +
    `💼 *Remaining Net Balance:* ${formatCurrency(remainingBalance)}\n` +
    `👤 *Processed By:* ${processedByName}\n` +
    `🕒 *Date & Time:* ${now}\n\n` +
    `To view your complete passbook statement and transaction history, visit:\n` +
    `👉 ${passbookUrl}\n\n` +
    `_Thank you, ${appName}_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

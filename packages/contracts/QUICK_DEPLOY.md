# Quick Deployment Guide - DeGift Contract

## 🚀 5-Minute Deployment

### Prerequisites
- ✅ Foundry installed
- ✅ Ethereum Sepolia ETH (get from https://sepoliafaucet.com/)
- ✅ Private key ready

### Step 1: Setup (30 seconds)
```bash
cd packages/contracts
cp .env.example .env
# Edit .env with your PRIVATE_KEY and SEPOLIA_RPC_URL
```

### Step 2: Test (1 minute)
```bash
forge build && forge test
```

### Step 3: Deploy (2 minutes)
```bash
# Dry run (optional)
forge script script/DeployDeGift.s.sol:DeployDeGift \
  --rpc-url $SEPOLIA_RPC_URL

# Real deployment
forge script script/DeployDeGift.s.sol:DeployDeGift \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### Step 4: Verify (30 seconds)
Check the output for:
```
DeGift deployed at: 0x...
```

Visit: `https://sepolia.etherscan.io/address/0x...`

### Done! 🎉

Save your contract address:
- Update `packages/contracts/DEPLOYMENT.md`
- Update frontend config
- Update backend config

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

# DeGift Contract Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the DeGift smart contract to Ethereum Sepolia testnet.

## 🎯 Prerequisites

Before deploying, ensure you have:

- [ ] Foundry installed (`foundryup`)
- [ ] Ethereum Sepolia ETH for gas fees
- [ ] Private key with sufficient funds
- [ ] (Optional) Etherscan API key for contract verification

## 💰 Get Ethereum Sepolia ETH

### Option 1: Sepolia Faucet (Recommended)
Visit any of these faucets:
- **Alchemy**: https://sepoliafaucet.com/
- **Infura**: https://www.infura.io/faucet/sepolia
- **QuickNode**: https://faucet.quicknode.com/ethereum/sepolia
- **Chainlink**: https://faucets.chain.link/sepolia

### Option 2: Sepolia PoW Faucet
If you have some computing power:
- **URL**: https://sepolia-faucet.pk910.de/
- Mine Sepolia ETH using your browser

## 🔧 Setup Environment

### 1. Copy Environment Template

```bash
cd packages/contracts
cp .env.example .env
```

### 2. Configure `.env` File

Edit `.env` with your values:

```bash
# Required: Your deployer private key
PRIVATE_KEY=0x... # Your private key with Ethereum Sepolia ETH

# Required: Ethereum Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# Or use public RPC: https://rpc.sepolia.org

# Optional: Etherscan API key for verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**⚠️ SECURITY WARNING**:
- NEVER commit your `.env` file to Git
- NEVER share your private key
- Use a dedicated deployer wallet for testing

## 🚀 Deployment Steps

### Step 1: Compile Contracts

```bash
forge build
```

Expected output:
```
Compiler run successful!
```

### Step 2: Run Tests

```bash
forge test
```

Expected output:
```
Ran 2 test suites: 60 tests passed, 0 failed
```

### Step 3: Simulate Deployment (Dry Run)

Test the deployment script locally:

```bash
forge script script/DeployDeGift.s.sol:DeployDeGift \
  --rpc-url $SEPOLIA_RPC_URL \
  -vvvv
```

This will show you:
- Gas estimates
- Deployment address (predicted)
- No actual transactions sent

### Step 4: Deploy to Ethereum Sepolia

**Option A: Deploy WITHOUT automatic verification**

```bash
forge script script/DeployDeGift.s.sol:DeployDeGift \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

**Option B: Deploy WITH automatic verification (Recommended)**

```bash
forge script script/DeployDeGift.s.sol:DeployDeGift \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### Step 5: Save Deployment Info

The script automatically saves deployment details to:
- `deployment-degift.txt` - Local deployment record
- `broadcast/DeployDeGift.s.sol/84532/run-latest.json` - Foundry broadcast log

Example `deployment-degift.txt`:
```
DeGift Contract Deployment
==========================
Chain ID: 84532
Deployer: 0x...
Contract: 0x...
Block: 12345678
Timestamp: 1699012345
```

## ✅ Verify Deployment

### 1. Check Contract on Etherscan

Visit: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

You should see:
- Contract creation transaction
- Contract code (if verified)
- Read/Write contract interface

### 2. Manual Verification (if automatic failed)

```bash
forge verify-contract \
  YOUR_CONTRACT_ADDRESS \
  src/DeGift.sol:DeGift \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 3. Test Basic Functionality

#### Test 1: Create ETH Gift

```bash
cast send YOUR_CONTRACT_ADDRESS \
  "createGift(address,address,uint256,string,uint256)" \
  RECIPIENT_ADDRESS \
  "0x0000000000000000000000000000000000000000" \
  "100000000000000000" \
  "Test Gift" \
  $(($(date +%s) + 86400)) \
  --value 0.1ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Test 2: Query Gift

```bash
cast call YOUR_CONTRACT_ADDRESS \
  "getGift(uint256)" \
  1 \
  --rpc-url $SEPOLIA_RPC_URL
```

#### Test 3: Check Total Gifts

```bash
cast call YOUR_CONTRACT_ADDRESS \
  "getTotalGifts()" \
  --rpc-url $SEPOLIA_RPC_URL
```

## 📊 Gas Estimates

Estimated gas costs on Ethereum Sepolia:

| Operation | Gas Used | Cost (at 0.01 gwei) |
|-----------|----------|---------------------|
| Contract Deployment | ~2,500,000 | ~0.025 ETH |
| Create ETH Gift | ~100,000 | ~0.001 ETH |
| Create ERC20 Gift | ~150,000 | ~0.0015 ETH |
| Create NFT Gift (ERC721) | ~180,000 | ~0.0018 ETH |
| Create NFT Gift (ERC1155) | ~200,000 | ~0.002 ETH |
| Claim Gift | ~80,000 | ~0.0008 ETH |
| Refund Gift | ~60,000 | ~0.0006 ETH |

**Note**: Actual costs may vary based on network congestion.

## 🔍 Troubleshooting

### Issue 1: "Insufficient funds"

**Solution**: Get more Ethereum Sepolia ETH from faucets (see section above for faucet links).

### Issue 2: "Nonce too low"

**Solution**:
```bash
# Get current nonce
cast nonce YOUR_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Add --nonce flag to command
--nonce CORRECT_NONCE
```

### Issue 3: "Contract verification failed"

**Solution**:
1. Verify manually using `forge verify-contract`
2. Check Etherscan API key is correct
3. Wait a few minutes and try again

### Issue 4: "RPC connection failed"

**Solution**:
1. Check RPC URL is correct
2. Try alternative RPC:
   - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
   - Infura: `https://sepolia.infura.io/v3/YOUR_KEY`
   - Public: `https://rpc.sepolia.org`

## 📚 Contract Addresses

### Ethereum Sepolia Testnet

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| DeGift | `TBD` | Pending | ⏳ |

*Will be updated after deployment*

## 🔗 Useful Links

- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **Sepolia Faucets**:
  - https://sepoliafaucet.com/
  - https://faucets.chain.link/sepolia
  - https://www.infura.io/faucet/sepolia
- **Ethereum Documentation**: https://ethereum.org/en/developers/docs/
- **Foundry Book**: https://book.getfoundry.sh/

## 🛡️ Security Checklist

Before deploying to mainnet:

- [ ] All tests passing
- [ ] Code coverage > 90%
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Emergency pause mechanism tested
- [ ] Upgrade strategy defined
- [ ] Monitoring setup complete
- [ ] Documentation complete

## 📝 Post-Deployment Tasks

1. **Update Documentation**
   - Add contract address to README
   - Update frontend configuration
   - Update API configuration

2. **Configure Frontend**
   ```typescript
   // apps/web/src/config/contracts.ts
   export const DEGIFT_ADDRESS = '0x...'; // Your deployed address
   export const DEGIFT_CHAIN_ID = 11155111; // Ethereum Sepolia
   ```

3. **Configure Backend**
   ```typescript
   // apps/api/src/config/contracts.ts
   export const DEGIFT_ADDRESS = '0x...';
   ```

4. **Announce Deployment**
   - Post on team Discord/Slack
   - Update Linear issue (ZES-72)
   - Notify frontend/backend teams

## 💡 Tips

1. **Gas Optimization**
   - Deploy during low network activity
   - Use `--legacy` flag if EIP-1559 issues

2. **Testing on Testnet**
   - Create diverse gift types (ETH, ERC20, NFT)
   - Test expiration scenarios
   - Verify refund mechanism
   - Test with multiple users

3. **Monitoring**
   - Watch for unexpected events
   - Monitor gas usage
   - Check for failed transactions

## 🆘 Need Help?

- **Foundry Issues**: https://github.com/foundry-rs/foundry/issues
- **Base Support**: https://discord.gg/base
- **Team Contact**: #dev-smart-contracts channel

---

**Last Updated**: 2025-11-03
**Version**: 1.0
**Maintainer**: Claude Dev (AI)

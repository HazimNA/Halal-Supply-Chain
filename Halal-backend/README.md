# Halal Supply Chain Backend

This is the backend for the Halal Supply Chain project, built with Hardhat.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Sepolia configuration:
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
   ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
   ```

## Deployment

### Local Development
```bash
npx hardhat node
npx hardhat run scripts/deploy.js
```

### Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment, note the contract address and update it in the frontend's `shared.js` file.

## Testing
```bash
npx hardhat test
```

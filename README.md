# Halal Supply Chain

A blockchain-based system for tracking halal supply chains using Ethereum smart contracts.

## Project Structure

- `Halal-backend/`: Smart contract development with Hardhat
- `halal-frontend/`: React frontend for interacting with the contracts
- 'backend-ipfs/': ipfs storage for Halal Certificate

## Deployment to Sepolia

1. **Backend Setup:**
   - Navigate to `Halal-backend/`
   - Install dependencies: `npm install`
   - Update `.env` with your Sepolia RPC URL, private key, and Etherscan API key
   - Deploy: `npx hardhat run scripts/deploy.js --network sepolia`
   - Note the deployed contract address

2. **Frontend Setup:**
   - Navigate to `halal-frontend/`
   - Install dependencies: `npm install`
   - Update `src/blockchain/shared.js` with the deployed contract address
   - Ensure MetaMask is connected to Sepolia testnet
   - Start: `npm run dev`

3. **ipfs Setup:**
   - Navigate to `backend-ipfs/`
   - Install dependencies: `npm install`
   - Start: `npm run start`
   
## Requirements

- Node.js
- MetaMask browser extension
- Sepolia ETH for gas fees (get from faucets like https://sepoliafaucet.com/)

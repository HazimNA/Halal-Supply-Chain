# Halal Supply Chain dApp

This repository contains a Hardhat smart-contract backend and a Vite React frontend for the Halal Supply Chain decentralized application (dApp).

## Overview
- Backend: `Halal-backend` (Hardhat project: contracts, deployment, tests)
- Frontend: `halal-frontend` (Vite + React app connecting to MetaMask)

## Prerequisites
- Node.js (v16+ recommended) and npm or yarn
- Git
- VS Code (recommended)

## steps
1. run the node in terminal:
    - Go to terminal (At the top of Vscode, next to "Run") and create new terminal.
    - type: cd halal-backend (change directory to halal-backend)
    - then type: 'npx hardhat node' (Do not close this terminal)

2. deploy the code:
    - Go to terminal (At the top of Vscode, next to "Run") and create new terminal.
    - type: cd halal-backend (change directory to halal-backend)
    - then type: 'npx hardhat run scripts/deploy.js --network localhost' (to deploy)
    - The copy the deployed address and paste in shared.js

Open the displayed URL (usually `http://localhost:5173`) in your browser.

## MetaMask setup for local testing
1. Install MetaMask browser extension (Chrome, Firefox, Edge).
2. Create a new wallet or import an existing wallet.
3. Add a custom network (connect MetaMask to your local Hardhat node):
   - Network Name: `Hardhat Local` (any name)
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337` (Hardhat default)
   - Currency Symbol: `ETH` (optional)

4. Import an account from the Hardhat node:
   - When you run `npx hardhat node`, the console shows a list of accounts and private keys.
   - In MetaMask, choose `Import Account` and paste one of the private keys (no 0x prefix needed depending on MetaMask).
   - This account will have test ETH provided by the Hardhat node.

5. Connect MetaMask to the dApp in the browser by clicking the MetaMask connect button on the frontend.

## Using the dApp
1. Ensure `npx hardhat node` is running and contracts are deployed (see Deploy step).
2. Open the frontend (`npm run dev`) and connect MetaMask.
3. Use the UI pages (producer, slaughterhouse, distributor, retailer, HalalAuthority, public) to create products, update states, and track items.

## Useful file locations
- Backend contracts: `Halal-backend/contracts/HalalSupplyChain.sol`
- Deployment script: `Halal-backend/scripts/deploy.js`
- Frontend ABI/contract: `halal-frontend/src/contracts/HalalSupplyChain.json`

## Troubleshooting
- If MetaMask cannot connect: ensure the RPC URL and Chain ID are correct and the Hardhat node is running.
- If deployment fails: check that `npx hardhat node` is running on `localhost:8545` and that you used `--network localhost` during deploy.
- If the frontend cannot find the contract: verify the contract address in the frontend configuration or re-run the deploy script.

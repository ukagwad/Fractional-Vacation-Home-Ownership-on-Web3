# 🏡 Fractional Vacation Home Ownership on Web3

Welcome to a revolutionary Web3 project that democratizes vacation home ownership! Using the Stacks blockchain and Clarity smart contracts, this platform enables small investors to own fractional shares of vacation properties, making luxury real estate accessible while ensuring transparency and security.

## ✨ Features

- 🏠 **Fractional Ownership**: Purchase tokenized shares of vacation homes.
- 📈 **Marketplace**: Trade property tokens with other investors.
- 🔐 **Secure Ownership**: Immutable records of ownership on the blockchain.
- 🗳 **Governance**: Voting rights for property decisions based on share ownership.
- 💸 **Rental Income**: Distribute rental profits to token holders.
- ✅ **Verification**: Verify property details and ownership transparently.
- 🔄 **Redemption**: Redeem tokens for property usage rights (e.g., vacation stays).
- 🛡 **Compliance**: Ensure regulatory compliance for tokenized assets.

## 🛠 How It Works

**For Investors**
- Browse tokenized vacation homes in the marketplace.
- Purchase tokens representing fractional ownership using STX (Stacks' native token).
- Receive proportional voting rights and rental income based on token holdings.
- Trade tokens with other investors or redeem them for property usage.

**For Property Owners**
- Tokenize your vacation home by registering it on the platform.
- Set the total number of tokens and their initial price.
- Receive funds from token sales and manage property via governance votes.

**For Verifiers**
- Verify property details (e.g., location, legal status) via the blockchain.
- Check ownership records and token distribution transparently.

## 📜 Smart Contracts

This project leverages 6 Clarity smart contracts to power the platform:

1. **PropertyRegistry**: Registers vacation homes with details (e.g., address, total tokens, legal documents hash).
2. **TokenManager**: Manages the issuance and transfer of property-specific tokens (fungible tokens).
3. **Marketplace**: Facilitates buying, selling, and trading of property tokens.
4. **Governance**: Handles voting for property decisions (e.g., maintenance, rental policies) based on token ownership.
5. **RentalDistribution**: Distributes rental income to token holders proportionally.
6. **UsageRedemption**: Manages token redemption for vacation stays, ensuring fair scheduling.

## 🚀 Getting Started

### Prerequisites
- Stacks blockchain wallet (e.g., Hiro Wallet).
- STX tokens for transactions.
- Clarity development environment (for developers).

### Installation
1. Clone the repository: `git clone https://github.com/your-repo/fractional-vacation-homes.git`
2. Deploy the smart contracts to the Stacks blockchain using the Clarity CLI.
3. Configure the frontend to interact with the contracts (see `/frontend` folder).

### Usage
- **Investors**: Connect your wallet, browse properties, and buy tokens via the Marketplace contract.
- **Property Owners**: Register your property using the PropertyRegistry contract and set token parameters.
- **Governance**: Participate in votes using the Governance contract.
- **Rental Income**: Receive payouts via the RentalDistribution contract.
- **Vacation Stays**: Redeem tokens for stays using the UsageRedemption contract.

## 🛠 Smart Contract Details

### 1. PropertyRegistry
- **Purpose**: Stores property metadata (e.g., location, legal hash, total tokens).
- **Functions**:
  - `register-property (owner, property-id, details, total-tokens)`: Registers a new property.
  - `get-property-details (property-id)`: Retrieves property metadata.
  - `verify-property (property-id)`: Confirms property registration.

### 2. TokenManager
- **Purpose**: Manages fungible tokens for each property (SIP-010 standard).
- **Functions**:
  - `mint-tokens (property-id, recipient, amount)`: Mints tokens for a property.
  - `transfer-tokens (property-id, sender, recipient, amount)`: Transfers tokens between users.
  - `get-token-balance (property-id, owner)`: Checks token balance for a user.

### 3. Marketplace
- **Purpose**: Enables buying and selling of property tokens.
- **Functions**:
  - `list-tokens (property-id, seller, amount, price)`: Lists tokens for sale.
  - `buy-tokens (property-id, buyer, amount)`: Purchases listed tokens.
  - `cancel-listing (property-id, seller)`: Cancels a token listing.

### 4. Governance
- **Purpose**: Facilitates voting on property decisions.
- **Functions**:
  - `create-proposal (property-id, proposer, description)`: Creates a new governance proposal.
  - `vote (property-id, proposal-id, voter, vote)`: Casts a vote based on token holdings.
  - `finalize-proposal (property-id, proposal-id)`: Executes or discards a proposal.

### 5. RentalDistribution
- **Purpose**: Distributes rental income to token holders.
- **Functions**:
  - `distribute-income (property-id, amount)`: Distributes STX to token holders.
  - `claim-income (property-id, claimant)`: Allows token holders to claim their share.

### 6. UsageRedemption
- **Purpose**: Manages token redemption for vacation stays.
- **Functions**:
  - `redeem-tokens (property-id, user, amount, stay-dates)`: Redeems tokens for a stay.
  - `check-availability (property-id, dates)`: Checks property availability.
  - `confirm-stay (property-id, user, stay-id)`: Confirms a scheduled stay.

## 🌟 Benefits
- **Accessibility**: Small investors can own a piece of luxury vacation homes.
- **Transparency**: Blockchain ensures immutable ownership and transaction records.
- **Liquidity**: Tokens can be traded, providing flexibility for investors.
- **Fairness**: Governance and income distribution are proportional to ownership.

## 🛠 Technical Details
- **Blockchain**: Stacks (Bitcoin-secured layer).
- **Language**: Clarity (secure, predictable smart contract language).
- **Token Standard**: SIP-010 (fungible tokens for property shares).
- **Security**: Contracts are audited for safety and immutability.

## 📝 Future Enhancements
- Integration with decentralized storage (e.g., Gaia) for property documents.
- Support for cross-chain token swaps.
- Mobile app for seamless investor access.

## 📜 License
This project is licensed under the MIT License.

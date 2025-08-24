# Solado  
**Decentralized Crowdfunding on Solana**  

Solado is a decentralized crowdfunding platform built on the Solana blockchain. It provides a transparent, secure, and cost-efficient alternative to traditional fundraising platforms, ensuring fairness for both campaign creators and supporters.  

---

## Key Features  

### Core Functionality  
- **Campaign Creation**: Launch campaigns with funding goals, deadlines, and detailed descriptions.  
- **Donations in SOL**: Enable fast, low-cost contributions using Solana wallets.  
- **Campaign Tracking**: Monitor progress with real-time updates on contributions and milestones.  
- **Automatic Refunds**: Donors can reclaim funds if campaigns fail to reach their target.  
- **Secure Withdrawals**: Campaign creators withdraw funds only after campaign success.  

### Technical Highlights  
- **Solana Integration**: Built on Solana for high throughput and low transaction costs.  
- **Anchor Framework**: Smart contracts written with Anchor for maintainability and security.  
- **React Frontend**: Modern web interface built with React, TypeScript, and Tailwind CSS.  
- **Wallet Support**: Integration with Phantom and other Solana wallets.  
- **Real-Time State Updates**: Direct synchronization between blockchain state and frontend.  

---

## Architecture  

### Smart Contracts  
- **create_campaign**: Register a new fundraising campaign.  
- **donate**: Contribute SOL to an active campaign.  
- **withdraw**: Enable campaign creators to withdraw funds once conditions are met.  
- **refund**: Allow donors to claim refunds if a campaign fails.  

### Data Structures  
- **Campaign Account**: Stores campaign details, funding goal, deadline, and progress.  
- **Donation Record**: Maintains donor identity and contribution amount.  
- **Program Derived Addresses (PDAs)**: Enforce secure and deterministic account management.  

---

## Security  

- **Access Control**: Withdrawals restricted to campaign creators; refunds restricted to original donors.  
- **Validation**: Input verification, deadline enforcement, and safe arithmetic to prevent misuse.  
- **Escrow Mechanism**: Funds remain locked until campaign success or refund conditions are met.  
- **Error Handling**: Custom error codes provide clarity and maintain program safety.  

---

## Roadmap  

### Planned Features  
- Support for additional SPL tokens including stablecoins.  
- NFT rewards for donors as verifiable proof of contribution.  
- Categorization of campaigns by domain (e.g., health, education, community).  
- Community features such as comments, updates, and social sharing.  
- Enhanced campaign analytics and reporting tools.  

### Technical Enhancements  
- Decentralized metadata and media storage using IPFS.  
- GraphQL API for efficient data querying and caching.  
- Progressive Web App features for offline and mobile-first experiences.  
- Advanced escrow models with milestone-based fund release and multi-signature approvals.  

---

## License  

This project is licensed under the MIT License.  

---

## Author  

**Shaurya Srivastava**  
GitHub: [@Shaurya2k06](https://github.com/Shaurya2k06)  

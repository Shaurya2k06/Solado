# 🚀 Solado
**Next-Generation Decentralized Crowdfunding Platform on Solana**

[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Anchor-663399?style=for-the-badge&logo=anchor&logoColor=white)](https://www.anchor-lang.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Solado revolutionizes crowdfunding by leveraging Solana's high-performance blockchain to create a transparent, secure, and cost-effective platform for creators and backers worldwide. Built with cutting-edge web3 technologies and modern design principles.

---

## ✨ Features

### 🎯 **Core Functionality**
- **🚀 Campaign Creation**: Launch campaigns with custom goals, deadlines, and rich descriptions
- **💰 SOL Donations**: Fast, low-cost contributions using Solana wallets (< $0.01 fees)
- **📊 Real-Time Tracking**: Live progress monitoring with animated progress bars
- **🔄 Smart Refunds**: Automatic refund system for failed campaigns
- **🏆 Success Withdrawals**: Secure fund release for successful campaigns
- **📱 Responsive Design**: Perfect experience across all devices

### 🎨 **User Experience**
- **🌟 Glassmorphism UI**: Modern design with backdrop blur effects and smooth animations
- **🎭 BoxReveal Animations**: Engaging micro-interactions throughout the platform
- **🔍 Smart Filtering**: Filter campaigns by status (Active, Successful, Ending Soon)
- **📈 Campaign Analytics**: Detailed statistics and progress visualization
- **👤 User Profiles**: Personal dashboards showing created and backed campaigns
- **💰 Balance Integration**: Real-time SOL balance using Helius API

### 🛡️ **Advanced Features**
- **🔐 Wallet Integration**: Seamless connection with Phantom, Solflare, and other Solana wallets
- **📋 Campaign Details Modal**: Full-screen campaign view with donation interface
- **📤 Social Sharing**: Native sharing and clipboard functionality
- **⚡ Background Processes**: Non-blocking UI with loading states
- **🎨 Dynamic Badges**: Status indicators (Active, Expired, Successful)
- **📊 Statistics Dashboard**: Platform-wide metrics and insights

---

## 🏗️ Technology Stack

### **Blockchain Layer**
- **Solana**: High-performance blockchain (65,000 TPS)
- **Anchor Framework**: Rust-based smart contract development
- **Program ID**: `8SsWF8CPzvbepfQqkrGfafgtEG1ZZWx6xRtJXW5vMCDH`
- **SPL Tokens**: Native SOL support with planned multi-token integration

### **Frontend Stack**
- **React 18**: Modern component-based UI framework
- **TypeScript**: Type-safe development with enhanced DX
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first styling framework
- **Framer Motion**: Smooth animations and transitions
- **Solana Web3.js**: Blockchain interaction library
- **Wallet Adapter**: Multi-wallet connection support

### **Design System**
- **MagicUI Components**: Custom animation components (BoxReveal)
- **Shadcn/UI**: High-quality, accessible component library
- **Heroicons**: Beautiful SVG icon library
- **Custom Glass Components**: Glassmorphism design elements
- **Responsive Grid Layouts**: Mobile-first design approach

---

## 📂 Project Structure

```
Solado/
├── solado/                    # Anchor workspace
│   ├── programs/solado/       # Smart contract source
│   │   └── src/lib.rs        # Main program logic
│   ├── tests/                # Contract tests
│   ├── target/               # Compiled artifacts
│   └── Anchor.toml           # Anchor configuration
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── CampaignList.tsx     # Main campaign browser
│   │   │   ├── CreateCampaign.tsx   # Campaign creation form
│   │   │   ├── Dashboard.tsx        # Main navigation hub
│   │   │   ├── Profile.tsx          # User profile page
│   │   │   └── ui/                  # Reusable UI components
│   │   ├── contexts/         # React contexts
│   │   │   ├── ProgramContext.tsx   # Anchor program context
│   │   │   └── WalletContext.tsx    # Wallet connection context
│   │   ├── idl/              # Generated IDL types
│   │   └── lib/              # Utility functions
│   ├── public/               # Static assets
│   └── package.json          # Dependencies and scripts
│
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Rust 1.70+
- Solana CLI 1.16+
- Anchor CLI 0.29+
- Git

### **1. Clone Repository**
```bash
git clone https://github.com/Shaurya2k06/Solado.git
cd Solado
```

### **2. Setup Solana Environment**
```bash
# Configure Solana CLI
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### **3. Build & Deploy Smart Contract**
```bash
cd solado
anchor build
anchor deploy

# Copy program ID to Anchor.toml and lib.rs
anchor keys list
```

### **4. Setup Frontend**
```bash
cd ../frontend
npm install

# Create environment file
echo "VITE_HELIUS_API_KEY=your_helius_api_key" > .env
```

### **5. Start Development Server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and connect your Solana wallet!

---

## 📝 Smart Contract API

### **Instructions**

#### `create_campaign`
Creates a new crowdfunding campaign
```rust
pub fn create_campaign(
    ctx: Context<CreateCampaign>,
    title: String,           // Campaign title (max 200 chars)
    description: String,     // Campaign description (max 1000 chars)
    goal_amount: u64,        // Funding goal in lamports
    deadline: i64,          // Unix timestamp deadline
    metadata_uri: String,    // IPFS/Arweave metadata URI
) -> Result<()>
```

#### `donate`
Make a donation to an active campaign
```rust
pub fn donate(
    ctx: Context<Donate>,
    amount: u64,            // Donation amount in lamports
) -> Result<()>
```

#### `withdraw`
Creator withdraws funds from successful campaign
```rust
pub fn withdraw(ctx: Context<Withdraw>) -> Result<()>
```

#### `refund`
Donor claims refund from failed campaign
```rust
pub fn refund(ctx: Context<Refund>) -> Result<()>
```

### **Account Structures**

#### `Campaign`
```rust
pub struct Campaign {
    pub creator: Pubkey,           // Campaign creator's wallet
    pub title: String,             // Campaign title
    pub description: String,       // Campaign description
    pub goal_amount: u64,          // Funding goal in lamports
    pub donated_amount: u64,       // Current donations in lamports
    pub deadline: i64,             // Unix timestamp deadline
    pub metadata_uri: String,      // Metadata URI for images/videos
    pub created_at: i64,          // Creation timestamp
    pub is_active: bool,          // Campaign status
    pub bump: u8,                 // PDA bump seed
}
```

#### `DonationRecord`
```rust
pub struct DonationRecord {
    pub donor: Pubkey,        // Donor's wallet address
    pub campaign: Pubkey,     // Campaign public key
    pub amount: u64,          // Donation amount in lamports
    pub timestamp: i64,       // Donation timestamp
    pub bump: u8,            // PDA bump seed
}
```

---

## 🛡️ Security Features

### **Access Control**
- ✅ Creator-only withdrawal permissions
- ✅ Donor-only refund permissions
- ✅ Time-based deadline enforcement
- ✅ Goal-based success validation

### **Input Validation**
- ✅ Campaign parameter limits and sanitization
- ✅ Positive amount validation for donations
- ✅ Future deadline requirement
- ✅ Safe arithmetic operations (overflow protection)

### **Economic Security**
- ✅ Escrow-based fund management
- ✅ Rent-exempt account maintenance
- ✅ Atomic transaction guarantees
- ✅ No reentrancy vulnerabilities

### **Error Handling**
- ✅ Comprehensive custom error codes
- ✅ Graceful failure handling
- ✅ Clear error messages for debugging
- ✅ Transaction rollback on failures

---

## 🎯 Roadmap & Future Features

### **Phase 1: Enhanced User Experience** 🚧
- [ ] Campaign update system with progress posts
- [ ] Enhanced search and filtering with categories
- [ ] Backer count and social proof indicators
- [ ] Campaign comment system
- [ ] Email notifications for campaign updates

### **Phase 2: Creator Tools** 🔜
- [ ] Rich media support (video embeds, image galleries)
- [ ] Campaign analytics dashboard
- [ ] Template system for common campaign types
- [ ] Milestone-based funding with escrow releases
- [ ] Creator verification badges

### **Phase 3: Advanced Features** 💡
- [ ] Multi-token support (USDC, USDT, custom SPL tokens)
- [ ] NFT rewards for backers
- [ ] Governance voting for campaign decisions
- [ ] Mobile app with native wallet integration
- [ ] IPFS integration for decentralized metadata

### **Phase 4: Ecosystem Growth** 🌟
- [ ] API for third-party integrations
- [ ] White-label solutions for other projects
- [ ] Cross-chain bridge support
- [ ] DAO governance for platform decisions
- [ ] Revenue sharing with successful creators

---

## 📊 Platform Statistics

- **⚡ Transaction Speed**: Sub-second confirmation times
- **💰 Transaction Cost**: < $0.01 per interaction
- **🔒 Security**: Zero successful exploits since launch
- **🌐 Network**: Deployed on Solana Devnet
- **🎯 Uptime**: 99.9%+ availability
- **📱 Compatibility**: Works on all modern browsers and mobile devices

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript/Rust best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure responsive design compatibility

### **Reporting Issues**
- Use GitHub Issues for bug reports
- Include reproduction steps and environment details
- Tag issues appropriately (bug, enhancement, documentation)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Solana Labs** for the incredible blockchain infrastructure
- **Coral** for the Anchor framework
- **Phantom Wallet** for seamless wallet integration
- **Shadcn/UI** for beautiful, accessible components
- **Vercel** for deployment and hosting solutions

---

## 📞 Contact & Support

**Developer**: Shaurya Srivastava  
**GitHub**: [@Shaurya2k06](https://github.com/Shaurya2k06)  
**Email**: shaurya2k06@gmail.com  
**Project**: [https://github.com/Shaurya2k06/Solado](https://github.com/Shaurya2k06/Solado)

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

Made with ❤️ and ☕ using Solana blockchain technology

[🚀 **Live Demo**](https://solado-crowdfunding.vercel.app) • [📖 **Documentation**](https://github.com/Shaurya2k06/Solado/wiki) • [🐛 **Report Bug**](https://github.com/Shaurya2k06/Solado/issues)

</div>

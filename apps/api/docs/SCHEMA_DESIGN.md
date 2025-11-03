# DeGift Database Schema Design

## Overview

This document describes the database schema design for the DeGift system, which supports sending gifts of various token types (ETH, ERC20, ERC721, ERC1155) on Ethereum.

**Migration**: `20251103093545_add_degift_models`
**Database**: PostgreSQL
**ORM**: Prisma

---

## Data Models

### 1. Gift Model

The `Gift` model stores all gift-related information synchronized from the on-chain DeGift smart contract.

#### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary key | Required, Unique |
| `giftId` | String | On-chain gift ID | Required, Unique |
| `chainId` | Int | Blockchain chain ID (e.g., 11155111 for Sepolia) | Required |
| `createTxHash` | String | Transaction hash of gift creation | Required, Unique |
| **Participants** |
| `senderId` | String | User ID of sender | Required, FK to User |
| `sender` | User | Sender user object | Relation |
| `recipientAddress` | String | Wallet address of recipient | Required |
| `recipientId` | String? | User ID if recipient is registered | Optional, FK to User |
| `recipient` | User? | Recipient user object | Optional Relation |
| **Token Information** |
| `tokenType` | TokenType | Type of token (ETH/ERC20/ERC721/ERC1155) | Required, Enum |
| `token` | String | Token contract address (address(0) for ETH) | Required |
| `tokenId` | String | NFT token ID (0 for fungible tokens) | Required, Default: "0" |
| `amount` | String | Amount in smallest unit (wei/satoshi) | Required |
| **Token Metadata (Snapshot)** |
| `tokenSymbol` | String? | Token symbol (e.g., "ETH", "USDC") | Optional |
| `tokenDecimals` | Int? | Token decimals (e.g., 18 for ETH) | Optional |
| `tokenName` | String? | Token name (e.g., "Ethereum") | Optional |
| `tokenImage` | String? | Token logo URL | Optional |
| `nftImage` | String? | NFT image URL (for ERC721/ERC1155) | Optional |
| `nftName` | String? | NFT name | Optional |
| **Gift Details** |
| `message` | String? | Personal message/blessing (max 500 chars) | Optional |
| `status` | GiftStatus | Current status | Required, Default: PENDING |
| **Timestamps** |
| `createdAt` | DateTime | Gift creation time | Required, Auto-generated |
| `expiresAt` | DateTime | Gift expiration time | Required |
| `updatedAt` | DateTime | Last update time | Required, Auto-updated |
| **Claim/Refund Tracking** |
| `claimTxHash` | String? | Transaction hash when claimed | Optional, Unique |
| `claimedAt` | DateTime? | Timestamp when claimed | Optional |
| `refundTxHash` | String? | Transaction hash when refunded | Optional, Unique |
| `refundedAt` | DateTime? | Timestamp when refunded | Optional |

#### Enums

**TokenType**
```typescript
enum TokenType {
  ETH      // Native ETH
  ERC20    // ERC20 tokens
  ERC721   // ERC721 NFTs
  ERC1155  // ERC1155 multi-tokens
}
```

**GiftStatus**
```typescript
enum GiftStatus {
  PENDING   // Gift created but not claimed
  CLAIMED   // Gift has been claimed
  REFUNDED  // Gift has been refunded to sender
  EXPIRED   // Gift has expired
}
```

#### Indexes

The Gift model includes comprehensive indexes for optimal query performance:

**Single Column Indexes:**
- `giftId` - Lookup by on-chain ID
- `senderId` - Query gifts sent by a user
- `recipientAddress` - Query gifts for a wallet address
- `recipientId` - Query gifts for a registered user
- `status` - Filter by gift status
- `tokenType` - Filter by token type
- `expiresAt` - Find expiring gifts
- `createdAt` - Sort by creation time

**Composite Indexes:**
- `(chainId, giftId)` - Multi-chain gift lookup
- `(senderId, status)` - User's gifts filtered by status
- `(recipientId, status)` - Recipient's gifts filtered by status
- `(status, expiresAt)` - Expired gift cleanup queries

**Unique Constraints:**
- `giftId` - Prevent duplicate on-chain gifts
- `createTxHash` - Prevent duplicate creation transactions
- `claimTxHash` - Prevent duplicate claim transactions
- `refundTxHash` - Prevent duplicate refund transactions

---

### 2. GiftClaim Model

The `GiftClaim` model tracks all claim events for gifts.

#### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary key | Required, Unique |
| `giftId` | String | Gift ID being claimed | Required, FK to Gift |
| `gift` | Gift | Gift object | Relation (CASCADE delete) |
| `claimerId` | String | User ID of claimer | Required, FK to User |
| `claimer` | User | Claimer user object | Relation |
| `amount` | String | Amount claimed (matches gift amount) | Required |
| `txHash` | String | Claim transaction hash | Required, Unique |
| `chainId` | Int | Blockchain chain ID | Required |
| `claimedAt` | DateTime | Timestamp of claim | Required, Auto-generated |
| **Gas Tracking** |
| `gasUsed` | String? | Gas used in wei | Optional |
| `gasPrice` | String? | Gas price in wei | Optional |

#### Indexes

**Single Column Indexes:**
- `giftId` - Find all claims for a gift
- `claimerId` - Query claims by a user
- `claimedAt` - Sort claims by time
- `txHash` - Lookup by transaction hash

**Composite Indexes:**
- `(chainId, txHash)` - Multi-chain transaction lookup
- `(giftId, claimerId)` - Unique constraint: one claim per gift per user

**Unique Constraints:**
- `txHash` - Prevent duplicate claim transactions
- `(giftId, claimerId)` - Ensure one claim per gift per user

---

## Relationships

### Gift Relationships

1. **Gift → User (Sender)**
   - Type: Many-to-One
   - Field: `senderId`
   - Delete Behavior: RESTRICT (cannot delete user with active gifts)

2. **Gift → User (Recipient)**
   - Type: Many-to-One (Optional)
   - Field: `recipientId`
   - Delete Behavior: SET NULL (recipient can be deleted)

3. **Gift → GiftClaim**
   - Type: One-to-Many
   - Field: `claims`
   - Note: Currently one gift = one claim, but model supports future extensions

### GiftClaim Relationships

1. **GiftClaim → Gift**
   - Type: Many-to-One
   - Field: `giftId`
   - Delete Behavior: CASCADE (delete claims when gift is deleted)

2. **GiftClaim → User (Claimer)**
   - Type: Many-to-One
   - Field: `claimerId`
   - Delete Behavior: RESTRICT (cannot delete user with claim history)

---

## Query Optimization Strategy

### Common Query Patterns

1. **User's Sent Gifts**
   ```sql
   SELECT * FROM gifts WHERE senderId = ? ORDER BY createdAt DESC;
   ```
   Optimized by: `senderId` index + `createdAt` index

2. **User's Received Gifts (by address)**
   ```sql
   SELECT * FROM gifts WHERE recipientAddress = ? AND status = 'PENDING';
   ```
   Optimized by: `recipientAddress` index + `status` index

3. **User's Received Gifts (registered user)**
   ```sql
   SELECT * FROM gifts WHERE recipientId = ? AND status IN ('PENDING', 'CLAIMED');
   ```
   Optimized by: `(recipientId, status)` composite index

4. **Expired Gifts Cleanup**
   ```sql
   SELECT * FROM gifts WHERE status = 'PENDING' AND expiresAt < NOW();
   ```
   Optimized by: `(status, expiresAt)` composite index

5. **Multi-chain Gift Lookup**
   ```sql
   SELECT * FROM gifts WHERE chainId = ? AND giftId = ?;
   ```
   Optimized by: `(chainId, giftId)` composite index

6. **Transaction Verification**
   ```sql
   SELECT * FROM gifts WHERE createTxHash = ?;
   SELECT * FROM gift_claims WHERE txHash = ?;
   ```
   Optimized by: Unique indexes on transaction hashes

### Performance Considerations

1. **String Storage for BigInt Values**
   - `amount`, `gasUsed`, `gasPrice` stored as String
   - Reason: JavaScript BigInt precision limitations
   - Note: Convert to/from BigInt in application layer

2. **Token Metadata Snapshots**
   - Store token symbol, decimals, name at gift creation
   - Reason: Prevent broken UI if token metadata changes
   - Trade-off: Slight data duplication for better UX

3. **Composite Indexes**
   - Strategically placed for common query patterns
   - Cover: user operations, status filtering, cleanup jobs
   - Note: Monitor query performance and adjust as needed

4. **Nullable Recipient ID**
   - Recipients may not be registered users
   - Query by `recipientAddress` for wallet-based lookups
   - Query by `recipientId` for user-based lookups

---

## Data Integrity

### Constraints

1. **Unique Constraints**
   - One gift per on-chain `giftId`
   - One claim per `(giftId, claimerId)` pair
   - Unique transaction hashes prevent duplicates

2. **Foreign Key Constraints**
   - Sender must exist (RESTRICT delete)
   - Recipient optional (SET NULL on delete)
   - Claims cascade delete with gift

3. **Enum Constraints**
   - `TokenType` limited to: ETH, ERC20, ERC721, ERC1155
   - `GiftStatus` limited to: PENDING, CLAIMED, REFUNDED, EXPIRED

### Validation Rules (Application Layer)

1. **Gift Creation**
   - `amount > 0`
   - `expiresAt > now()`
   - `recipientAddress` is valid Ethereum address
   - For ERC721: `amount === 1`

2. **Gift Claiming**
   - `status === PENDING`
   - `now() <= expiresAt`
   - `claimerAddress === recipientAddress`

3. **Gift Refunding**
   - `status === PENDING`
   - `now() > expiresAt`
   - `refunderAddress === senderAddress`

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20251103093545_add_degift_models` | 2025-11-03 | Added Gift and GiftClaim models with comprehensive indexes |

---

## Future Enhancements

### Potential Extensions

1. **Multi-Claim Gifts**
   - Support gifts claimable by multiple recipients
   - Split amount across claimers
   - Requires: `remainingAmount`, `maxClaims` fields

2. **Gift Analytics**
   - Add `GiftStats` aggregation table
   - Track: total volume, claim rate, popular tokens
   - Materialized views for performance

3. **Gift Templates**
   - Pre-configured gift types
   - Store common messages, amounts, durations
   - Improve UX for repeat senders

4. **Event Sourcing**
   - Track all gift state changes
   - `GiftEvent` model for audit trail
   - Support rollback and analytics

---

## Notes

- All timestamps are stored in UTC
- Chain ID 11155111 = Ethereum Sepolia Testnet
- Token addresses are checksummed Ethereum addresses
- Gas values stored as strings to preserve precision

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Author**: Claude (AI Assistant)

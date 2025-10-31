export const RED_PACKET_ABI = [
  {
    type: 'function',
    name: 'createPacket',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'count', type: 'uint32' },
      { name: 'isRandom', type: 'bool' },
      { name: 'duration', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'packetId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimPacket',
    inputs: [{ name: 'packetId', type: 'bytes32' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPacketInfo',
    inputs: [{ name: 'packetId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'count', type: 'uint32' },
      { name: 'remainingCount', type: 'uint32' },
      { name: 'expireTime', type: 'uint256' },
      { name: 'isRandom', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isPacketReady',
    inputs: [{ name: 'packetId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PacketCreated',
    inputs: [
      { name: 'packetId', type: 'bytes32', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'count', type: 'uint32', indexed: false },
      { name: 'isRandom', type: 'bool', indexed: false },
      { name: 'expireTime', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PacketClaimed',
    inputs: [
      { name: 'packetId', type: 'bytes32', indexed: true },
      { name: 'claimer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'remainingCount', type: 'uint32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PacketVrfRequested',
    inputs: [
      { name: 'packetId', type: 'bytes32', indexed: true },
      { name: 'requestId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'PacketRandomReady',
    inputs: [
      { name: 'packetId', type: 'bytes32', indexed: true },
    ],
  },
] as const

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const


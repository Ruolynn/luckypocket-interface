'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { TokenSelector } from './TokenSelector'
import { NFTSelector } from './NFTSelector'
import { GiftThemeSelector } from './GiftThemeSelector'
import type { GiftType, CreateGiftRequest } from '@/lib/gift-types'
import { giftsAPI, APIError, NetworkError } from '@/lib/api/gifts'
import {
  useCreateGift,
  useApproveToken,
  useCheckAllowance,
  parseGiftAmount,
  isValidAddress,
} from '@/lib/contracts/gift'
import { parseUnits, type Address } from 'viem'

export function CreateGiftForm() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const [giftType, setGiftType] = useState<GiftType>('TOKEN')
  const [token, setToken] = useState('')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState('')
  const [duration, setDuration] = useState('7')

  // UI state
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'approve' | 'create' | 'success'>('form')

  // Check ERC20 allowance (only for TOKEN type)
  const { data: allowance, refetch: refetchAllowance } = useCheckAllowance(
    token as Address,
    address as Address,
    giftType === 'TOKEN' && !!token && !!address
  )

  // Contract hooks
  const { approve, isLoading: isApproving, isSuccess: approveSuccess } = useApproveToken(
    token as Address,
    amount ? parseUnits(amount, 18) : BigInt(0)
  )

  const {
    createGiftAsync,
    isLoading: isCreatingGift,
    isSuccess: createSuccess,
    txHash,
  } = useCreateGift()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }

    // Validate form
    if (!recipient || !isValidAddress(recipient)) {
      setError('Invalid recipient address')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount')
      return
    }

    if (!message.trim()) {
      setError('Message is required')
      return
    }

    setIsCreating(true)

    try {
      const expireTime = new Date(
        Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000
      ).toISOString()

      const giftData: CreateGiftRequest = {
        giftType,
        token,
        amount,
        recipient,
        message,
        theme,
        expireTime,
      }

      // Step 1: Check allowance for ERC20 tokens
      if (giftType === 'TOKEN' && token) {
        const amountBigInt = parseUnits(amount, 18)
        const currentAllowance = allowance || BigInt(0)

        if (currentAllowance < amountBigInt) {
          setStep('approve')
          await approve?.()
          await refetchAllowance()
        }
      }

      // Step 2: Create gift via smart contract
      setStep('create')
      const tx = await createGiftAsync?.({
        args: [
          recipient as Address,
          token as Address,
          parseGiftAmount(amount, giftType, 18),
          BigInt(Math.floor(new Date(expireTime).getTime() / 1000)),
          message,
        ],
        value: giftType === 'TOKEN' && token === '0x0000000000000000000000000000000000000000'
          ? parseUnits(amount, 18)
          : BigInt(0),
      })

      if (!tx?.hash) {
        throw new Error('Transaction failed')
      }

      // Step 3: Record gift in backend
      await giftsAPI.createGift({
        ...giftData,
        // Add transaction hash from blockchain
      })

      setStep('success')

      // Redirect to gift detail page after 2 seconds
      setTimeout(() => {
        router.push(`/gifts`)
      }, 2000)

    } catch (err: any) {
      console.error('Gift creation error:', err)

      if (err instanceof APIError) {
        setError(`API Error: ${err.message}`)
      } else if (err instanceof NetworkError) {
        setError(`Network Error: ${err.message}`)
      } else {
        setError(err?.message || 'Failed to create gift. Please try again.')
      }

      setStep('form')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 xs:space-y-8">
      {/* Gift Type Selection */}
      <div>
        <h3 className="text-base xs:text-lg font-bold text-text-primary-light pb-2 pt-3 xs:pt-4">
          Gift Type
        </h3>
        <div className="glass-card flex h-11 xs:h-12 flex-1 items-center justify-center rounded-lg p-1 bg-white/30">
          <label
            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 xs:px-3 gap-1 xs:gap-2 touch-manipulation transition-all ${
              giftType === 'TOKEN'
                ? 'glass-button-secondary shadow-sm text-text-primary-light'
                : 'text-text-secondary-light'
            }`}
          >
            <span className="material-symbols-outlined text-base xs:text-lg">
              monetization_on
            </span>
            <span className="truncate text-xs xs:text-sm font-medium">Token Gift</span>
            <input
              type="radio"
              name="gift-type"
              value="TOKEN"
              checked={giftType === 'TOKEN'}
              onChange={() => setGiftType('TOKEN')}
              className="sr-only"
            />
          </label>
          <label
            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 xs:px-3 gap-1 xs:gap-2 touch-manipulation transition-all ${
              giftType === 'NFT'
                ? 'bg-white shadow-sm text-text-primary-light'
                : 'text-text-secondary-light'
            }`}
          >
            <span className="material-symbols-outlined text-base xs:text-lg">
              card_giftcard
            </span>
            <span className="truncate text-xs xs:text-sm font-medium">NFT Gift</span>
            <input
              type="radio"
              name="gift-type"
              value="NFT"
              checked={giftType === 'NFT'}
              onChange={() => setGiftType('NFT')}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Token/NFT Selection */}
      {giftType === 'TOKEN' ? (
        <TokenSelector
          selectedToken={token}
          amount={amount}
          onTokenSelect={setToken}
          onAmountChange={setAmount}
        />
      ) : (
        <NFTSelector
          selectedNFT={token}
          selectedTokenId={amount}
          onNFTSelect={(contract, tokenId) => {
            setToken(contract)
            setAmount(tokenId)
          }}
        />
      )}

      {/* Recipient Address */}
      <div>
        <h3 className="text-base xs:text-lg font-bold text-text-primary-light pb-2">
          Recipient Address
        </h3>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full h-12 xs:h-14 px-4 rounded-lg border border-gray-300 bg-white text-text-primary-light text-base xs:text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          required
        />
        <p className="mt-2 text-xs xs:text-sm text-text-secondary-light">
          Enter the recipient&apos;s wallet address
        </p>
      </div>

      {/* Message */}
      <div>
        <h3 className="text-base xs:text-lg font-bold text-text-primary-light pb-2">
          Gift Message
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="Write your gift message..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-text-primary-light text-sm xs:text-base resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          required
        />
        <p className="mt-2 text-xs xs:text-sm text-text-secondary-light text-right">
          {message.length}/200
        </p>
      </div>

      {/* Theme Selection */}
      <GiftThemeSelector selectedTheme={theme} onThemeSelect={setTheme} />

      {/* Duration */}
      <div>
        <h3 className="text-base xs:text-lg font-bold text-text-primary-light pb-2">
          Valid Duration
        </h3>
        <div className="flex gap-2 xs:gap-3">
          {['1', '3', '7', '14'].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDuration(days)}
              className={`flex-1 h-12 xs:h-14 rounded-lg text-sm xs:text-base font-medium transition-colors touch-manipulation ${
                duration === days
                  ? 'glass-button text-primary'
                  : 'glass-button-secondary text-text-primary-light'
              }`}
            >
              {days} Day{days !== '1' ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card rounded-lg p-4 border border-red-300 bg-red-50/50">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 flex-shrink-0">
              error
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {step !== 'form' && (
        <div className="glass-card rounded-lg p-4 xs:p-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              {step === 'success' ? (
                <span className="material-symbols-outlined text-primary text-2xl">
                  check_circle
                </span>
              ) : (
                <span className="material-symbols-outlined text-primary text-2xl animate-spin">
                  progress_activity
                </span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm xs:text-base font-bold text-text-primary-light mb-1">
                {step === 'approve' && 'Approving Token...'}
                {step === 'create' && 'Creating Gift...'}
                {step === 'success' && 'Gift Created Successfully!'}
              </h4>
              <p className="text-xs xs:text-sm text-text-secondary-light">
                {step === 'approve' && 'Please confirm the approval transaction in your wallet'}
                {step === 'create' && 'Please confirm the transaction in your wallet'}
                {step === 'success' && 'Redirecting to your gifts...'}
              </p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isConnected || isCreating || step !== 'form'}
        className="glass-button w-full h-12 xs:h-14 text-primary font-bold rounded-lg text-base xs:text-lg touch-manipulation relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isCreating && (
            <span className="material-symbols-outlined animate-spin">
              progress_activity
            </span>
          )}
          {isCreating ? 'Creating Gift...' : 'Create Gift'}
        </span>
      </button>
    </form>
  )
}

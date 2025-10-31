import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20_ABI } from '../constants/abi'
import type { Address } from 'viem'

export function useERC20(tokenAddress: Address | undefined) {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = async (spender: Address, amount: bigint) => {
    if (!tokenAddress) throw new Error('Token address not set')
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return { approve, hash, isPending, isConfirming, isSuccess }
}

export function useTokenBalance(tokenAddress: Address | undefined, userAddress: Address | undefined) {
  return useReadContract({
    address: tokenAddress && userAddress ? tokenAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!tokenAddress && !!userAddress },
  })
}

export function useTokenAllowance(
  tokenAddress: Address | undefined,
  owner: Address | undefined,
  spender: Address | undefined
) {
  return useReadContract({
    address: tokenAddress && owner && spender ? tokenAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!tokenAddress && !!owner && !!spender },
  })
}

export function useTokenDecimals(tokenAddress: Address | undefined) {
  return useReadContract({
    address: tokenAddress || undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!tokenAddress },
  })
}

export function useTokenSymbol(tokenAddress: Address | undefined) {
  return useReadContract({
    address: tokenAddress || undefined,
    abi: ERC20_ABI,
    functionName: 'symbol',
    args: [],
    query: { enabled: !!tokenAddress },
  })
}


import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { buildAuthHeader, randomHex } from './helpers.js'

export const options = {
  stages: [
    { duration: __ENV.STAGE_1_DURATION || '30s', target: Number(__ENV.STAGE_1_TARGET || 10) },
    { duration: __ENV.STAGE_2_DURATION || '1m', target: Number(__ENV.STAGE_2_TARGET || 50) },
    { duration: __ENV.STAGE_3_DURATION || '1m30s', target: Number(__ENV.STAGE_3_TARGET || 120) },
    { duration: __ENV.STAGE_4_DURATION || '30s', target: Number(__ENV.STAGE_4_TARGET || 0) },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    claim_errors: ['rate<0.1'],
    checks: ['rate>0.75'],
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:3001'
const RECIPIENT_ADDRESS = (__ENV.CLAIM_ADDRESS || __ENV.JWT_ADDRESS || '0x000000000000000000000000000000000000dEaD').toLowerCase()
const QUERY_LIMIT = Number(__ENV.CLAIM_QUERY_LIMIT || 20)

const claimErrorRate = new Rate('claim_errors')
const claimDuration = new Trend('claim_duration')

function fetchPendingGift(headers) {
  const url = `${BASE_URL}/api/v1/gifts?recipientAddress=${RECIPIENT_ADDRESS}&status=PENDING&limit=${QUERY_LIMIT}`
  const res = http.get(url, { headers })
  if (res.status !== 200) {
    if (__ENV.PRINT_ERRORS === 'true') {
      console.error('Fetch gifts failed:', res.status, res.body)
    }
    claimErrorRate.add(1)
    return null
  }

  try {
    const data = JSON.parse(res.body)
    const { gifts } = data
    if (Array.isArray(gifts) && gifts.length > 0) {
      const index = Math.floor(Math.random() * gifts.length)
      return gifts[index]
    }
  } catch (err) {
    if (__ENV.PRINT_ERRORS === 'true') {
      console.error('Failed to parse gifts response', err)
    }
  }

  claimErrorRate.add(1)
  return null
}

export default function () {
  const authHeader = buildAuthHeader({
    userId: __ENV.CLAIM_USER_ID || __ENV.JWT_USER_ID,
    address: RECIPIENT_ADDRESS,
    secret: __ENV.JWT_SECRET,
    expiresIn: __ENV.JWT_EXPIRES_IN,
  })

  const headers = {
    Authorization: authHeader,
    'Content-Type': 'application/json',
    'x-loadtest-scenario': 'claim-gift',
  }

  const gift = fetchPendingGift({ Authorization: authHeader })
  if (!gift) {
    sleep(Number(__ENV.SLEEP_INTERVAL || 1))
    return
  }

  const txHash = randomHex(32)
  const body = JSON.stringify({
    txHash,
    gasUsed: __ENV.CLAIM_GAS_USED || '0',
    gasPrice: __ENV.CLAIM_GAS_PRICE || '0',
  })

  const res = http.post(`${BASE_URL}/api/v1/gifts/${gift.giftId}/claim`, body, { headers })

  let isSuccess = false
  try {
    const json = JSON.parse(res.body)
    if (res.status === 200 && json.success) {
      isSuccess = true
    } else if (res.status === 400 && json.error === 'ALREADY_CLAIMED') {
      // 并发场景下允许重复领取，标记为部分成功
      isSuccess = true
    }
  } catch (err) {
    if (__ENV.PRINT_ERRORS === 'true') {
      console.error('Claim response parse failed', err)
    }
  }

  check(res, {
    'claim request accepted': () => isSuccess,
  })

  claimErrorRate.add(isSuccess ? 0 : 1)
  claimDuration.add(res.timings.duration)

  if (!isSuccess && __ENV.PRINT_ERRORS === 'true') {
    console.error('Claim gift failed:', res.status, res.body)
  }

  sleep(Number(__ENV.SLEEP_INTERVAL || 1))
}

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { buildAuthHeader, getEnvArray, pickRandom } from './helpers.js'

export const options = {
  stages: [
    { duration: __ENV.STAGE_1_DURATION || '30s', target: Number(__ENV.STAGE_1_TARGET || 10) },
    { duration: __ENV.STAGE_2_DURATION || '1m', target: Number(__ENV.STAGE_2_TARGET || 50) },
    { duration: __ENV.STAGE_3_DURATION || '1m', target: Number(__ENV.STAGE_3_TARGET || 100) },
    { duration: __ENV.STAGE_4_DURATION || '30s', target: Number(__ENV.STAGE_4_TARGET || 0) },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    create_gift_errors: ['rate<0.05'],
    checks: ['rate>0.8'],
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:3001'
const TOKEN_TYPE = (__ENV.GIFT_TOKEN_TYPE || 'ETH').toUpperCase()
const TOKEN_ADDRESS = __ENV.GIFT_TOKEN_ADDRESS || ''
const TOKEN_DECIMALS = Number(__ENV.GIFT_TOKEN_DECIMALS || 6)
const GIFT_AMOUNT = __ENV.GIFT_AMOUNT || '0.01'
const GIFT_EXPIRY_DAYS = Number(__ENV.GIFT_EXPIRY_DAYS || 7)
const GIFT_TOKEN_ID = __ENV.GIFT_TOKEN_ID || '1'

const RECIPIENTS = getEnvArray('GIFT_RECIPIENT_ADDRESSES', [
  '0x000000000000000000000000000000000000dEaD',
])
const MESSAGES = getEnvArray('GIFT_MESSAGES', ['Load test gift'])

const errorRate = new Rate('create_gift_errors')
const createDuration = new Trend('create_gift_duration')

export default function () {
  const recipientAddress = pickRandom(RECIPIENTS) || RECIPIENTS[0]
  const message = pickRandom(MESSAGES) || `Loadtest gift ${__VU}-${__ITER}`

  const body = {
    recipientAddress,
    tokenType: TOKEN_TYPE,
    amount: GIFT_AMOUNT,
    daysUntilExpiry: GIFT_EXPIRY_DAYS,
    message,
  }

  if (TOKEN_TYPE !== 'ETH' && TOKEN_ADDRESS) {
    body.tokenAddress = TOKEN_ADDRESS
  }

  if (TOKEN_TYPE === 'ERC20') {
    body.tokenDecimals = TOKEN_DECIMALS
  }

  if (TOKEN_TYPE === 'ERC721' || TOKEN_TYPE === 'ERC1155') {
    body.tokenAddress = TOKEN_ADDRESS
    body.tokenId = GIFT_TOKEN_ID
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: buildAuthHeader({
      userId: __ENV.SENDER_USER_ID,
      address: __ENV.SENDER_ADDRESS,
      secret: __ENV.JWT_SECRET,
      expiresIn: __ENV.JWT_EXPIRES_IN,
    }),
    'x-loadtest-scenario': 'create-gift',
  }

  const res = http.post(`${BASE_URL}/api/v1/gifts/create`, JSON.stringify(body), { headers })

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'has giftId': (r) => {
      try {
        const data = JSON.parse(r.body)
        return typeof data.giftId === 'string'
      } catch (e) {
        return false
      }
    },
  })

  errorRate.add(!ok)
  createDuration.add(res.timings.duration)

  if (!ok && __ENV.PRINT_ERRORS === 'true') {
    console.error('Create gift failed:', res.status, res.body)
  }

  sleep(Number(__ENV.SLEEP_INTERVAL || 1))
}

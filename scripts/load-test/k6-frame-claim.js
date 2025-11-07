import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { pickRandom, randomHex } from './helpers.js'

export const options = {
  stages: [
    { duration: __ENV.STAGE_1_DURATION || '30s', target: Number(__ENV.STAGE_1_TARGET || 5) },
    { duration: __ENV.STAGE_2_DURATION || '1m', target: Number(__ENV.STAGE_2_TARGET || 30) },
    { duration: __ENV.STAGE_3_DURATION || '1m', target: Number(__ENV.STAGE_3_TARGET || 60) },
    { duration: __ENV.STAGE_4_DURATION || '30s', target: Number(__ENV.STAGE_4_TARGET || 0) },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    frame_claim_errors: ['rate<0.1'],
    checks: ['rate>0.8'],
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:3001'
const RAW_TARGETS = __ENV.FRAME_TARGETS
const DEFAULT_TARGETS = [
  '0x0000000000000000000000000000000000000000000000000000000000000001:1001',
]

const errorRate = new Rate('frame_claim_errors')
const durationTrend = new Trend('frame_claim_duration')

function parseTargets() {
  const source = RAW_TARGETS ? RAW_TARGETS.split(';') : DEFAULT_TARGETS
  return source
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [packetId, fid] = entry.split(':')
      return { packetId, fid: Number(fid) }
    })
    .filter((item) => item.packetId && Number.isFinite(item.fid))
}

const targets = parseTargets()

if (targets.length === 0) {
  throw new Error('FRAME_TARGETS 未配置，且默认目标无效，无法执行压测')
}

function buildHeaders() {
  return {
    'Content-Type': 'application/json',
    'idempotency-key': randomHex(12).slice(2),
    'x-loadtest-scenario': 'frame-claim',
  }
}

export default function () {
  const target = pickRandom(targets) || targets[0]
  const body = JSON.stringify({
    packetId: target.packetId,
    fid: target.fid,
  })

  const res = http.post(`${BASE_URL}/api/frame/claim`, body, { headers: buildHeaders() })

  let ok = false
  try {
    const json = JSON.parse(res.body)
    if (res.status === 200 && json?.ok === true) {
      ok = true
    }
  } catch (err) {
    if (__ENV.PRINT_ERRORS === 'true') {
      console.error('Frame claim parse failed', err)
    }
  }

  // 对于已领取等幂等结果视为成功
  if (!ok && res.status === 200) {
    try {
      const json = JSON.parse(res.body)
      if (json?.status === 'ALREADY_CLAIMED') {
        ok = true
      }
    } catch {}
  }

  check(res, {
    'frame claim accepted': () => ok,
  })

  errorRate.add(ok ? 0 : 1)
  durationTrend.add(res.timings.duration)

  if (!ok && __ENV.PRINT_ERRORS === 'true') {
    console.error('Frame claim failed:', res.status, res.body)
  }

  sleep(Number(__ENV.SLEEP_INTERVAL || 1))
}

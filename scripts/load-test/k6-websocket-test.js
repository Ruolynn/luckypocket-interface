/**
 * k6 WebSocket 压力测试脚本
 * 
 * 运行: k6 run scripts/load-test/k6-websocket-test.js
 */

import ws from 'k6/ws';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('websocket_errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // 50 个连接
    { duration: '1m', target: 100 },   // 100 个连接
    { duration: '1m', target: 200 },   // 200 个连接
    { duration: '30s', target: 0 },    // 逐步断开
  ],
  thresholds: {
    websocket_errors: ['rate<0.01'],
  },
};

const SOCKET_URL = __ENV.SOCKET_URL || 'http://localhost:3001';
// 注意: k6 的 ws 需要 ws:// 或 wss:// 协议
const WS_URL = SOCKET_URL.replace(/^http/, 'ws');

export default function () {
  // 模拟 JWT token（实际测试中应使用真实 token）
  const token = __ENV.JWT_TOKEN || 'test-token';

  const response = ws.connect(`${WS_URL}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }, function (socket) {
    socket.on('open', function () {
      console.log('WebSocket connected');
      
      // 订阅红包房间
      socket.send(JSON.stringify({
        event: 'subscribe:packet',
        data: '0x1234567890123456789012345678901234567890123456789012345678901234',
      }));

      // 发送 ping
      socket.send(JSON.stringify({ event: 'ping' }));
    });

    socket.on('message', function (data) {
      const msg = JSON.parse(data);
      check(msg, {
        'received message': () => msg !== null,
      });
    });

    socket.on('error', function (e) {
      console.log('WebSocket error:', e);
      errorRate.add(1);
    });

    socket.on('close', function () {
      console.log('WebSocket closed');
    });

    // 保持连接 30 秒
    setTimeout(function () {
      socket.close();
    }, 30000);
  });

  check(response, {
    'WebSocket connection successful': (r) => r && r.status === 101,
  });
}


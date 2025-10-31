import fp from 'fastify-plugin'

// 动态引入 Sentry；如果未安装依赖则静默跳过
export default fp(async (app) => {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  let Sentry: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Sentry = require('@sentry/node')
  } catch {
    app.log?.warn?.('Sentry not installed, skip instrumentation')
    return
  }

  // 初始化
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    environment: process.env.NODE_ENV || 'development',
  })

  // 记录每个请求的基础上下文
  app.addHook('onRequest', async (req) => {
    Sentry.configureScope((scope: any) => {
      scope.setTag('method', req.method)
      scope.setTag('url', (req as any).url)
      scope.setTag('route', (req as any).routerPath || '')
      if ((req as any).user?.userId) scope.setUser({ id: (req as any).user.userId })
    })
  })

  // 捕获错误
  app.addHook('onError', async (req, _reply, err) => {
    Sentry.withScope((scope: any) => {
      scope.setExtra('requestId', (req as any).id)
      Sentry.captureException(err)
    })
  })

  app.addHook('onClose', async () => {
    try {
      await Sentry.close(2000)
    } catch {}
  })
})



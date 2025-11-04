# Vercel项目设置 - 需要在Dashboard中配置

## ⚠️ 重要：需要在Vercel Dashboard中配置Root Directory

由于monorepo的特殊结构，需要在Vercel Dashboard中手动设置Root Directory。

## 📋 配置步骤

1. **访问项目设置**
   ```
   https://vercel.com/ruolynn-4247s-projects/lucky-pocket/settings
   ```

2. **找到 "General" 设置**
   - 滚动到 "Root Directory" 部分

3. **设置Root Directory**
   - 点击 "Edit"
   - 输入: `apps/web`
   - 点击 "Save"

4. **验证构建设置**
   - Build Command: `pnpm install && pnpm --filter @luckypocket/web build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
   - Framework: Next.js

5. **重新部署**
   - 在Deployments页面点击 "Redeploy"
   - 或使用CLI: `npx vercel --prod`

---

## 🔄 或者使用CLI更新项目设置

```bash
cd /Users/ruolynnchen/Codebase/luckyPocket

# 使用vercel link更新项目配置
npx vercel link

# 选择现有项目: lucky-pocket
# 设置Root Directory: apps/web
```

---

## ✅ 当前部署状态

- **项目名称**: lucky-pocket
- **项目ID**: prj_1ihC1X7B2tTto6x3QZ0UrAitjaA0
- **部署URL**: https://lucky-pocket-3ec7723gz-ruolynn-4247s-projects.vercel.app
- **状态**: 需要配置Root Directory后重新部署

---

**下一步**: 在Dashboard中设置Root Directory为 `apps/web`，然后重新部署。


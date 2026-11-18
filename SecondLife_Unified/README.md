# SecondLife unified prototype

第四步交付：Buyer、Seller、Admin 共用一个 React 应用、设计系统和本地数据源。原来的三个 Figma 导出目录保留，正式报告和 DBML 未因本次 UI 合并而改写。

## 启动

在此目录打开 PowerShell：

```powershell
cd SecondLife_Unified
npm install
npm audit fix
npm run dev
```

打开终端显示的地址，默认 http://127.0.0.1:5173/buyer/products 。当前机器已准备依赖；复制到另一台机器时先运行 `npm ci`（需网络及兼容的 Node.js；本机使用 Node 24）。不要直接双击 index.html。

页面顶部 **Demo account** 可切换买家、四位卖家和管理员。角色切换会进入相应工作区；直接进入其他角色的 URL 会显示 Access denied。所有演示登录使用 `secondlife1`，注册表单中的密码不会保存；请只填写虚构资料。

## 建议演示顺序

1. Seller → KL Gadget Revival → Incoming offers → 接受 Samsung 报价。
2. Buyer → Offers → 按报价加入购物车 → 勾选商品 → Checkout → Place order → 模拟付款。
3. Seller → KL Gadget Revival → Orders → View order → 填 Tracking number → Mark as shipped。
4. 默认 20 秒后转为 IN_TRANSIT；切换 Buyer → Orders → 对应订单，分别确认 Delivery 与 Receipt。
5. Admin → Orders & payments 查看同一订单。Listings 的 Disable/Restore 会改变 Buyer 的可购买商品；Users 的 Suspend 会限制账号。
6. Buyer 对已付款订单提出 Case；Admin → Reports & disputes 填处理说明及退款授权金额 → Resolve case；如授权退款，到 Orders & payments 单独执行模拟退款。

刷新会保留演示状态。Reset demo 只重置此应用的数据。State 下拉可预览 Loading/Error 状态。

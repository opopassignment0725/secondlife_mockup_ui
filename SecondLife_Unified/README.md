# SecondLife unified prototype

```powershell
cd SecondLife_Unified
npm install
npm audit fix
npm run dev
```

## step

1. Seller → KL Gadget Revival → Incoming offers → 接受 Samsung 报价。
2. Buyer → Offers → 按报价加入购物车 → 勾选商品 → Checkout → Place order → 模拟付款。
3. Seller → KL Gadget Revival → Orders → View order → 填 Tracking number → Mark as shipped。
4. 默认 20 秒后转为 IN_TRANSIT；切换 Buyer → Orders → 对应订单，分别确认 Delivery 与 Receipt。
5. Admin → Orders & payments 查看同一订单。Listings 的 Disable/Restore 会改变 Buyer 的可购买商品；Users 的 Suspend 会限制账号。
6. Buyer 对已付款订单提出 Case；Admin → Reports & disputes 填处理说明及退款授权金额 → Resolve case；如授权退款，到 Orders & payments 单独执行模拟退款。

刷新会保留演示状态。Reset demo 只重置此应用的数据。State 下拉可预览 Loading/Error 状态。

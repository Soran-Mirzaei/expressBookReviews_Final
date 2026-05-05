const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req, res, next) {
        // 1. بررسی اینکه آیا شیء authorization در سشن وجود دارد یا خیر
        if (req.session.authorization) {
            // استخراج توکن از سشن
            let token = req.session.authorization['accessToken'];
    
            // 2. تایید اعتبار توکن JWT
            // "access" همان کلید سری است که در هنگام لاگین برای امضا (sign) استفاده شده
            jwt.verify(token, "access", (err, user) => {
                if (!err) {
                    // اگر خطایی نبود، اطلاعات کاربر را در req ذخیره کن و برو مرحله بعد
                    req.user = user;
                    next(); 
                } else {
                    // اگر توکن منقضی شده یا دستکاری شده باشد
                    return res.status(403).json({ message: "User not authenticated" });
                }
            });
        } else {
            // اگر کاربر اصلاً لاگین نکرده باشد (سشنی وجود ندارد)
            return res.status(403).json({ message: "User not logged in" });
        }
});

 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));

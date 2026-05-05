const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ // فیلتر کردن آرایه کاربران برای پیدا کردن نام کاربری مشابه
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    
    // اگر حداقل یک کاربر پیدا شد، یعنی نام کاربری معتبر/موجود است
    if (userswithsamename.length > 0) {
        return true;
    } else {
        return false;
    }
}

const authenticatedUser = (username,password)=>{ //returns boolean
    // بررسی اینکه آیا کاربری با این مشخصات در لیست هست؟
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    return validusers.length > 0;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  // ۱. بررسی اینکه آیا نام کاربری و پسورد ارسال شده است؟
  if (!username || !password) {
      return res.status(404).json({ message: "Error logging in: Missing credentials" });
  }

  // ۲. احراز هویت کاربر
  if (authenticatedUser(username, password)) {
      // ۳. تولید توکن JWT
      // توکن شامل نام کاربری است و با کلید 'access' امضا می‌شود
      let accessToken = jwt.sign({
          data: password
      }, 'access', { expiresIn: 60 * 60 });

      // ۴. ذخیره توکن در Session برای استفاده در درخواست‌های بعدی
      req.session.authorization = {
          accessToken, username
      }
      
      return res.status(200).send("User successfully logged in");
  } else {
      // اگر اطلاعات غلط بود
      return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add a book review
// اضافه کردن یا ویرایش نظر کتاب
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review; // دریافت نظر از طریق Query Parameter
    const username = req.session.authorization['username']; // استخراج نام کاربر از سشن

    // ۱. بررسی اینکه آیا متنی برای نظر ارسال شده است؟
    if (!review) {
        return res.status(400).json({ message: "Review content is missing in query parameters" });
    }

    // ۲. بررسی وجود کتاب در دیتابیس
    if (books[isbn]) {
        let book = books[isbn];
        
        // ۳. اضافه کردن یا ویرایش نظر
        // در اینجا نام کاربری به عنوان کلید (Key) در آبجکت reviews قرار می‌گیرد
        // این کار باعث می‌شود هر کاربر فقط یک نظر برای هر ISBN داشته باشد
        book.reviews[username] = review;

        return res.status(200).json({ 
            message: `The review for the book with ISBN ${isbn} has been added/updated.` 
        });
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

// حذف نظر یک کتاب
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization['username']; // استخراج یوزرنیم از سشن

    // ۱. بررسی وجود کتاب در دیتابیس
    if (books[isbn]) {
        let book = books[isbn];
        
        // ۲. بررسی اینکه آیا این کاربر اصلاً نظری برای این کتاب دارد؟
        if (book.reviews[username]) {
            // ۳. حذف نظر فقط برای همین کاربر
            delete book.reviews[username];
            
            return res.status(200).json({ 
                message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.` 
            });
        } else {
            // اگر کاربر نظری برای این کتاب نداشت
            return res.status(404).json({ message: "No review found for this user to delete." });
        }
    } else {
        // اگر کتاب پیدا نشد
        return res.status(404).json({ message: "Book not found." });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;

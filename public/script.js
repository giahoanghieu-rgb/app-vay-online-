// Sidebar Control
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').style.display = 'block';
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').style.display = 'none';
}

function openModal(id) {
    closeSidebar();
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Chuyển đổi giữa Đăng Nhập & Đăng Ký
function switchAuthModal(fromModal, toModal) {
    closeModal(fromModal);
    openModal(toModal);
}

// Tính Toán Khoản Vay
document.addEventListener('DOMContentLoaded', function() {
    const amountRange = document.getElementById('amountRange');
    const daysRange = document.getElementById('daysRange');

    if (amountRange && daysRange) {
        function calc() {
            const a = parseInt(amountRange.value), d = parseInt(daysRange.value);
            const interest = Math.round(a * (0.12 / 365) * d);
            const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
            document.getElementById('amountDisplay').innerText = fmt(a);
            document.getElementById('daysDisplay').innerText = d + ' ngày';
            document.getElementById('summaryPrincipal').innerText = fmt(a);
            document.getElementById('summaryInterest').innerText = fmt(interest);
            document.getElementById('summaryTotal').innerText = fmt(a + interest);
        }

        amountRange.addEventListener('input', calc);
        daysRange.addEventListener('input', calc);
        calc();
    }
});

// Xem trước ảnh Upload
function prev(input, imgId, cId) {
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => {
            document.getElementById(imgId).src = e.target.result;
            document.getElementById(imgId).style.display = 'block';
            document.getElementById(cId).style.display = 'none';
        }
        r.readAsDataURL(input.files[0]);
    }
}

// Xử lý Form Đăng Ký Tài Khoản
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const pass = document.getElementById('regPass').value;
            const passConfirm = document.getElementById('regPassConfirm').value;

            if (pass !== passConfirm) {
                return alert('❌ Mật khẩu xác nhận không trùng khớp!');
            }

            // Lưu thông tin người dùng giả lập
            localStorage.setItem('userPhone', phone);
            localStorage.setItem('userName', name);

            alert('🎉 Đăng ký tài khoản thành công!');
            closeModal('modalRegister');
            updateUserUI(name);
        });
    }

    // Xử lý Form Đăng Nhập Tài Khoản
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value;
            const name = localStorage.getItem('userName') || 'Khách hàng';

            alert('🎉 Đăng nhập thành công!');
            closeModal('modalLogin');
            updateUserUI(name);
        });
    }

    // Kiểm tra đăng nhập cũ
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        updateUserUI(savedName);
    }
});

function updateUserUI(name) {
    document.getElementById('authButtons').style.display = 'none';
    const userInfo = document.getElementById('userInfo');
    userInfo.style.display = 'flex';
    document.getElementById('userNameDisplay').innerText = name;
}

function logout() {
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    location.reload();
}

// Tra Cứu Hồ Sơ
async function checkStatus() {
    const q = document.getElementById('searchQuery').value.trim();
    if(!q) return alert('Vui lòng nhập SĐT hoặc Mã vay');
    try {
        const res = await fetch('/api/check-status?query=' + encodeURIComponent(q));
        const data = await res.json();
        const resDiv = document.getElementById('profileResult');
        if(!data.data || data.data.length === 0) {
            resDiv.innerHTML = '<p style="color:#ef4444; font-size:13px; text-align:center; margin-top:10px;">Không tìm thấy hồ sơ vay!</p>';
            return;
        }
        let html = '';
        data.data.forEach(item => {
            let badgeClass = 'status-pending';
            if(item.status === 'Đã duyệt') badgeClass = 'status-approved';
            if(item.status === 'Từ chối') badgeClass = 'status-rejected';
            html += `<div style="border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-top:10px; font-size:13px;">
                <div><b>Mã hồ sơ:</b> #${item.loanId}</div>
                <div><b>Họ tên:</b> ${item.fullName}</div>
                <div><b>Số tiền vay:</b> ${new Intl.NumberFormat('vi-VN').format(item.amount)} đ (${item.days} ngày)</div>
                <div><b>Trạng thái:</b> <span class="status-badge ${badgeClass}">${item.status}</span></div>
            </div>`;
        });
        resDiv.innerHTML = html;
    } catch(e) { alert('Lỗi tra cứu!'); }
}

// Admin Logic
let currentAdminPass = '';
async function adminLogin() {
    const pass = document.getElementById('adminPass').value;
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password: pass })
        });
        const data = await res.json();
        if(data.success) {
            currentAdminPass = pass;
            closeModal('modalAdminLogin');
            document.getElementById('modalAdminPanel').style.display = 'flex';
            renderAdminList(data.loans);
        } else { alert(data.message); }
    } catch(e) { alert('Lỗi hệ thống!'); }
}

function renderAdminList(loans) {
    const container = document.getElementById('adminList');
    if(!loans || loans.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:10px;">Chưa có hồ sơ vay nào.</p>';
        return;
    }
    let html = '';
    loans.forEach(item => {
        html += `<div style="border:1px solid #cbd5e1; border-radius:12px; padding:12px; margin-bottom:10px; font-size:12px; background:#fafafa;">
            <div><b>#${item.loanId} - ${item.fullName}</b></div>
            <div>SĐT: ${item.phone} | Khoản vay: <b>${new Intl.NumberFormat('vi-VN').format(item.amount)} đ</b></div>
            <div>Người thân: ${item.relativeName} (${item.relativeRelation}) - SĐT: ${item.relativePhone}</div>
            <div style="margin-top:8px; display:flex; gap:6px; align-items:center;">
                <b>Duyệt bài:</b>
                <button onclick="updateStatus('${item.loanId}', 'Đã duyệt')" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer;">Duyệt</button>
                <button onclick="updateStatus('${item.loanId}', 'Từ chối')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer;">Từ chối</button>
                <span style="margin-left:auto; font-weight:bold;">${item.status}</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

async function updateStatus(loanId, status) {
    try {
        const res = await fetch('/api/admin/update-status', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password: currentAdminPass, loanId, status })
        });
        const data = await res.json();
        if(data.success) {
            alert(`Đã cập nhật hồ sơ thành [${status}]`);
            adminLogin();
        }
    } catch(e) { alert('Lỗi xử lý!'); }
}

// Nộp Hồ Sơ Vay
document.addEventListener('DOMContentLoaded', function() {
    const loanForm = document.getElementById('loanForm');
    if (loanForm) {
        loanForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('subBtn');
            btn.disabled = true; btn.innerText = "Đang gửi hồ sơ...";
            
            const fd = new FormData(this);
            fd.append('amount', document.getElementById('amountRange').value);
            fd.append('days', document.getElementById('daysRange').value);
            
            try {
                const res = await fetch('/api/submit-loan', { method: 'POST', body: fd });
                const r = await res.json();
                if(r.success) {
                    alert('🎉 Đăng ký thành công! Mã vay của bạn là: ' + r.loanId);
                    this.reset(); location.reload();
                } else { alert('❌ Lỗi: ' + r.message); }
            } catch(e) { alert('❌ Lỗi gửi hồ sơ!'); }
            finally { btn.disabled = false; btn.innerText = "NỘP HỒ SƠ VAY"; }
        });
    }
});
                
// Quản lý Sidebar & Modal
function openSidebar() { document.getElementById('sidebar').classList.add('active'); document.getElementById('sidebarOverlay').style.display = 'block'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; }
function openModal(id) { closeSidebar(); document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function switchAuthModal(fromModal, toModal) { closeModal(fromModal); openModal(toModal); }

// XỬ LÝ HẠN MỨC THEO CẤP BẬC
let currentMaxAmount = 500000; // Mặc định khách mới max 500.000 VNĐ

document.addEventListener('DOMContentLoaded', function() {
    const amountRange = document.getElementById('amountRange');
    const daysRange = document.getElementById('daysRange');

    // Kiểm tra cấp bậc người dùng từ LocalStorage
    const userRank = localStorage.getItem('userRank') || 'Đồng';
    const completedLoans = parseInt(localStorage.getItem('completedLoans') || '0');

    if (completedLoans >= 3) currentMaxAmount = 5000000;  // Vay 3-5 lần: Hạn mức 5M
    if (completedLoans >= 6) currentMaxAmount = 15000000; // Vay >6 lần: Hạn mức 15M

    if (amountRange) {
        amountRange.max = currentMaxAmount;
        if (parseInt(amountRange.value) > currentMaxAmount) {
            amountRange.value = currentMaxAmount;
        }

        function calc() {
            const a = parseInt(amountRange.value), d = parseInt(daysRange.value);
            const interest = Math.round(a * (0.12 / 365) * d);
            const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
            document.getElementById('amountDisplay').innerText = fmt(a);
            document.getElementById('daysDisplay').innerText = d + ' ngày';
            document.getElementById('summaryPrincipal').innerText = fmt(a);
            document.getElementById('summaryInterest').innerText = fmt(interest);
            document.getElementById('summaryTotal').innerText = fmt(a + interest);
        }

        amountRange.addEventListener('input', calc);
        daysRange.addEventListener('input', calc);
        calc();
    }
});

// PREVIEW ẢNH
function prev(input, imgId, cId) {
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => {
            document.getElementById(imgId).src = e.target.result;
            document.getElementById(imgId).style.display = 'block';
            document.getElementById(cId).style.display = 'none';
        }
        r.readAsDataURL(input.files[0]);
    }
}

// XỬ LÝ ĐĂNG KÝ / ĐĂNG NHẬP KHÁCH HÀNG
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const password = document.getElementById('regPass').value;

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, password })
                });
                const r = await res.json();
                if (r.success) {
                    alert('🎉 Đăng ký thành công!');
                    localStorage.setItem('userName', name);
                    localStorage.setItem('userPhone', phone);
                    localStorage.setItem('completedLoans', '0');
                    closeModal('modalRegister');
                    location.reload();
                } else alert('❌ ' + r.message);
            } catch (err) {
                alert('Đăng ký thành công (Demo offline)');
                closeModal('modalRegister');
            }
        });
    }
});

// XỬ LÝ QUẢN TRỊ ADMIN PANEL
async function loginAdmin(e) {
    e.preventDefault();
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;

    if (u === 'admin' && p === 'admin123') {
        alert('🔑 Đăng nhập Administrator thành công!');
        closeModal('modalAdminLogin');
        openModal('modalAdminPanel');
        loadAdminData();
    } else {
        alert('❌ Sai tài khoản hoặc mật khẩu Quản trị viên!');
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    
    document.getElementById('tab-btn-' + tabName).classList.add('active');
    document.getElementById('admin-tab-' + tabName).style.display = 'block';
}

async function loadAdminData() {
    try {
        const res = await fetch('/api/admin/data');
        const data = await res.json();
        
        // 1. Tải danh sách Tài khoản
        let userHtml = `<table class="admin-table"><tr><th>Họ Tên</th><th>SĐT</th><th>Số lần vay thành công</th></tr>`;
        data.users.forEach(u => {
            userHtml += `<tr><td>${u.name}</td><td>${u.phone}</td><td>${u.completedLoans} lần</td></tr>`;
        });
        document.getElementById('admin-tab-users').innerHTML = userHtml + '</table>';

        // 2. Tải Hồ sơ Vay & Duyệt
        let loanHtml = `<table class="admin-table"><tr><th>Mã Vay</th><th>Khách Hàng</th><th>Số Tiền</th><th>Trạng Thái</th><th>Thao Tác</th></tr>`;
        data.loans.forEach(l => {
            loanHtml += `<tr>
                <td>#${l.loanId}</td>
                <td>${l.fullName}<br><small>${l.phone}</small></td>
                <td>${new Intl.NumberFormat('vi-VN').format(l.amount)}đ</td>
                <td><b>${l.status}</b></td>
                <td>
                    <button class="btn-action-approve" onclick="updateLoanStatus('${l.loanId}', 'Đã duyệt')">Duyệt</button>
                    <button class="btn-action-reject" onclick="updateLoanStatus('${l.loanId}', 'Từ chối')">Hủy</button>
                </td>
            </tr>`;
        });
        document.getElementById('admin-tab-loans').innerHTML = loanHtml + '</table>';
        document.getElementById('admin-tab-records').innerHTML = loanHtml + '</table>';
    } catch(e) {
        document.getElementById('admin-tab-users').innerHTML = '<p style="padding:10px;">Đang chạy chế độ xem thử offline.</p>';
    }
}

async function updateLoanStatus(loanId, status) {
    if(!confirm(`Xác nhận đổi trạng thái hồ sơ #${loanId} thành "${status}"?`)) return;
    try {
        await fetch('/api/admin/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loanId, status })
        });
        alert('Cập nhật trạng thái thành công!');
        loadAdminData();
    } catch(e) { alert('Lỗi kết nối!'); }
                                    }

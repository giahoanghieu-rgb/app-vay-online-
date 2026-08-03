// Quản lý Sidebar Menu
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

// Xử lý Tính Toán Lãi Suất
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

// Xem trước ảnh upload
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

// Tra cứu thông tin khoản vay của khách hàng
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

// Đăng nhập và quản lý dành cho Admin
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

// Xử lý nộp Form
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
              

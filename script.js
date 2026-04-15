// ==============================================================================
// HỆ THỐNG QUẢN TRỊ - BẢN VÁ LỖI HIỆU NĂNG & UX (CHIA NHỎ 12 PHẦN)
// ==============================================================================

window.db = null; window.session = null; window.serverOffset = 0;
window.isHk2Locked = false; window.isDemoMode = false; window.currentClearPin = "654321";
window.currentChatRef = null; window.currentPrivateConvo = ""; window.currentStreakRef = null; window.isSpying = false;
window.currentGroupChat = ""; window.currentGroupAdmin = ""; window.html5QrcodeScanner = null;
window.currentUploadType = null; window.typingTimeout = null;
window.IMGBB_API_KEY = "Cdb452c548546016f5ad7d5954d6d280"; 
window.currentVillage = 'hs'; 

// Bộ lọc chống tràn RAM: Quản lý các luồng dữ liệu ngầm
window.activeListeners = []; 
window.clearAllListeners = () => {
    window.activeListeners.forEach(l => l.ref.off(l.type, l.callback));
    window.activeListeners = [];
};
window.registerListener = (ref, type, callback) => {
    ref.on(type, callback);
    window.activeListeners.push({ ref, type, callback });
};

window.petStages = [
    { name: "Trứng", img: "1000086774.png", minExp: 0 },
    { name: "Sắp Nở", img: "1000086773.png", minExp: 30 },
    { name: "Nhi Đồng", img: "1000086772.png", minExp: 80 },
    { name: "Thiếu Niên", img: "1000086771.png", minExp: 150 },
    { name: "Trưởng Thành", img: "1000086770.png", minExp: 250 }
];

window.now = () => new Date().getTime() + window.serverOffset;
window.formatTime = ms => { 
    if(!ms) return ""; 
    const d = new Date(ms); 
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} ${d.getDate()}/${d.getMonth()+1}`; 
};

// Hệ thống Toast Message chuẩn UX (Thay thế alert)
window.showToast = (msg, type = "info") => {
    const toast = document.getElementById('custom-toast');
    if(!toast) return console.log(msg);
    toast.innerText = msg;
    toast.style.background = type === 'error' ? '#dc3545' : (type === 'success' ? '#4CAF50' : 'var(--pink)');
    toast.classList.remove('hidden');
    toast.style.top = '20px';
    setTimeout(() => { toast.classList.add('hidden'); toast.style.top = '-50px'; }, 3000);
};

window.toggleModal = (id, show) => { 
    const m = document.getElementById(id); 
    if(m) {
        if(show) { m.classList.remove('hidden'); m.style.display = 'flex'; }
        else { m.classList.add('hidden'); m.style.display = 'none'; }
    }
};
// ==============================================================================
// PHẦN 2/12: CẤU HÌNH FIREBASE & HỆ THỐNG ĐĂNG NHẬP MÃ HÓA SHA-256
// ==============================================================================

// 🔴 ÔNG DÁN LẠI CỤC CẤU HÌNH FIREBASE (firebaseConfig) VÀO ĐÂY NHÉ:
const firebaseConfig = {
    apiKey: "DÁN_API_KEY_CỦA_ÔNG_VÀO_ĐÂY",
    authDomain: "DÁN_AUTH_DOMAIN_VÀO_ĐÂY",
    databaseURL: "DÁN_DATABASE_URL_VÀO_ĐÂY",
    projectId: "DÁN_PROJECT_ID_VÀO_ĐÂY",
    storageBucket: "DÁN_STORAGE_VÀO_ĐÂY",
    messagingSenderId: "DÁN_SENDER_ID_VÀO_ĐÂY",
    appId: "DÁN_APP_ID_VÀO_ĐÂY"
};

// Khởi tạo Firebase
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
window.db = firebase.database();

// 🔐 Hàm mã hóa mật khẩu SHA-256 (Bảo mật 1 chiều)
window.hashPassword = async (pwd) => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Xử lý Giao diện sau khi Đăng nhập thành công
window.processLoginSuccess = (id, userData) => {
    window.session = userData;
    window.session.id = id;
    localStorage.setItem('kimminlai_saved_id', id); // Lưu phiên đăng nhập vào trình duyệt

    // Bật Tracking Online & Tự động Offline khi mất mạng
    window.db.ref('tracking/' + id).set({ name: window.session.name, role: window.session.role, status: 'online', timeIn: window.now(), timeOut: null });
    window.db.ref('tracking/' + id).onDisconnect().update({ status: 'offline', timeOut: firebase.database.ServerValue.TIMESTAMP });
    
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    
    // Nạp thông tin Header
    document.getElementById('display-name-real').innerText = window.session.name;
    document.getElementById('display-role').innerText = window.session.role === 'admin' ? '👑 BOSS' : (window.session.role === 'gv' ? '👨‍🏫 GIÁO VIÊN' : '🎓 HỌC SINH');
    if(window.session.avatar) document.getElementById('user-avatar').src = window.session.avatar;
    
    // Phân quyền hiện Menu (Sidebar)
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.add('hidden'));
    ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-personal', 'nav-rules', 'nav-streak', 'nav-settings'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    
    if(window.session.role === 'gv' || window.session.role === 'admin') document.getElementById('nav-manage').classList.remove('hidden');
    if(window.session.role === 'admin') {
        ['nav-tracking', 'nav-avatar', 'nav-users', 'nav-branding', 'nav-clear-data'].forEach(id => document.getElementById(id).classList.remove('hidden'));
        document.getElementById('admin-security-zone').classList.remove('hidden');
    }
    
    window.switchTab('rules'); // Mặc định vào tab thông báo
    if(typeof window.checkMaintenance === 'function') window.checkMaintenance(); 
};

// Auto Login (Tự động đăng nhập nếu có phiên lưu)
window.checkAutoLogin = () => {
    const savedId = localStorage.getItem('kimminlai_saved_id');
    if (savedId) {
        window.db.ref('users/' + savedId).once('value').then(s => {
            if(s.exists() && s.val().isLocked !== true) window.processLoginSuccess(savedId, s.val());
            else window.handleLogout(); // Tài khoản bị xóa hoặc bị khóa thì sút ra
        }).catch(() => window.handleLogout());
    } else {
        document.getElementById('splash-screen').classList.add('hidden');
        if(!window.isMaintenanceMode) document.getElementById('login-screen').classList.remove('hidden');
    }
};

// Nút Đăng nhập
window.handleLogin = async () => {
    const id = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value.trim();
    if(!id || !pass) return window.showToast('Vui lòng nhập ID và Mật khẩu!', 'error');
    
    const btn = document.getElementById('login-btn');
    btn.innerText = "ĐANG XỬ LÝ..."; btn.disabled = true;

    // Băm mật khẩu người dùng nhập để so sánh với Database
    const hashedInput = await window.hashPassword(pass);
    
    window.db.ref('user_passwords/' + id).once('value').then(s => {
        const dbPass = s.val();
        // So sánh mã băm HOẶC nếu pass trong DB chưa mã hóa (Dành cho tài khoản cũ chưa kịp đổi pass)
        if (dbPass === hashedInput || dbPass === pass) {
            // Nâng cấp: Nếu đang dùng pass cũ (chưa băm), tự động băm rồi lưu đè lại vào DB cho bảo mật
            if (dbPass === pass && dbPass !== hashedInput) window.db.ref('user_passwords/' + id).set(hashedInput);

            window.db.ref('users/' + id).once('value').then(u => {
                if(u.exists()) {
                    if (u.val().isLocked) {
                        window.showToast('Tài khoản đã bị khóa: ' + (u.val().lockReason || ''), 'error');
                        btn.innerText = "VÀO HỆ THỐNG 🚀"; btn.disabled = false;
                    } else {
                        window.processLoginSuccess(id, u.val());
                    }
                } else { 
                    window.showToast('ID không tồn tại!', 'error'); 
                    btn.innerText = "VÀO HỆ THỐNG 🚀"; btn.disabled = false; 
                }
            });
        } else {
            window.showToast('Sai ID hoặc Mật khẩu!', 'error');
            btn.innerText = "VÀO HỆ THỐNG 🚀"; btn.disabled = false;
        }
    });
};

// Nút Đăng xuất
window.handleLogout = () => {
    localStorage.removeItem('kimminlai_saved_id');
    if(window.session && window.session.id) {
        window.db.ref('tracking/' + window.session.id).update({ status: 'offline', timeOut: window.now() }).then(() => {
            window.clearAllListeners(); // Chống rò rỉ bộ nhớ
            location.reload(); // Tải lại trang để xóa sạch cache
        });
    } else {
        location.reload();
    }
};

// Đợi 1 giây khi tải trang rồi gọi Auto Login
setTimeout(window.checkAutoLogin, 1000);
// ==============================================================================
// PHẦN 3/12: ĐIỀU KHIỂN GIAO DIỆN & CẤU HÌNH HỆ THỐNG
// ==============================================================================

// 1. Đóng/Mở Menu ngang (Sidebar)
window.toggleSidebar = (show) => {
    const sb = document.getElementById('sidebar');
    if(sb) {
        sb.style.right = show ? '0' : '-300px';
        if(!show) {
            const menuDot = document.getElementById('menu-noti-dot');
            if(menuDot) menuDot.classList.add('hidden');
        }
    }
};

// 2. Chuyển Tab siêu mượt (Ngăn chặn load ngầm dư thừa)
window.switchTab = (tabId) => {
    window.toggleSidebar(false); // Ẩn sidebar trên điện thoại
    
    // Ẩn tất cả tabs và bỏ active các nút
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
    });
    
    // Bật tab được chọn
    const targetTab = document.getElementById('tab-' + tabId);
    const targetBtn = document.getElementById('nav-' + tabId);
    if(targetTab) targetTab.classList.remove('hidden');
    if(targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.style.background = 'var(--soft)';
    }

    // GỌI HÀM LOAD DỮ LIỆU TƯƠNG ỨNG (Tối ưu hiệu năng: Chỉ load khi người dùng thực sự mở Tab đó lên)
    if (tabId === 'users' && typeof window.loadUsers === 'function') window.loadUsers();
    if (tabId === 'manage' && typeof window.loadMasterGrades === 'function') window.loadMasterGrades();
    if (tabId === 'tracking' && typeof window.loadTracking === 'function') window.loadTracking();
    if (tabId === 'personal' && typeof window.loadPersonalGrades === 'function') window.loadPersonalGrades();
    if (tabId === 'rules' && typeof window.loadAnnouncements === 'function') window.loadAnnouncements();
    if (tabId === 'chat' && typeof window.openChatChannel === 'function') window.openChatChannel('global');
    if (tabId === 'myprofile' && typeof window.loadMyProfile === 'function') window.loadMyProfile();
    if (tabId === 'connect' && typeof window.loadMyConnectQr === 'function') window.loadMyConnectQr();
    if (tabId === 'streak' && typeof window.loadStreakDropdowns === 'function') window.loadStreakDropdowns();
};

// 3. Chế độ Tối (Dark Mode)
window.toggleDarkMode = (cb) => {
    if(cb.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('darkMode', 'false');
    }
};
// Khôi phục trạng thái nút gạt Dark Mode khi tải lại web
if(localStorage.getItem('darkMode') === 'true') {
    const tg = document.getElementById('dark-mode-toggle');
    if(tg) tg.checked = true;
}

// 4. Cấu hình BẢO TRÌ HỆ THỐNG (Dành cho Admin)
window.handleToggleMaintenance = c => window.db.ref('config/maintenanceMode').set(c.checked);
window.checkMaintenance = () => {
    window.db.ref('config/maintenanceMode').on('value', s => {
        window.isMaintenanceMode = s.val() === true;
        const tgMain = document.getElementById('maintenance-toggle');
        if (tgMain) tgMain.checked = window.isMaintenanceMode;
        
        const mainScreen = document.getElementById('maintenance-screen');
        if (window.isMaintenanceMode) {
            // Đang bảo trì: Đá tất cả user thường ra ngoài, chỉ Admin được ở lại
            if (!window.session || window.session.role !== 'admin') {
                if (mainScreen) mainScreen.classList.remove('hidden');
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('main-screen').classList.add('hidden');
            } else {
                if (mainScreen) mainScreen.classList.add('hidden'); 
            }
        } else {
            // Hết bảo trì: Gỡ bảng thông báo
            if (mainScreen) mainScreen.classList.add('hidden');
        }
    });
};

// 5. Cấu hình KHÓA HỌC KỲ 2 (Dành cho Admin)
window.handleToggleLock = c => window.db.ref('config/lockHk2').set(c.checked);
window.db.ref('config/lockHk2').on('value', s => {
    window.isHk2Locked = s.val() === true;
    const tgLock = document.getElementById('lock-toggle');
    if(tgLock) tgLock.checked = window.isHk2Locked;
});

// 6. Cấu hình CHẾ ĐỘ TRẢI NGHIỆM (Demo)
window.handleToggleDemoMode = c => window.db.ref('config/demoMode').set(c.checked);
window.db.ref('config/demoMode').on('value', s => {
    window.isDemoMode = s.val() === true;
    const tgDemo = document.getElementById('demo-toggle');
    if(tgDemo) tgDemo.checked = window.isDemoMode;
});

// 7. Đồng bộ Logo & Tên App theo Branding Admin chỉnh
window.db.ref('branding').on('value', s => {
    const b = s.val() || {};
    const appName = b.name || "KIM MIN LAI";
    document.querySelectorAll('.dynamic-app-name').forEach(el => el.innerText = appName);
    if(b.logo) {
        document.querySelectorAll('.dynamic-logo').forEach(el => { el.src = b.logo; el.classList.remove('hidden'); });
    }
    if(b.splash) {
        const spImg = document.getElementById('custom-splash-img');
        const defSp = document.getElementById('default-spinner');
        if(spImg && defSp) { spImg.src = b.splash; spImg.style.display = 'block'; defSp.style.display = 'none'; }
    }
});
// ==============================================================================
// PHẦN 4/12: QUẢN LÝ HỒ SƠ CÁ NHÂN & KẾT NỐI (TÌM BẠN BẰNG LINK/QR)
// ==============================================================================

// --- TAB HỒ SƠ CỦA TÔI ---
window.loadMyProfile = () => {
    if(!window.session) return;
    const s = window.session;
    document.getElementById('my-tab-name').innerText = s.name;
    document.getElementById('my-tab-id').innerText = "ID: " + s.id.toUpperCase();
    if(s.avatar) document.getElementById('my-tab-avatar').src = s.avatar;
    
    const by = document.getElementById('my-tab-birthyear');
    if(s.birthyear) by.innerText = "🎂 Sinh năm: " + s.birthyear; else by.innerText = "";
    
    const qt = document.getElementById('my-tab-quote');
    if(s.quote) { qt.innerText = '"' + s.quote + '"'; qt.classList.remove('hidden'); } else qt.classList.add('hidden');
    
    document.getElementById('my-tab-bio').innerText = s.bio || "Chưa có tiểu sử...";
    
    const ch = document.getElementById('my-tab-cohort');
    if(s.role === 'cuu_hs' && s.cohort) { ch.innerText = "Khóa: " + s.cohort; ch.classList.remove('hidden'); } else ch.classList.add('hidden');
};

window.openSelfEdit = () => {
    document.getElementById('self-birthyear').value = window.session.birthyear || '';
    document.getElementById('self-quote').value = window.session.quote || '';
    document.getElementById('self-bio').value = window.session.bio || '';
    window.toggleModal('self-edit-modal', true);
};

window.saveSelfProfile = () => {
    const b = document.getElementById('self-birthyear').value.trim();
    const q = document.getElementById('self-quote').value.trim();
    const bio = document.getElementById('self-bio').value.trim();
    
    window.db.ref('users/' + window.session.id).update({ birthyear: b, quote: q, bio: bio }).then(() => {
        window.session.birthyear = b; window.session.quote = q; window.session.bio = bio;
        window.loadMyProfile();
        window.toggleModal('self-edit-modal', false);
        window.showToast("Đã cập nhật hồ sơ!", "success");
    });
};

// --- TAB KẾT NỐI (QR & LINK) ---
window.loadMyConnectQr = () => {
    if(!window.session) return;
    document.getElementById('my-bank-name').innerText = window.session.name;
    document.getElementById('my-bank-id').innerText = "ID: " + window.session.id.toUpperCase();
    if(window.session.avatar) document.getElementById('my-bank-avt').src = window.session.avatar;
    
    // Tự động tạo Link cá nhân dựa trên trang Web hiện tại
    const myLink = window.location.origin + window.location.pathname + "?user=" + window.session.id;
    document.getElementById('connect-my-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(myLink)}`;
};

window.copyMyLink = () => {
    const myLink = window.location.origin + window.location.pathname + "?user=" + window.session.id;
    navigator.clipboard.writeText(myLink).then(() => {
        window.showToast("Đã copy Link cá nhân!", "success");
    }).catch(() => window.showToast("Trình duyệt không hỗ trợ Copy!", "error"));
};

// Tìm kiếm người dùng bằng ID hoặc dán nguyên cả Link
window.searchConnectUser = () => { 
    let val = document.getElementById('connect-search-id').value.trim(); 
    if(!val) return window.showToast("Vui lòng nhập ID hoặc dán Link!", "error");
    
    // Phép thuật cắt Link: Nếu trong khung tìm kiếm dán link "?user=abc" -> cắt lấy chữ "abc"
    if (val.includes('?user=')) {
        try { val = val.split('?user=')[1].split('&')[0]; } 
        catch(e) {}
    }
    
    val = val.toLowerCase();
    if(typeof window.openUserProfile === 'function') window.openUserProfile(val); 
};

// Quét mã QR bằng Camera điện thoại
window.startQRScanner = () => {
    document.getElementById('qr-scanner-container').classList.remove('hidden');
    if (!window.html5QrcodeScanner) window.html5QrcodeScanner = new Html5Qrcode("connect-qr-reader");
    
    window.html5QrcodeScanner.start(
        { facingMode: "environment" }, // Dùng camera sau
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            window.stopQRScanner();
            document.getElementById('connect-search-id').value = decodedText;
            window.searchConnectUser(); // Tự động tra cứu luôn sau khi quét trúng
        },
        (err) => { /* Bỏ qua thông báo lỗi khung hình ẩn */ }
    ).catch(err => window.showToast("Không thể mở Camera. Hãy cấp quyền!", "error"));
};

window.stopQRScanner = () => {
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.stop().then(() => {
            document.getElementById('qr-scanner-container').classList.add('hidden');
        }).catch(e => console.log(e));
    } else {
        document.getElementById('qr-scanner-container').classList.add('hidden');
    }
};
// ==============================================================================
// PHẦN 5/12: XEM HỒ SƠ BẠN BÈ & XỬ LÝ LỜI MỜI KẾT BẠN
// ==============================================================================

// Mở cửa sổ xem Hồ sơ người khác (hoặc chính mình)
window.openUserProfile = (id) => {
    if(!id || id === '') return;
    document.getElementById('connect-search-id').value = ''; // Reset ô tìm kiếm
    
    window.db.ref('users/' + id).once('value').then(s => {
        if(s.exists() && s.val().isLocked !== true) {
            const u = s.val();
            document.getElementById('profile-name').innerText = u.name;
            document.getElementById('profile-id').innerText = "ID: " + id.toUpperCase();
            
            const avt = document.getElementById('profile-avatar');
            const hidAvt = document.getElementById('profile-hidden-avatar');
            if(u.avatar) { avt.src = u.avatar; avt.classList.remove('hidden'); hidAvt.classList.add('hidden'); }
            else { avt.classList.add('hidden'); hidAvt.classList.remove('hidden'); }
            
            const by = document.getElementById('profile-birthyear');
            if(u.birthyear) by.innerText = "🎂 Sinh năm: " + u.birthyear; else by.innerText = "";
            
            const qt = document.getElementById('profile-quote');
            if(u.quote) { qt.innerText = '"' + u.quote + '"'; qt.classList.remove('hidden'); } else qt.classList.add('hidden');
            
            document.getElementById('profile-bio').innerText = u.bio || "Chưa có tiểu sử...";
            
            const ch = document.getElementById('profile-cohort');
            if(u.role === 'cuu_hs' && u.cohort) { ch.innerText = "Khóa: " + u.cohort; ch.classList.remove('hidden'); } else ch.classList.add('hidden');
            
            // Xử lý logic ẩn/hiện nút bấm tùy theo người đang xem
            document.getElementById('profile-self-edit-btn').classList.add('hidden');
            const btnFriend = document.getElementById('profile-friend-btn');
            const btnChat = document.getElementById('profile-chat-btn');
            btnFriend.classList.add('hidden'); btnChat.classList.add('hidden');
            
            if(window.session && id === window.session.id) {
                // Đang tự xem hồ sơ mình
                document.getElementById('profile-self-edit-btn').classList.remove('hidden');
            } else if(window.session) {
                // Xem hồ sơ người khác
                btnChat.classList.remove('hidden');
                btnChat.onclick = () => { window.toggleModal('user-profile-modal', false); window.switchTab('chat'); window.openPrivateChat(id, u.name); };
                
                // Kiểm tra trạng thái bạn bè
                const myId = window.session.id;
                window.db.ref(`friends/${myId}/${id}`).once('value').then(f => {
                    if(f.exists()) {
                        btnFriend.classList.remove('hidden'); btnFriend.innerText = "❌ HỦY KẾT BẠN"; btnFriend.style.background = "#dc3545";
                        btnFriend.onclick = () => { 
                            window.db.ref(`friends/${myId}/${id}`).remove(); 
                            window.db.ref(`friends/${id}/${myId}`).remove(); 
                            window.showToast("Đã hủy kết bạn!"); 
                            btnFriend.classList.add('hidden'); 
                        };
                    } else {
                        window.db.ref(`friend_requests/${id}/${myId}`).once('value').then(rq => {
                            btnFriend.classList.remove('hidden');
                            if(rq.exists()) { 
                                btnFriend.innerText = "⏳ ĐÃ GỬI LỜI MỜI"; btnFriend.style.background = "var(--border)"; btnFriend.style.color = "var(--text)"; btnFriend.onclick = null; 
                            } else {
                                btnFriend.innerText = "➕ KẾT BẠN"; btnFriend.style.background = "#1877F2"; btnFriend.style.color = "white";
                                btnFriend.onclick = () => {
                                    window.db.ref(`friend_requests/${id}/${myId}`).set(window.now()).then(() => {
                                        window.showToast("Đã gửi lời mời!"); 
                                        btnFriend.innerText = "⏳ ĐÃ GỬI LỜI MỜI"; btnFriend.style.background = "var(--border)"; btnFriend.style.color = "var(--text)"; btnFriend.onclick = null;
                                    });
                                };
                            }
                        });
                    }
                });
            }
            window.toggleModal('user-profile-modal', true);
        } else { window.showToast("Người dùng không tồn tại hoặc đã bị khóa!", "error"); }
    });
};

// Tải danh sách Lời mời và Bạn bè (Gọi khi mở Tab Kết nối)
window.loadMyFriends = () => {
    if(!window.session) return;
    const myId = window.session.id;
    
    // 1. Lắng nghe Lời mời kết bạn
    window.registerListener(window.db.ref('friend_requests/' + myId), 'value', s => {
        const reqs = s.val();
        const list = document.getElementById('friend-requests-list');
        const zone = document.getElementById('friend-requests-zone');
        list.innerHTML = '';
        if(reqs) {
            zone.classList.remove('hidden');
            Object.keys(reqs).forEach(reqId => {
                window.db.ref('users/' + reqId).once('value').then(u => {
                    if(u.exists()) {
                        const d = u.val();
                        list.innerHTML += `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:10px; border-radius:10px; border:1px solid var(--border);">
                                <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.openUserProfile('${reqId}')">
                                    <img src="${d.avatar || '1000086774.png'}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                                    <span style="font-weight:bold; font-size:14px; color:var(--text);">${d.name}</span>
                                </div>
                                <div style="display:flex; gap:5px;">
                                    <button class="btn-royal" style="padding:5px 15px; font-size:12px; background:#1877F2;" onclick="window.acceptFriend('${reqId}')">Đồng ý</button>
                                    <button class="btn-royal" style="padding:5px 15px; font-size:12px; background:#dc3545;" onclick="window.rejectFriend('${reqId}')">Xóa</button>
                                </div>
                            </div>
                        `;
                    }
                });
            });
        } else { zone.classList.add('hidden'); }
    });

    // 2. Lắng nghe Danh sách Bạn bè đã kết nối
    window.registerListener(window.db.ref('friends/' + myId), 'value', s => {
        const frs = s.val();
        const list = document.getElementById('my-friends-list');
        list.innerHTML = '';
        let count = 0;
        if(frs) {
            Object.keys(frs).forEach(fId => {
                count++;
                window.db.ref('users/' + fId).once('value').then(u => {
                    if(u.exists()) {
                        const d = u.val();
                        list.innerHTML += `
                            <div class="tt-item" onclick="window.switchTab('chat'); window.openPrivateChat('${fId}', '${d.name}')">
                                <img src="${d.avatar || '1000086774.png'}" class="tt-avt">
                                <div class="tt-info">
                                    <div class="tt-name">${d.name}</div>
                                    <div class="tt-preview">Chạm để nhắn tin...</div>
                                </div>
                            </div>
                        `;
                    }
                });
            });
        } else { list.innerHTML = '<p style="text-align:center; color:var(--text-light); padding: 20px;">Bạn chưa có người bạn nào. Hãy quét QR để kết nối nhé!</p>'; }
        document.getElementById('friend-count-badge').innerText = count;
    });
};

window.acceptFriend = (reqId) => {
    const myId = window.session.id;
    window.db.ref(`friends/${myId}/${reqId}`).set(true);
    window.db.ref(`friends/${reqId}/${myId}`).set(true);
    window.db.ref(`friend_requests/${myId}/${reqId}`).remove();
    window.showToast("Đã thêm bạn mới!", "success");
};

window.rejectFriend = (reqId) => {
    window.db.ref(`friend_requests/${window.session.id}/${reqId}`).remove();
};
// ==============================================================================
// PHẦN 6/12: HỆ THỐNG GÓC CHÉM GIÓ (CHAT CHUNG & QUẢN LÝ LUỒNG CHAT)
// ==============================================================================

window.openChatChannel = (ch) => {
    ['btn-chat-global', 'btn-chat-private', 'btn-chat-group'].forEach(id => {
        document.getElementById(id).style.background = 'var(--border)';
        document.getElementById(id).style.color = 'var(--text-main)';
    });
    document.getElementById('btn-chat-' + ch).style.background = 'var(--pink)';
    document.getElementById('btn-chat-' + ch).style.color = 'white';

    ['chat-global-zone', 'chat-private-zone', 'chat-group-zone'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('chat-' + ch + '-zone').classList.remove('hidden');

    // Ngắt listener chat hiện tại để giải phóng RAM
    if (window.currentChatRef) { window.currentChatRef.off(); window.currentChatRef = null; }

    if (ch === 'global') {
        document.getElementById('village-toggle-zone').classList.remove('hidden');
        window.switchVillage(window.currentVillage || 'hs');
    } else if (ch === 'private') {
        document.getElementById('village-toggle-zone').classList.add('hidden');
        document.getElementById('private-noti-dot').classList.add('hidden');
        if (typeof window.loadPrivateContacts === 'function') window.loadPrivateContacts();
    } else if (ch === 'group') {
        document.getElementById('village-toggle-zone').classList.add('hidden');
        if (typeof window.loadMyGroups === 'function') window.loadMyGroups();
    }
};

window.switchVillage = (v) => {
    window.currentVillage = v;
    const btnHs = document.getElementById('btn-village-hs');
    const btnCuu = document.getElementById('btn-village-cuu');
    
    if (v === 'hs') {
        btnHs.style.background = 'var(--pink)'; btnHs.style.color = 'white';
        btnCuu.style.background = 'var(--border)'; btnCuu.style.color = 'var(--text)';
    } else {
        btnCuu.style.background = 'var(--pink)'; btnCuu.style.color = 'white';
        btnHs.style.background = 'var(--border)'; btnHs.style.color = 'var(--text)';
    }
    window.loadGlobalChat(v);
    if (typeof window.updateLeaderboard === 'function') window.updateLeaderboard();
};

window.loadGlobalChat = (village) => {
    const box = document.getElementById('global-chat-box');
    box.innerHTML = '<div style="text-align:center;color:var(--text-light);font-size:12px;margin-top:20px;">Đang tải tin nhắn...</div>';
    
    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat_global_' + village).limitToLast(100);
    
    window.registerListener(window.currentChatRef, 'value', s => {
        box.innerHTML = ''; // Clear box
        const msgs = s.val();
        if (msgs) {
            Object.values(msgs).forEach(m => {
                const isMe = window.session && m.senderId === window.session.id;
                const timeStr = window.formatTime(m.time);
                
                // Tránh lỗi XSS và vỡ layout
                const safeText = (m.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const msgContent = m.isImage 
                    ? `<img src="${m.text}" style="max-width:200px;border-radius:10px;cursor:pointer;" onclick="window.viewFullImage('${m.text}')">` 
                    : `<div style="background:${isMe ? 'var(--pink)' : 'var(--border)'}; color:${isMe ? 'white' : 'var(--text)'}; padding:10px; border-radius:15px; display:inline-block; max-width:80%; word-break:break-word;">${safeText}</div>`;
                
                const div = document.createElement('div');
                div.style.display = 'flex'; div.style.gap = '10px'; div.style.alignItems = 'flex-end';
                div.style.justifyContent = isMe ? 'flex-end' : 'flex-start';
                
                div.innerHTML = isMe ? `
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <span style="font-size:10px; color:var(--text-light); margin-bottom:3px;">${timeStr}</span>
                        ${msgContent}
                    </div>
                ` : `
                    <img src="${m.avatar || '1000086774.png'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; cursor:pointer;" onclick="window.openUserProfile('${m.senderId}')">
                    <div style="display:flex; flex-direction:column; align-items:flex-start;">
                        <span style="font-size:10px; color:var(--text-light); margin-bottom:3px; font-weight:bold;">${m.senderName} • ${timeStr}</span>
                        ${msgContent}
                    </div>
                `;
                box.appendChild(div);
            });
            setTimeout(() => box.scrollTop = box.scrollHeight, 100);
        } else {
            box.innerHTML = '<div style="text-align:center;color:var(--text-light);font-size:12px;margin-top:20px;">Chưa có tin nhắn nào trong làng.</div>';
        }
    });

    // Lắng nghe trạng thái đang gõ phím
    window.registerListener(window.db.ref('typing_global_' + village), 'value', s => {
        const typingDiv = document.getElementById('global-typing-indicator');
        const data = s.val() || {};
        const names = Object.keys(data).filter(id => id !== window.session.id).map(id => data[id]);
        if (names.length > 0) {
            typingDiv.innerText = `${names.join(', ')} đang nhắn...`;
            typingDiv.classList.remove('hidden');
        } else { typingDiv.classList.add('hidden'); }
    });
};

window.sendGlobalChat = async () => {
    if (!window.session) return window.showToast('Bạn chưa đăng nhập!', 'error');
    const input = document.getElementById('global-chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    window.db.ref('typing_global_' + window.currentVillage + '/' + window.session.id).remove();
    
    const msg = {
        senderId: window.session.id, senderName: window.session.name,
        avatar: window.session.avatar || '', text: text, time: window.now(), isImage: false
    };
    await window.db.ref('chat_global_' + window.currentVillage).push(msg);
    
    if(typeof window.addPetExp === 'function') window.addPetExp(window.session.id, 1);
};

// Hiển thị trạng thái typing (Chung cho các Kênh)
window.onChatInput = (channel) => {
    if (!window.session) return;
    let typingRef;
    if (channel === 'global') typingRef = window.db.ref('typing_global_' + window.currentVillage + '/' + window.session.id);
    else if (channel === 'private') typingRef = window.db.ref(`typing_private/${window.currentPrivateConvo}/${window.session.id}`);
    else if (channel === 'group') typingRef = window.db.ref(`typing_group/${window.currentGroupChat}/${window.session.id}`);
    
    if (typingRef) {
        typingRef.set(window.session.name);
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => typingRef.remove(), 2000);
    }
};
// ==============================================================================
// PHẦN 7/12: CHAT RIÊNG (PRIVATE CHAT) & HỆ THỐNG NUÔI PET / CHUỖI LỬA
// ==============================================================================

// Tải danh sách bạn bè & Trạng thái Online (Giao diện giống Messenger)
window.loadPrivateContacts = () => {
    if(!window.session) return;
    const myId = window.session.id;
    const topZone = document.getElementById('tt-online-zone');
    const listZone = document.getElementById('recent-chat-list');
    
    topZone.innerHTML = ''; listZone.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-light);">Đang tải...</div>';
    
    window.db.ref('friends/' + myId).once('value').then(s => {
        const frs = s.val();
        if(!frs) {
            topZone.innerHTML = ''; listZone.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-light);">Bạn chưa có bạn bè nào để nhắn tin.</div>';
            return;
        }
        
        listZone.innerHTML = '';
        Object.keys(frs).forEach(fId => {
            window.db.ref('users/' + fId).once('value').then(u => {
                if(!u.exists()) return;
                const d = u.val();
                const convoId = myId < fId ? `${myId}_${fId}` : `${fId}_${myId}`;
                
                // Trích xuất Chuỗi lửa
                window.db.ref(`streaks/${convoId}`).once('value').then(strk => {
                    const streakVal = strk.exists() ? strk.val().val : 0;
                    
                    // Lấy trạng thái Online
                    window.db.ref('tracking/' + fId).once('value').then(trk => {
                        const isOnline = trk.exists() && trk.val().status === 'online';
                        
                        // Render Top Scroll (Người đang Online)
                        if(isOnline) {
                            topZone.innerHTML += `
                                <div class="tt-top-item" onclick="window.openPrivateChat('${fId}', '${d.name}')">
                                    <div style="position:relative;">
                                        <img src="${d.avatar || '1000086774.png'}" class="tt-top-avt" style="border: 2px solid #00e676;">
                                        <span style="position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:#00e676; border:2px solid var(--card); border-radius:50%;"></span>
                                    </div>
                                    <div class="tt-top-name">${d.name.split(' ').pop()}</div>
                                </div>
                            `;
                        }

                        // Render List Dọc (Tất cả bạn bè)
                        const streakHtml = streakVal > 0 ? `<span class="tt-streak">🔥 ${streakVal}</span>` : '';
                        listZone.innerHTML += `
                            <div class="tt-item" onclick="window.openPrivateChat('${fId}', '${d.name}')">
                                <div style="position:relative;">
                                    <img src="${d.avatar || '1000086774.png'}" class="tt-avt">
                                    ${isOnline ? '<span style="position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:#00e676; border:2px solid var(--card); border-radius:50%;"></span>' : ''}
                                </div>
                                <div class="tt-info">
                                    <div class="tt-name">${d.name} ${streakHtml}</div>
                                    <div class="tt-preview">Chạm để trò chuyện...</div>
                                </div>
                            </div>
                        `;
                    });
                });
            });
        });
    });
};

// Mở khung Chat Riêng
window.openPrivateChat = (targetId, targetName) => {
    document.getElementById('private-search-view').classList.add('hidden');
    document.getElementById('private-chat-area').classList.remove('hidden');
    document.getElementById('private-chat-title').innerText = targetName;
    
    const myId = window.session.id;
    window.currentPrivateConvo = myId < targetId ? `${myId}_${targetId}` : `${targetId}_${myId}`;
    window.currentTargetId = targetId;
    
    window.loadPrivateChatBox();
    window.loadPetUI(window.currentPrivateConvo);
};

// Đóng khung Chat Riêng
window.closePrivateChat = () => {
    document.getElementById('private-chat-area').classList.add('hidden');
    document.getElementById('private-search-view').classList.remove('hidden');
    if(window.currentChatRef) { window.currentChatRef.off(); window.currentChatRef = null; }
    if(window.currentStreakRef) { window.currentStreakRef.off(); window.currentStreakRef = null; }
    window.currentPrivateConvo = "";
    window.currentTargetId = "";
};

// Load tin nhắn Chat Riêng (Tối ưu DOM chống giật)
window.loadPrivateChatBox = () => {
    const box = document.getElementById('private-chat-box');
    box.innerHTML = '<div style="text-align:center;color:var(--text-light);font-size:12px;margin-top:20px;">Đang tải...</div>';
    
    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat_private/' + window.currentPrivateConvo).limitToLast(50);
    
    window.registerListener(window.currentChatRef, 'value', s => {
        box.innerHTML = '';
        const msgs = s.val();
        if (msgs) {
            Object.values(msgs).forEach(m => {
                const isMe = m.senderId === window.session.id;
                const timeStr = window.formatTime(m.time);
                const safeText = (m.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                
                const msgContent = m.isImage 
                    ? `<img src="${m.text}" style="max-width:200px;border-radius:10px;cursor:pointer;" onclick="window.viewFullImage('${m.text}')">` 
                    : `<div style="background:${isMe ? 'var(--pink)' : 'var(--border)'}; color:${isMe ? 'white' : 'var(--text)'}; padding:10px; border-radius:15px; display:inline-block; max-width:80%; word-break:break-word;">${safeText}</div>`;
                
                const div = document.createElement('div');
                div.style.display = 'flex'; div.style.gap = '10px'; div.style.alignItems = 'flex-end';
                div.style.justifyContent = isMe ? 'flex-end' : 'flex-start';
                
                div.innerHTML = isMe ? `
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <span style="font-size:10px; color:var(--text-light); margin-bottom:3px;">${timeStr}</span>
                        ${msgContent}
                    </div>
                ` : `
                    <div style="display:flex; flex-direction:column; align-items:flex-start;">
                        <span style="font-size:10px; color:var(--text-light); margin-bottom:3px;">${timeStr}</span>
                        ${msgContent}
                    </div>
                `;
                box.appendChild(div);
            });
            setTimeout(() => box.scrollTop = box.scrollHeight, 100);
        } else {
            box.innerHTML = '<div style="text-align:center;color:var(--text-light);font-size:12px;margin-top:20px;">Hãy gửi lời chào đầu tiên!</div>';
        }
    });

    // Bắt trạng thái đang gõ
    window.registerListener(window.db.ref(`typing_private/${window.currentPrivateConvo}/${window.currentTargetId}`), 'value', s => {
        const ind = document.getElementById('private-typing-indicator');
        if (s.exists()) { ind.innerText = `${s.val()} đang nhắn...`; ind.classList.remove('hidden'); } 
        else { ind.classList.add('hidden'); }
    });
};

// Gửi Chat Riêng
window.sendPrivateChat = async () => {
    if (!window.session || !window.currentPrivateConvo) return;
    const input = document.getElementById('private-chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    window.db.ref(`typing_private/${window.currentPrivateConvo}/${window.session.id}`).remove();
    
    const msg = { senderId: window.session.id, text: text, time: window.now(), isImage: false };
    await window.db.ref('chat_private/' + window.currentPrivateConvo).push(msg);
    
    // Cộng điểm Pet (Tin nhắn thường = 1 EXP)
    window.addPetExp(window.currentPrivateConvo, 1);
};

// Logic Nuôi Pet (Cộng điểm EXP)
window.addPetExp = (convoId, expToAdd) => {
    const ref = window.db.ref(`streaks/${convoId}`);
    ref.once('value').then(s => {
        const currentExp = s.exists() ? s.val().val : 0;
        ref.set({ val: currentExp + expToAdd, lastUpdate: window.now() });
    });
};

// Load Giao diện Pet & Chuỗi lửa
window.loadPetUI = (convoId) => {
    if (window.currentStreakRef) window.currentStreakRef.off();
    window.currentStreakRef = window.db.ref(`streaks/${convoId}`);
    
    window.registerListener(window.currentStreakRef, 'value', s => {
        const exp = s.exists() ? s.val().val : 0;
        document.getElementById('streak-val-num').innerText = exp;
        
        let currentStageIndex = 0;
        for (let i = window.petStages.length - 1; i >= 0; i--) {
            if (exp >= window.petStages[i].minExp) { currentStageIndex = i; break; }
        }
        
        const stage = window.petStages[currentStageIndex];
        const nextStage = window.petStages[currentStageIndex + 1];
        
        document.getElementById('pet-stage-img').src = stage.img;
        document.getElementById('pet-level-name').innerText = stage.name;
        
        if (nextStage) {
            const expNeeded = nextStage.minExp - stage.minExp;
            const expGot = exp - stage.minExp;
            const percent = (expGot / expNeeded) * 100;
            document.getElementById('pet-progress-bar').style.width = `${percent}%`;
            document.getElementById('pet-progress-text').innerText = `${expGot} / ${expNeeded} EXP`;
        } else {
            document.getElementById('pet-progress-bar').style.width = `100%`;
            document.getElementById('pet-progress-text').innerText = `MAX LEVEL 👑`;
        }
    });
};
// ==============================================================================
// PHẦN 8/12: HỆ THỐNG CHAT NHÓM (GROUP CHAT)
// ==============================================================================

// Tải danh sách các nhóm mà người dùng đang tham gia
window.loadMyGroups = () => {
    if(!window.session) return;
    const listZone = document.getElementById('my-groups-list');
    listZone.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-light);">Đang tải...</div>';
    
    window.registerListener(window.db.ref('group_members'), 'value', s => {
        listZone.innerHTML = '';
        const allGrps = s.val() || {};
        let hasGroup = false;
        
        Object.keys(allGrps).forEach(gId => {
            if (allGrps[gId][window.session.id]) {
                hasGroup = true;
                window.db.ref('groups/' + gId).once('value').then(g => {
                    if(!g.exists()) return;
                    const d = g.val();
                    listZone.innerHTML += `
                        <div class="tt-item" onclick="window.openGroupChat('${gId}', '${d.name}', '${d.admin}')">
                            <div style="position:relative;">
                                <div style="width:50px; height:50px; border-radius:50%; background:var(--pink); color:white; display:flex; justify-content:center; align-items:center; font-size:24px; font-weight:bold;">${d.name.charAt(0).toUpperCase()}</div>
                            </div>
                            <div class="tt-info">
                                <div class="tt-name">${d.name}</div>
                                <div class="tt-preview">Chạm để vào nhóm...</div>
                            </div>
                        </div>
                    `;
                });
            }
        });
        if(!hasGroup) listZone.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-light);">Bạn chưa tham gia nhóm nào.</div>';
    });
};

// Khởi tạo Nhóm mới
window.openCreateGroupModal = () => {
    const name = prompt("Nhập tên nhóm mới:");
    if(!name || name.trim() === '') return;
    
    const gId = 'g_' + window.now();
    window.db.ref('groups/' + gId).set({ name: name.trim(), admin: window.session.id, createdAt: window.now() }).then(() => {
        window.db.ref(`group_members/${gId}/${window.session.id}`).set(true);
        window.showToast("Tạo nhóm thành công!", "success");
    });
};

// Mở khung Chat Nhóm
window.openGroupChat = (gId, gName, gAdmin) => {
    document.getElementById('group-list-view').classList.add('hidden');
    document.getElementById('group-chat-area').classList.remove('hidden');
    document.getElementById('group-chat-title').innerText = gName;
    
    window.currentGroupChat = gId;
    window.currentGroupAdmin = gAdmin;
    window.loadGroupChatBox();
};

window.closeGroupChat = () => {
    document.getElementById('group-chat-area').classList.add('hidden');
    document.getElementById('group-list-view').classList.remove('hidden');
    if(window.currentChatRef) { window.currentChatRef.off(); window.currentChatRef = null; }
    window.currentGroupChat = ""; window.currentGroupAdmin = "";
};

// Tải tin nhắn Nhóm (Tối ưu DOM)
window.loadGroupChatBox = () => {
    const box = document.getElementById('group-chat-box');
    box.innerHTML = '<div style="text-align:center;color:var(--text-light);font-size:12px;margin-top:20px;">Đang tải...</div>';
    
    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat_group/' + window.currentGroupChat).limitToLast(50);
    
    window.registerListener(window.currentChatRef, 'value', s => {
        box.innerHTML = '';
        const msgs = s.val();
        if (msgs) {
            Object.values(msgs).forEach(m => {
                const isMe = m.senderId === window.session.id;
                const timeStr = window.formatTime(m.time);
                const safeText = (m.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                
                const msgContent = m.isImage 
                    ? `<img src="${m.text}" style="max-width:200px;border-radius:10px;cursor:pointer;" onclick="window.viewFullImage('${m.text}')">` 
                    : `<div style="background:${isMe ? 'var(--pink)' : 'var(--border)'}; color:${isMe ? 'white' : 'var(--text)'}; padding:10px; border-radius:15px; display:inline-block; max-width:80%; word-break:break-word;">${safeText}</div>`;
                
                const div = document.createElement('div');
                div.style.display = 'flex'; div.style.gap = '10px'; div.style.alignItems = 'flex-end';
                div.style.justifyContent = isMe ? 'flex-end' : 'flex-start';
                
                div.innerHTML = isMe ? `
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <span style="font-size:10px; color:var(--text-light); margin-bottom:3px;">${timeStr}</span>
                        ${msgContent}
                    </div>
                ` : `
                    <img src="${m.avatar || '1000086774.png'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; cursor:pointer;" onclick="window.openUserProfile('${m.senderId}')">
                    <div style="display:flex; flex-direction:column; align-items:flex-start;">
                        <span style="font-size:10px; color:var(--text-light); margin-bottom:3px; font-weight:bold;">${m.senderName} • ${timeStr}</span>
                        ${msgContent}
                    </div>
                `;
                box.appendChild(div);
            });
            setTimeout(() => box.scrollTop = box.scrollHeight, 100);
        } else {
            box.innerHTML = '<div style="text-align:center;color:var(--text-light);font-size:12px;margin-top:20px;">Hãy gửi tin nhắn đầu tiên!</div>';
        }
    });

    // Bắt trạng thái đang gõ
    window.registerListener(window.db.ref(`typing_group/${window.currentGroupChat}`), 'value', s => {
        const ind = document.getElementById('group-typing-indicator');
        const data = s.val() || {};
        const names = Object.keys(data).filter(id => id !== window.session.id).map(id => data[id]);
        if (names.length > 0) { ind.innerText = `${names.join(', ')} đang nhắn...`; ind.classList.remove('hidden'); } 
        else { ind.classList.add('hidden'); }
    });
};

window.sendGroupChat = async () => {
    if (!window.session || !window.currentGroupChat) return;
    const input = document.getElementById('group-chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    window.db.ref(`typing_group/${window.currentGroupChat}/${window.session.id}`).remove();
    
    const msg = { senderId: window.session.id, senderName: window.session.name, avatar: window.session.avatar || '', text: text, time: window.now(), isImage: false };
    await window.db.ref('chat_group/' + window.currentGroupChat).push(msg);
};

// Quản lý thành viên Nhóm
window.openGroupManageModal = () => {
    const isAdmin = window.session.id === window.currentGroupAdmin;
    document.getElementById('group-admin-status').innerText = isAdmin ? "Bạn là Quản trị viên" : "Bạn là Thành viên";
    
    const addZone = document.getElementById('group-add-member-zone');
    if(isAdmin) addZone.classList.remove('hidden'); else addZone.classList.add('hidden');
    
    const ul = document.getElementById('group-member-list');
    ul.innerHTML = '<li>Đang tải...</li>';
    
    window.db.ref('group_members/' + window.currentGroupChat).once('value').then(s => {
        ul.innerHTML = '';
        Object.keys(s.val() || {}).forEach(mId => {
            window.db.ref('users/' + mId).once('value').then(u => {
                if(u.exists()) {
                    const kickBtn = (isAdmin && mId !== window.session.id) ? `<button style="background:#dc3545; color:white; border:none; padding:3px 8px; border-radius:5px;" onclick="window.kickGroupMember('${mId}')">Xóa</button>` : '';
                    ul.innerHTML += `<li style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border);"><span>${u.val().name} (${mId})</span> ${kickBtn}</li>`;
                }
            });
        });
    });
    window.toggleModal('group-manage-modal', true);
};

window.addGroupMember = () => {
    const id = document.getElementById('new-member-id').value.trim().toLowerCase();
    if(!id) return window.showToast("Nhập ID cần thêm!", "error");
    window.db.ref('users/' + id).once('value').then(s => {
        if(s.exists()) {
            window.db.ref(`group_members/${window.currentGroupChat}/${id}`).set(true).then(() => {
                window.showToast("Đã thêm thành viên!", "success");
                document.getElementById('new-member-id').value = '';
                window.openGroupManageModal(); // Reload list
            });
        } else { window.showToast("ID không tồn tại!", "error"); }
    });
};

window.kickGroupMember = (mId) => {
    if(confirm("Xóa thành viên này khỏi nhóm?")) {
        window.db.ref(`group_members/${window.currentGroupChat}/${mId}`).remove().then(() => {
            window.showToast("Đã xóa thành viên!", "success");
            window.openGroupManageModal();
        });
    }
};
// ==============================================================================
// PHẦN 9/12: GỬI ẢNH TIN NHẮN & BẢNG VÀNG KỶ LỤC (LEADERBOARD)
// ==============================================================================

// Kích hoạt nút chọn ảnh theo từng Kênh Chat
window.triggerChatImage = (channel) => {
    window.currentUploadType = channel;
    document.getElementById('chat-img-file').click();
};

// Xử lý up ảnh lên ImgBB và đẩy vào luồng Chat
window.uploadChatImage = async () => {
    const input = document.getElementById('chat-img-file');
    const file = input.files[0];
    if (!file) return;
    
    // Up ảnh lấy link
    const url = await window.uploadToImgBB(file);
    if (!url) { input.value = ''; return; }
    
    // Cấu trúc tin nhắn ảnh
    const msg = { 
        senderId: window.session.id, 
        senderName: window.session.name, 
        avatar: window.session.avatar || '', 
        text: url, 
        time: window.now(), 
        isImage: true 
    };
    
    // Phân loại kênh gửi
    if (window.currentUploadType === 'global') {
        await window.db.ref('chat_global_' + window.currentVillage).push(msg);
    } 
    else if (window.currentUploadType === 'private') {
        await window.db.ref('chat_private/' + window.currentPrivateConvo).push(msg);
        window.addPetExp(window.currentPrivateConvo, 10); // Thưởng 10đ EXP cho Nhiệm vụ gửi ảnh
    } 
    else if (window.currentUploadType === 'group') {
        await window.db.ref('chat_group/' + window.currentGroupChat).push(msg);
    }
    
    input.value = ''; // Reset input
};

// 🏆 Cập nhật Bảng Vàng Kỷ Lục Chuỗi Lửa (Top 3)
window.updateLeaderboard = () => {
    const zone = document.getElementById('leaderboard-zone');
    if(!zone) return;
    zone.innerText = "Đang tải dữ liệu...";
    
    window.db.ref('streaks').once('value').then(s => {
        const data = s.val();
        if(!data) { zone.innerText = "Chưa có kỷ lục nào!"; return; }
        
        let list = [];
        Object.keys(data).forEach(k => {
            // Lọc các chuỗi hợp lệ (có chứa dấu _ phân cách 2 ID)
            if(k.includes('_')) {
                list.push({ ids: k.split('_'), val: data[k].val || 0 });
            }
        });
        
        // Sắp xếp giảm dần theo EXP
        list.sort((a, b) => b.val - a.val);
        const top3 = list.slice(0, 3);
        
        // Truy xuất tên thật của các ID trong Top 3
        Promise.all(top3.map(item => {
            return Promise.all([
                window.db.ref('users/' + item.ids[0]).once('value'),
                window.db.ref('users/' + item.ids[1]).once('value')
            ]).then(snaps => {
                const n1 = snaps[0].exists() ? snaps[0].val().name.split(' ').pop() : "???";
                const n2 = snaps[1].exists() ? snaps[1].val().name.split(' ').pop() : "???";
                return `${n1} & ${n2} (🔥 ${item.val})`;
            });
        })).then(results => {
            if(results.length > 0) {
                zone.innerHTML = results.map((r, i) => `
                    <div style="margin: 5px 0; padding: 5px; background: rgba(0,0,0,0.1); border-radius: 8px;">
                        ${i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉')} ${r}
                    </div>
                `).join('');
            } else {
                zone.innerText = "Chưa có kỷ lục nào!";
            }
        });
    });
};
// ==============================================================================
// PHẦN 10/12: SỔ ĐIỂM, ĐIỂM CÁ NHÂN & TRACKING HOẠT ĐỘNG (CHỐNG GIẬT LAG DOM)
// ==============================================================================

// Hàm tính trung bình môn tự động (M=1, 15P=1, 1T=2, Thi=3)
window.calcAvg = (g) => {
    if (!g) return '';
    let sum = 0, count = 0;
    if(g.m !== undefined && g.m !== '') { sum += Number(g.m); count += 1; }
    if(g['15p'] !== undefined && g['15p'] !== '') { sum += Number(g['15p']); count += 1; }
    if(g['1t'] !== undefined && g['1t'] !== '') { sum += Number(g['1t']) * 2; count += 2; }
    if(g.thi !== undefined && g.thi !== '') { sum += Number(g.thi) * 3; count += 3; }
    return count === 0 ? '' : (sum / count).toFixed(1);
};

// --- SỔ ĐIỂM TỔNG HỢP (DÀNH CHO ADMIN / GIÁO VIÊN) ---
window.loadMasterGrades = () => {
    const tbody = document.getElementById('master-grade-body');
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 20px;">Đang tải dữ liệu...</td></tr>';

    Promise.all([
        window.db.ref('users').once('value'),
        window.db.ref('grades').once('value')
    ]).then(snaps => {
        const users = snaps[0].val() || {};
        const grades = snaps[1].val() || {};
        let htmlRows = []; // Chứa HTML trong RAM, kết xuất ra DOM 1 lần duy nhất để chống giật lag

        Object.keys(users).forEach(uId => {
            const u = users[uId];
            if (u.role === 'hs' && !u.isLocked) {
                const g1 = (grades[uId] && grades[uId]['1']) || {};
                const g2 = (grades[uId] && grades[uId]['2']) || {};
                const tb1 = window.calcAvg(g1);
                const tb2 = window.calcAvg(g2);
                let caNam = '';
                if (tb1 !== '' && tb2 !== '') caNam = ((Number(tb1) + Number(tb2) * 2) / 3).toFixed(1);

                htmlRows.push(`
                    <tr onclick="if(window.session.role==='admin' || window.session.role==='gv') window.openScoreModal('${uId}', '${u.name}')">
                        <td class="sticky-col" style="font-weight:bold; color:var(--pink); cursor:pointer;">${u.name}</td>
                        <td>${g1.m || ''}</td><td>${g1['15p'] || ''}</td><td>${g1['1t'] || ''}</td><td>${g1.thi || ''}</td><td style="font-weight:bold; background:var(--soft);">${tb1}</td>
                        <td>${g2.m || ''}</td><td>${g2['15p'] || ''}</td><td>${g2['1t'] || ''}</td><td>${g2.thi || ''}</td><td style="font-weight:bold; background:var(--soft);">${tb2}</td>
                        <td style="font-weight:900; color:#FF9800; font-size:16px;">${caNam}</td>
                    </tr>
                `);
            }
        });

        if (htmlRows.length > 0) tbody.innerHTML = htmlRows.join('');
        else tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:20px;">Chưa có học sinh nào trên hệ thống.</td></tr>';
    });
};

// --- ĐIỂM CÁ NHÂN (DÀNH CHO HỌC SINH) ---
window.loadPersonalGrades = () => {
    if(!window.session || window.session.role !== 'hs') {
        document.getElementById('personal-grades-ui').innerHTML = '<p style="text-align:center; color:var(--text-light); padding:20px;">Chỉ Học Sinh mới xem được mục này.</p>';
        return;
    }
    
    // Tối ưu: Chỉ lắng nghe điểm của đúng học sinh đang đăng nhập
    window.registerListener(window.db.ref('grades/' + window.session.id), 'value', s => {
        const d = s.val() || {};
        const g1 = d['1'] || {};
        const g2 = d['2'] || {};
        const tb1 = window.calcAvg(g1);
        const tb2 = window.isHk2Locked ? '?' : window.calcAvg(g2);
        
        const msgHk2 = document.getElementById('lock-msg-hs');
        if(msgHk2) {
            if(window.isHk2Locked) msgHk2.classList.remove('hidden');
            else msgHk2.classList.add('hidden');
        }

        let caNam = '?';
        if(tb1 !== '' && tb2 !== '?' && tb2 !== '') caNam = ((Number(tb1) + Number(tb2) * 2) / 3).toFixed(1);

        document.getElementById('personal-grades-ui').innerHTML = `
            <div style="background:var(--bg); padding:15px; border-radius:10px; border:1px solid var(--border); margin-bottom:10px;">
                <h4 style="color:var(--pink); margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:5px;">HỌC KỲ 1</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:14px;">
                    <span>Miệng: <b>${g1.m || '-'}</b></span><span>15 Phút: <b>${g1['15p'] || '-'}</b></span>
                    <span>1 Tiết: <b>${g1['1t'] || '-'}</b></span><span>Thi: <b>${g1.thi || '-'}</b></span>
                    <span style="grid-column: span 2; margin-top:5px; color:#4CAF50;">Hạnh kiểm: <b>${g1.conduct || 'Chưa xét'}</b></span>
                </div>
                <div style="margin-top:10px; background:var(--soft); padding:10px; border-radius:10px; text-align:center; font-weight:bold;">TỔNG KẾT HK1: <span style="color:#FF9800; font-size:18px;">${tb1 || '-'}</span></div>
            </div>

            <div style="background:var(--bg); padding:15px; border-radius:10px; border:1px solid var(--border); margin-bottom:15px; opacity: ${window.isHk2Locked ? '0.6' : '1'};">
                <h4 style="color:var(--pink); margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:5px;">HỌC KỲ 2 ${window.isHk2Locked ? '🔒' : ''}</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:14px;">
                    <span>Miệng: <b>${window.isHk2Locked ? '?' : (g2.m || '-')}</b></span><span>15 Phút: <b>${window.isHk2Locked ? '?' : (g2['15p'] || '-')}</b></span>
                    <span>1 Tiết: <b>${window.isHk2Locked ? '?' : (g2['1t'] || '-')}</b></span><span>Thi: <b>${window.isHk2Locked ? '?' : (g2.thi || '-')}</b></span>
                    <span style="grid-column: span 2; margin-top:5px; color:#4CAF50;">Hạnh kiểm: <b>${window.isHk2Locked ? '?' : (g2.conduct || 'Chưa xét')}</b></span>
                </div>
                <div style="margin-top:10px; background:var(--soft); padding:10px; border-radius:10px; text-align:center; font-weight:bold;">TỔNG KẾT HK2: <span style="color:#FF9800; font-size:18px;">${tb2 || '-'}</span></div>
            </div>
            
            <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color:white; padding:15px; border-radius:10px; text-align:center; font-weight:900; font-size:18px; box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);">
                ĐIỂM TRUNG BÌNH CẢ NĂM: ${caNam}
            </div>
        `;
    });
};

// --- THEO DÕI HOẠT ĐỘNG (TRACKING) ---
window.loadTracking = () => {
    const tbody = document.getElementById('tracking-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Đang tải...</td></tr>';
    
    // Tối ưu: Lắng nghe 50 hoạt động gần nhất thay vì load toàn bộ cục database
    window.registerListener(window.db.ref('tracking').orderByChild('timeIn').limitToLast(50), 'value', s => {
        let htmlRows = [];
        const data = s.val() || {};
        
        // Sắp xếp mảng để người mới đăng nhập nằm trên cùng
        const arr = Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a,b) => b.timeIn - a.timeIn);
        
        arr.forEach(t => {
            const statusColor = t.status === 'online' ? '#00e676' : 'var(--text-light)';
            htmlRows.push(`
                <tr>
                    <td style="font-weight:bold; color:var(--text);">${t.name}</td>
                    <td>${t.role.toUpperCase()}</td>
                    <td style="color:${statusColor}; font-weight:bold;">${t.status === 'online' ? 'ONLINE' : 'OFFLINE'}</td>
                    <td>${window.formatTime(t.timeIn)}</td>
                    <td>${window.formatTime(t.timeOut) || '-'}</td>
                </tr>
            `);
        });
        if (htmlRows.length > 0) tbody.innerHTML = htmlRows.join('');
        else tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Chưa có dữ liệu theo dõi.</td></tr>';
    });
};
// ==============================================================================
// PHẦN 11/12: CHỈNH SỬA ĐIỂM (MODAL), BẢNG THÔNG BÁO & DANH SÁCH TÀI KHOẢN
// ==============================================================================

// --- CỬA SỔ NHẬP ĐIỂM (MODAL) ---
window.openScoreModal = (id, name) => {
    document.getElementById('score-u-id').value = id;
    document.getElementById('score-u-name').innerText = "Học sinh: " + name;
    document.getElementById('score-term').value = "1";
    window.loadStudentScoreIntoModal();
    window.toggleModal('score-modal', true);
};

window.loadStudentScoreIntoModal = () => {
    const id = document.getElementById('score-u-id').value;
    const term = document.getElementById('score-term').value;
    
    // Reset form trước khi nạp điểm mới
    ['score-m', 'score-15p', 'score-1t', 'score-thi'].forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('score-conduct').value = 'Tốt';
    
    window.db.ref(`grades/${id}/${term}`).once('value').then(s => {
        if(s.exists()) {
            const d = s.val();
            if(d.m !== undefined) document.getElementById('score-m').value = d.m;
            if(d['15p'] !== undefined) document.getElementById('score-15p').value = d['15p'];
            if(d['1t'] !== undefined) document.getElementById('score-1t').value = d['1t'];
            if(d.thi !== undefined) document.getElementById('score-thi').value = d.thi;
            if(d.conduct) document.getElementById('score-conduct').value = d.conduct;
        }
    });
};

window.confirmSaveScore = () => {
    const id = document.getElementById('score-u-id').value;
    const term = document.getElementById('score-term').value;
    
    const m = document.getElementById('score-m').value;
    const p15 = document.getElementById('score-15p').value;
    const t1 = document.getElementById('score-1t').value;
    const thi = document.getElementById('score-thi').value;
    const conduct = document.getElementById('score-conduct').value;
    
    const payload = {};
    if(m !== '') payload.m = Number(m);
    if(p15 !== '') payload['15p'] = Number(p15);
    if(t1 !== '') payload['1t'] = Number(t1);
    if(thi !== '') payload.thi = Number(thi);
    payload.conduct = conduct;
    
    window.db.ref(`grades/${id}/${term}`).set(payload).then(() => {
        window.showToast("Lưu điểm thành công!", "success");
        window.toggleModal('score-modal', false);
        if(typeof window.loadMasterGrades === 'function') window.loadMasterGrades();
    });
};

// --- BẢNG THÔNG BÁO (RULES / ANNOUNCEMENTS) ---
window.loadAnnouncements = () => {
    // Admin mới thấy khung đăng thông báo
    if(window.session && window.session.role === 'admin') {
        document.getElementById('rules-editor-zone').classList.remove('hidden');
    } else {
        document.getElementById('rules-editor-zone').classList.add('hidden');
    }
    
    const box = document.getElementById('rules-display');
    box.innerHTML = '<div style="text-align:center;color:var(--text-light);">Đang tải thông báo...</div>';
    
    window.registerListener(window.db.ref('announcements').orderByChild('time').limitToLast(30), 'value', s => {
        box.innerHTML = '';
        const data = s.val();
        if(data) {
            const arr = Object.keys(data).map(k => ({id: k, ...data[k]})).sort((a,b) => b.time - a.time);
            let html = [];
            arr.forEach(a => {
                // Lọc hiển thị theo target (All, Học sinh, Giáo viên, Cựu HS)
                if(a.target === 'all' || (window.session && a.target === window.session.role) || (window.session && window.session.role === 'admin')) {
                    const timeStr = window.formatTime(a.time);
                    const safeText = (a.text || '').replace(/\n/g, "<br>");
                    const targetBadge = a.target === 'all' ? '🌐 Tất cả' : (a.target === 'hs' ? '🎓 Học sinh' : (a.target === 'gv' ? '👨‍🏫 Giáo viên' : '🕰️ Cựu HS'));
                    
                    const delBtn = (window.session && window.session.role === 'admin') ? `<button style="background:transparent; border:none; color:#dc3545; font-size:16px; cursor:pointer;" onclick="window.deleteAnnouncement('${a.id}')"><i class="fas fa-trash"></i></button>` : '';
                    
                    html.push(`
                        <div style="background:var(--bg); border-left:4px solid var(--pink); padding:15px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                <div>
                                    <div style="font-weight:bold; color:var(--pink);"><i class="fas fa-bullhorn"></i> Trạm Thông Báo <span style="font-size:10px; color:var(--text-light); font-weight:normal; margin-left:10px;">${timeStr}</span></div>
                                    <div style="font-size:10px; background:var(--soft); color:var(--pink); display:inline-block; padding:2px 8px; border-radius:10px; margin-top:5px;">Gửi đến: ${targetBadge}</div>
                                </div>
                                ${delBtn}
                            </div>
                            <div style="font-size:14px; line-height:1.5;">${safeText}</div>
                        </div>
                    `);
                }
            });
            if(html.length > 0) box.innerHTML = html.join('');
            else box.innerHTML = '<div style="text-align:center;color:var(--text-light);">Chưa có thông báo nào dành cho bạn.</div>';
        } else {
            box.innerHTML = '<div style="text-align:center;color:var(--text-light);">Chưa có thông báo.</div>';
        }
    });
};

window.saveAnnouncement = () => {
    const text = document.getElementById('rules-input').value.trim();
    const target = document.getElementById('announce-target').value;
    if(!text) return window.showToast("Vui lòng nhập nội dung!", "error");
    
    const btn = document.querySelector('#rules-editor-zone button');
    btn.disabled = true; btn.innerText = "ĐANG ĐĂNG...";
    
    window.db.ref('announcements').push({ text: text, target: target, time: window.now() }).then(() => {
        document.getElementById('rules-input').value = '';
        window.showToast("Đã đăng thông báo!", "success");
        btn.disabled = false; btn.innerText = "ĐĂNG 🚀";
    });
};

window.deleteAnnouncement = (id) => {
    if(confirm("Bạn có chắc muốn xóa thông báo này?")) {
        window.db.ref('announcements/' + id).remove().then(() => window.showToast("Đã xóa thông báo!", "success"));
    }
};

// --- DANH SÁCH TÀI KHOẢN (TAB ACCOUNT) ---
window.loadUsers = () => {
    if (!window.session || window.session.role !== 'admin') return;
    ['list-gv', 'list-hs', 'list-cuu-hs'].forEach(id => document.getElementById(id).innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>');
    
    window.db.ref('users').once('value').then(s => {
        window.allUsersCache = s.val() || {}; // Cache lại dữ liệu để ô Tìm Kiếm quét không bị lag
        window.renderUsersList(window.allUsersCache);
    });
};

window.renderUsersList = (usersObj) => {
    let gvHtml = [], hsHtml = [], cuuHtml = [];
    
    Object.keys(usersObj).forEach(id => {
        const u = usersObj[id];
        const lockStr = u.isLocked ? `<br><span style="color:#dc3545;font-weight:bold;font-size:11px;">[ĐÃ KHÓA]</span>` : '';
        const row = `
            <tr>
                <td style="font-weight:bold;">${id.toUpperCase()}</td>
                <td>${u.name} ${lockStr}</td>
                <td>${u.isLocked ? (u.lockReason || 'Vi phạm') : 'Hoạt động'}</td>
                <td>${u.birthyear || '-'}</td>
                <td><button class="btn-royal" style="padding:5px 10px; font-size:12px;" onclick="window.openUserActionModal('${id}', '${u.name}')">Cài đặt</button></td>
            </tr>
        `;
        if (u.role === 'gv') gvHtml.push(row);
        else if (u.role === 'hs') hsHtml.push(row);
        else if (u.role === 'cuu_hs') cuuHtml.push(row);
    });
    
    document.getElementById('list-gv').innerHTML = gvHtml.length > 0 ? gvHtml.join('') : '<tr><td colspan="5" style="text-align:center;">Trống</td></tr>';
    document.getElementById('list-hs').innerHTML = hsHtml.length > 0 ? hsHtml.join('') : '<tr><td colspan="5" style="text-align:center;">Trống</td></tr>';
    document.getElementById('list-cuu-hs').innerHTML = cuuHtml.length > 0 ? cuuHtml.join('') : '<tr><td colspan="5" style="text-align:center;">Trống</td></tr>';
};

// Tìm kiếm lọc Realtime trong danh sách
window.searchStudent = () => {
    const keyword = document.getElementById('search-user').value.toLowerCase().trim();
    if (!window.allUsersCache) return;
    
    if (keyword === '') { window.renderUsersList(window.allUsersCache); return; }
    
    let filtered = {};
    Object.keys(window.allUsersCache).forEach(id => {
        const u = window.allUsersCache[id];
        if (id.includes(keyword) || u.name.toLowerCase().includes(keyword)) {
            filtered[id] = u;
        }
    });
    window.renderUsersList(filtered);
};
// ==============================================================================
// PHẦN 12/12: QUYỀN LỰC ADMIN (USER, DỮ LIỆU) & TRUNG TÂM HỖ TRỢ
// ==============================================================================

// --- TẠO TÀI KHOẢN MỚI (Mã hóa mật khẩu) ---
window.createNewUser = async () => {
    const id = document.getElementById('new-id').value.trim().toLowerCase();
    const name = document.getElementById('new-name').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    const role = document.getElementById('new-role').value;
    
    if(!id || !name || !pass) return window.showToast("Điền đủ thông tin!", "error");
    
    const btn = document.querySelector('#tab-users .btn-royal');
    btn.disabled = true; btn.innerText = "ĐANG TẠO...";
    
    // Băm mật khẩu ra mã vô nghĩa trước khi lưu
    const hashedPass = await window.hashPassword(pass);
    
    window.db.ref('users/' + id).once('value').then(s => {
        if(s.exists()) {
            window.showToast("ID này đã tồn tại!", "error");
            btn.disabled = false; btn.innerText = "TẠO ✅";
            return;
        }
        
        window.db.ref('users/' + id).set({ name, role, birthyear: "", quote: "", bio: "", avatar: "", isLocked: false }).then(() => {
            window.db.ref('user_passwords/' + id).set(hashedPass).then(() => {
                window.showToast("Tạo tài khoản thành công!", "success");
                ['new-id', 'new-name', 'new-pass'].forEach(fid => document.getElementById(fid).value = '');
                btn.disabled = false; btn.innerText = "TẠO ✅";
                if(typeof window.loadUsers === 'function') window.loadUsers();
            });
        });
    });
};

// --- QUẢN LÝ TÀI KHOẢN (SỬA PASS, KHÓA, XÓA) ---
window.openUserActionModal = (id, name) => {
    document.getElementById('action-u-name').innerText = "Đang chọn: " + name;
    document.getElementById('btn-action-edit').onclick = () => { window.toggleModal('user-action-modal', false); window.openEditUser(id, name); };
    document.getElementById('btn-action-lock').onclick = () => { window.toggleModal('user-action-modal', false); window.openLockModal(id, name); };
    document.getElementById('btn-action-delete').onclick = () => { window.toggleModal('user-action-modal', false); window.openDeleteModal(id, name); };
    window.toggleModal('user-action-modal', true);
};

// Đổi Pass
window.openEditUser = (id, name) => {
    document.getElementById('edit-u-name').innerText = name;
    document.getElementById('edit-u-new-id').value = id;
    document.getElementById('edit-u-pass').value = '';
    window.toggleModal('edit-user-modal', true);
};
window.saveUserEdit = async () => {
    const id = document.getElementById('edit-u-new-id').value;
    const newPass = document.getElementById('edit-u-pass').value.trim();
    if(!newPass) return window.showToast("Hãy nhập mật khẩu mới!", "error");
    
    const hashedPass = await window.hashPassword(newPass);
    window.db.ref('user_passwords/' + id).set(hashedPass).then(() => {
        window.showToast("Đã cấp mật khẩu mới thành công!", "success");
        window.toggleModal('edit-user-modal', false);
    });
};

// Khóa
window.openLockModal = (id, name) => {
    document.getElementById('lock-u-id').value = id;
    document.getElementById('lock-u-name').innerText = name;
    window.db.ref('users/' + id + '/isLocked').once('value').then(s => {
        if(s.val() === true) {
            if(confirm("Tài khoản này đang bị khóa. Bạn muốn MỞ KHÓA?")) {
                window.db.ref('users/' + id).update({ isLocked: false, lockReason: null }).then(() => {
                    window.showToast("Đã mở khóa tài khoản!", "success");
                    if(typeof window.loadUsers === 'function') window.loadUsers();
                });
            }
        } else {
            document.getElementById('lock-reason-input').value = '';
            window.toggleModal('lock-reason-modal', true);
        }
    });
};
window.confirmLockUser = () => {
    const id = document.getElementById('lock-u-id').value;
    const reason = document.getElementById('lock-reason-input').value.trim() || "Vi phạm quy định";
    window.db.ref('users/' + id).update({ isLocked: true, lockReason: reason }).then(() => {
        window.showToast("Đã khóa tài khoản!", "success");
        window.toggleModal('lock-reason-modal', false);
        if(typeof window.loadUsers === 'function') window.loadUsers();
    });
};

// Xóa vĩnh viễn
window.openDeleteModal = (id, name) => {
    document.getElementById('delete-u-id').value = id;
    document.getElementById('delete-u-name').innerText = name;
    document.getElementById('delete-reason-input').value = '';
    window.toggleModal('delete-reason-modal', true);
};
window.confirmDeleteUser = () => {
    const id = document.getElementById('delete-u-id').value;
    window.db.ref('users/' + id).remove().then(() => {
        window.db.ref('user_passwords/' + id).remove();
        window.db.ref('grades/' + id).remove();
        window.showToast("Đã xóa vĩnh viễn!", "success");
        window.toggleModal('delete-reason-modal', false);
        if(typeof window.loadUsers === 'function') window.loadUsers();
    });
};

// --- QUẢN LÝ DỮ LIỆU & RESET ---
window.openClearDataAuth = () => { document.getElementById('clear-pin-input').value = ''; window.toggleModal('clear-auth-modal', true); };
window.verifyClearPin = () => {
    const p = document.getElementById('clear-pin-input').value;
    if(p === window.currentClearPin) {
        window.toggleModal('clear-auth-modal', false);
        window.toggleModal('clear-confirm-modal', true);
    } else window.showToast("Sai mã PIN!", "error");
};
window.changeClearPin = () => {
    const o = document.getElementById('old-pin-input').value;
    const n = document.getElementById('new-pin-input').value;
    if(o === window.currentClearPin && n) {
        window.currentClearPin = n; window.showToast("Đổi PIN thành công!", "success");
        document.getElementById('old-pin-input').value = ''; document.getElementById('new-pin-input').value = '';
    } else window.showToast("Sai PIN cũ hoặc PIN mới trống!", "error");
};

window.executeUpgradeYear = () => {
    if(!confirm("BẠN CÓ CHẮC CHẮN?\\nToàn bộ Học Sinh hiện tại sẽ thành Cựu Học Sinh.\\nToàn bộ Sổ Điểm sẽ bị xóa trắng!")) return;
    window.db.ref('users').once('value').then(s => {
        const u = s.val() || {};
        let updates = {};
        const currentYear = new Date().getFullYear();
        Object.keys(u).forEach(id => {
            if(u[id].role === 'hs') {
                updates[`users/${id}/role`] = 'cuu_hs';
                updates[`users/${id}/cohort`] = `${currentYear - 3} - ${currentYear}`;
            }
        });
        updates['grades'] = null; // Xóa sổ điểm
        window.db.ref().update(updates).then(() => {
            window.showToast("Chuyển giao năm học thành công!", "success");
            window.toggleModal('clear-confirm-modal', false);
        });
    });
};

window.executeClearAlumni = () => {
    if(!confirm("Xóa vĩnh viễn toàn bộ Cựu Học Sinh?")) return;
    window.db.ref('users').once('value').then(s => {
        const u = s.val() || {};
        let updates = {};
        Object.keys(u).forEach(id => { if(u[id].role === 'cuu_hs') { updates[`users/${id}`] = null; updates[`user_passwords/${id}`] = null; } });
        window.db.ref().update(updates).then(() => { window.showToast("Đã dọn dẹp Cựu HS!", "success"); window.toggleModal('clear-confirm-modal', false); });
    });
};

window.executeHardReset = () => {
    if(!confirm("CẢNH BÁO MỨC ĐỘ CAO NHẤT!\\nHành động này sẽ xóa sạch: Users, Passwords, Chat, Grades, Groups. Bạn chắc chứ?")) return;
    if(!confirm("XÓA LÀ KHÔNG THỂ KHÔI PHỤC! XÓA?")) return;
    
    const adminId = window.session.id;
    const adminData = window.session;
    
    window.db.ref().set({
        config: { maintenanceMode: false, lockHk2: false, demoMode: false },
        users: { [adminId]: adminData }
    }).then(() => {
        window.showToast("ĐÃ RESET TOÀN BỘ HỆ THỐNG!", "success");
        setTimeout(() => location.reload(), 2000);
    });
};

// --- ĐỔI GIAO DIỆN (BRANDING) ---
window.previewBrandLogo = i => { const f = i.files[0]; if(!f) return; window.tempBrandFile = f; const r = new FileReader(); r.onload = e => { document.getElementById('brand-preview-logo').src = e.target.result; document.getElementById('brand-preview-logo').classList.remove('hidden'); }; r.readAsDataURL(f); };
window.previewSplashLogo = i => { const f = i.files[0]; if(!f) return; window.tempSplashFile = f; const r = new FileReader(); r.onload = e => { document.getElementById('splash-preview-logo').src = e.target.result; document.getElementById('splash-preview-logo').classList.remove('hidden'); }; r.readAsDataURL(f); };
window.saveBranding = async () => {
    let b = { name: document.getElementById('brand-name-input').value || "KIM MIN LAI" };
    window.showToast("Đang tải ảnh và lưu cấu hình...", "info");
    if (window.tempBrandFile) b.logo = await window.uploadToImgBB(window.tempBrandFile);
    if (window.tempSplashFile) b.splash = await window.uploadToImgBB(window.tempSplashFile);
    window.db.ref('branding').set(b).then(() => window.showToast("Đã lưu giao diện mới!", "success"));
};

// --- TRUNG TÂM HỖ TRỢ ---
window.openSupportMaster = () => { window.toggleModal('support-master-modal', true); window.showSupportStep('menu'); };
window.showSupportStep = (step) => {
    document.getElementById('support-step-1').classList.add('hidden'); document.getElementById('support-step-2').classList.add('hidden'); document.getElementById('support-step-3').classList.add('hidden');
    if(step === 'menu') document.getElementById('support-step-1').classList.remove('hidden');
    else if(step === 'check-status') document.getElementById('support-step-3').classList.remove('hidden');
    else { document.getElementById('support-step-2').classList.remove('hidden'); document.getElementById('support-dynamic-title').innerText = step === 'forgot-id' ? "🕵️ QUÊN ID ĐĂNG NHẬP" : "🔑 QUÊN MẬT KHẨU"; document.getElementById('support-type-hidden').value = step; }
};
window.submitSupportRequest = () => {
    const type = document.getElementById('support-type-hidden').value; const name = document.getElementById('support-fullname').value.trim(); const sec = document.getElementById('support-secret').value.trim();
    if(!name || !sec) return window.showToast("Vui lòng điền đủ thông tin!", "error");
    window.db.ref('support_tickets').push({ type, name, secret: sec, status: "pending", time: window.now() }).then(() => { window.showToast("Đã gửi yêu cầu! Hãy nhớ mã bí mật để tra cứu.", "success"); window.showSupportStep('menu'); });
};
window.checkSupportReply = () => {
    const name = document.getElementById('check-fullname').value.trim(); const sec = document.getElementById('check-secret').value.trim();
    if(!name || !sec) return window.showToast("Điền đủ thông tin để tra cứu!", "error");
    window.db.ref('support_tickets').orderByChild('name').equalTo(name).once('value').then(s => {
        let found = false;
        if(s.exists()) {
            s.forEach(c => {
                if(c.val().secret === sec) {
                    found = true;
                    if(c.val().status === 'pending') window.showToast("Admin đang xử lý, vui lòng chờ...", "info");
                    else if(c.val().status === 'resolved') alert("✅ PHẢN HỒI TỪ ADMIN:\\n" + c.val().reply);
                }
            });
        }
        if(!found) window.showToast("Không tìm thấy yêu cầu hoặc sai mã bí mật!", "error");
    });
};

window.db = null; window.session = null; window.serverOffset = 0;
window.isHk2Locked = false; window.isDemoMode = false; window.currentClearPin = "654321";
window.currentChatRef = null; window.currentPrivateConvo = ""; window.currentStreakRef = null; window.isSpying = false;
window.currentGroupChat = ""; window.currentGroupAdmin = ""; window.html5QrcodeScanner = null;
window.currentUploadType = null; window.typingTimeout = null;
window.IMGBB_API_KEY = "Cdb452c548546016f5ad7d5954d6d280"; // Fix lỗi already declared
window.currentVillage = 'hs'; // Mặc định 2 ngôi làng


window.now = () => new Date().getTime() + window.serverOffset;
window.getDateStr = (off = 0) => { const d = new Date(window.now()); d.setDate(d.getDate() + off); const p = n => n<10?'0'+n:n; return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()); };
window.toggleDarkMode = (chk) => { const isDark = chk.checked; document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); localStorage.setItem('darkMode', isDark); };
window.escapeHTML = (str) => { return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : ''; };
const showNetworkToast = (msg, bg) => { const t = document.getElementById('network-toast'); if(t) { t.innerText = msg; t.style.background = bg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 4000); } };
window.addEventListener('offline', () => showNetworkToast('⚠️ Mất kết nối mạng!', '#dc3545')); window.addEventListener('online', () => showNetworkToast('✅ Có mạng trở lại!', '#4CAF50'));
const setOfflineStatus = () => { if (window.session && window.db) window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }); };
window.addEventListener('beforeunload', setOfflineStatus); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') setOfflineStatus(); else if (document.visibilityState === 'visible' && window.session && window.db) window.db.ref('tracking/' + window.session.id).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); });

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            const c = { apiKey: "AIzaSyAcfas2KJo9n4Lpb9YVhGOpKWfYgBlSE9U", authDomain: "app-co-eb5d0.firebaseapp.com", projectId: "app-co-eb5d0", storageBucket: "app-co-eb5d0.firebasestorage.app", messagingSenderId: "160906787270", appId: "1:160906787270:web:638e28599f303dfddd1ac7", databaseURL: "https://app-co-eb5d0-default-rtdb.firebaseio.com" };
            if (!firebase.apps.length) firebase.initializeApp(c);
            window.db = firebase.database();
            window.db.ref('.info/serverTimeOffset').on('value', s => window.serverOffset = s.val() || 0);
            window.db.ref('.info/connected').on('value', snap => { if (snap.val() === true) { const gl = document.getElementById('global-loading'); if(gl) gl.classList.add('hidden'); } });
            window.db.ref('config/branding').on('value', s => { if (s.exists()) { const d = s.val(); window.applyBranding(d.name, d.logo); if (d.splashLogo) localStorage.setItem('savedSplashLogo', d.splashLogo); } const splash = document.getElementById('splash-screen'); const login = document.getElementById('login-screen'); if (splash && !window.session) { splash.style.display = 'none'; splash.classList.add('hidden'); } if (login && !window.session) login.classList.remove('hidden'); });
        }
    } catch (e) { console.log("Lỗi Firebase", e); }
}
initFirebase();
window.applyBranding = (n, l) => { document.querySelectorAll('.dynamic-app-name').forEach(e => e.innerText = n || "KIM MIN LAI"); document.querySelectorAll('.dynamic-logo').forEach(e => { if (l) { e.src = l; e.classList.remove('hidden'); } else e.classList.add('hidden'); }); const b = document.getElementById('brand-name-input'); if (b) b.value = n || ""; };
document.addEventListener('DOMContentLoaded', () => { 
    const s = localStorage.getItem('savedSplashLogo'); if (s) { const defaultSpin = document.getElementById('default-spinner'); if (defaultSpin) defaultSpin.classList.add('hidden'); const c = document.getElementById('custom-splash-img'); if (c) { c.src = s; c.classList.remove('hidden'); c.style.display = 'block'; } } 
    const isDark = localStorage.getItem('darkMode') === 'true'; const darkToggle = document.getElementById('dark-mode-toggle'); if(darkToggle) darkToggle.checked = isDark;
});

window.handleLogin = () => {
    const i = document.getElementById('username').value.trim().toLowerCase(); const p = document.getElementById('password').value.trim(); const b = document.getElementById('login-btn');
    if (!i || !p) return alert("Điền đủ thông tin!"); b.innerText = "ĐANG TẢI..."; b.disabled = true;
    const emailAo = i + '@kimminlai.com';
    firebase.auth().signInWithEmailAndPassword(emailAo, p).then(() => {
        window.db.ref('users/' + i).once('value').then(s => {
if (i === 'admin') { 
    const adminData = s.val() || {}; // Lấy dữ liệu Admin từ snapshot 's' đã có sẵn
    window.session = { 
        id: i, 
        role: 'admin', 
        name: 'BOSS QUÂN', 
        avatar: adminData.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', 
        allowPrivate: true 
    }; 
}

            else if (s.exists()) { if (s.val().isLocked) { alert("Tài khoản bị Khóa!"); firebase.auth().signOut(); b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false; return; } else { const d = s.val(); window.session = { id: i, role: d.role, name: d.name, avatar: d.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', allowPrivate: d.allowPrivate !== false }; } } 
            else { alert("Lỗi Data!"); firebase.auth().signOut(); b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false; return; }
            window.db.ref('tracking/' + i).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); 
            window.startIntro();
        });
    }).catch(() => { alert("Sai ID hoặc Mật khẩu!"); b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false; });
};

window.handleLogout = () => { if (window.session && window.db) window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }).then(() => location.reload()); else location.reload(); };

// ==============================================
// ĐÂY LÀ ĐOẠN ĐÃ SỬA: ĐỢI DỮ LIỆU RỒI MỚI VÀO APP
// ==============================================
window.prepareAppData = async () => {
    try {
        const dataPromises = [ window.db.ref('users').once('value'), window.db.ref('config').once('value') ];
        if (window.session.role === 'admin' || window.session.role === 'gv') {
            dataPromises.push(window.db.ref('grades').once('value'));
            dataPromises.push(window.db.ref('tracking').once('value'));
        } else {
            dataPromises.push(window.db.ref(`friends/${window.session.id}`).once('value'));
            dataPromises.push(window.db.ref(`grades/${window.session.id}`).once('value'));
        }
        await Promise.all(dataPromises);
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
};

window.startIntro = () => { 
    document.getElementById('login-screen').classList.add('hidden'); const splash = document.getElementById('splash-screen');
    if(splash) { splash.style.display = 'flex'; splash.classList.remove('hidden'); }
    
    window.prepareAppData().then(() => {
        if(splash) { splash.style.display = 'none'; splash.classList.add('hidden'); }
        const o = document.getElementById('intro-overlay'); const img = document.getElementById('intro-img');
        if(img) img.src = window.session.avatar; 
        if(o) o.classList.remove('hidden'); 
        setTimeout(() => { 
            document.body.classList.add('shrink-anim'); 
            setTimeout(() => { 
                if(o) o.classList.add('hidden'); 
                document.body.classList.remove('shrink-anim'); 
                window.enterApp(); 
            }, 850); 
        }, 800);
    });
};
window.enterApp = () => { 
    document.getElementById('main-screen').classList.remove('hidden'); 
    document.getElementById('display-name-real').innerText = window.session.name; 
    document.getElementById('display-role').innerText = window.session.role.toUpperCase(); 
    document.getElementById('user-avatar').src = window.session.avatar; 

    const r = window.session.role;
    const adminTabs = ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-personal', 'nav-manage', 'nav-rules', 'nav-tracking', 'nav-avatar', 'nav-users', 'nav-branding', 'nav-streak', 'nav-settings', 'nav-clear-data'];
    const hsTabs = ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-personal', 'nav-rules', 'nav-settings']; 
    const gvTabs = ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-manage', 'nav-rules', 'nav-settings'];
    
    document.querySelectorAll('.nav-btn').forEach(b => { if (!b.onclick.toString().includes('handleLogout')) b.classList.add('hidden'); });
    let activeTabs = (r === 'admin' || window.isDemoMode) ? adminTabs : (r === 'gv' ? gvTabs : hsTabs);
    activeTabs.forEach(id => { const btn = document.getElementById(id); if(btn) btn.classList.remove('hidden'); });

    // ĐÃ THÊM LỆNH window.loadMasterGrades() VÀO ĐÂY ĐỂ BẬT BẢNG ĐIỂM
    if (r === 'admin' || window.isDemoMode) { window.switchTab('manage'); window.loadUsers(); window.loadTracking(); window.loadMasterGrades(); if(typeof window.loadAdminSpy === 'function') window.loadAdminSpy(); } 
    else if (r === 'gv') { window.switchTab('manage'); window.loadUsers(); window.loadMasterGrades(); } 
    else { window.switchTab('connect'); window.loadUsers(); }

    document.getElementById('connect-my-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=user=${window.session.id}`;
    if(typeof window.initBankCardUI === 'function') window.initBankCardUI(); 
    if(typeof window.loadRealtime === 'function') window.loadRealtime(); 
    if(typeof window.loadGroups === 'function') window.loadGroups(); 
    if(typeof window.loadFriendRequests === 'function') window.loadFriendRequests();

    window.db.ref('unread/' + window.session.id).on('value', s => {
        if(s.exists() && Object.keys(s.val()).length > 0) { document.getElementById('main-noti-dot').classList.remove('hidden'); document.getElementById('menu-noti-dot').classList.remove('hidden'); document.getElementById('private-noti-dot').classList.remove('hidden'); window.unreadData = s.val(); } 
        else { document.getElementById('main-noti-dot').classList.add('hidden'); document.getElementById('menu-noti-dot').classList.add('hidden'); document.getElementById('private-noti-dot').classList.add('hidden'); window.unreadData = null; }
        if(typeof window.renderRecentChats === 'function') window.renderRecentChats();
                // Tự động tải thông báo sau khi xác định được vai trò người dùng
        if (typeof window.loadAnnouncements === 'function') window.loadAnnouncements();
    });

    const urlParams = new URLSearchParams(window.location.search); const targetUser = urlParams.get('user');
    if(targetUser && targetUser !== window.session.id && typeof window.openUserProfile === 'function') { window.openUserProfile(targetUser); }
};

window.toggleModal = (id, show) => { const m = document.getElementById(id); if (m) m.classList[show ? 'remove' : 'add']('hidden'); };
window.toggleSidebar = (show) => { const s = document.getElementById('sidebar'); if (s) { s.classList[show ? 'add' : 'remove']('open'); if(show && window.session) document.getElementById('main-noti-dot').classList.add('hidden'); } };
window.switchTab = (id) => { 
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.add('hidden')); 
    const tb = document.getElementById('tab-' + id); 
    if (tb) { tb.classList.remove('hidden'); tb.classList.add('fade-in'); }
    window.toggleSidebar(false); 
    if(id === 'chat') { window.openChatChannel('global'); document.getElementById('menu-noti-dot').classList.add('hidden'); } 
    if(id === 'myprofile' && typeof window.loadMyProfileTab === 'function') { window.loadMyProfileTab(); } 
};
window.initBankCardUI = () => {
    if(!window.session) return;
    document.getElementById('my-bank-name').innerText = window.session.name;
    document.getElementById('my-bank-id').innerText = "ID: " + window.session.id.toUpperCase();
    document.getElementById('my-bank-avt').src = window.session.avatar;
};

window.copyMyLink = () => { const link = location.origin + location.pathname + '?user=' + window.session.id; navigator.clipboard.writeText(link).then(() => alert("Đã sao chép liên kết!")); };
window.searchConnectUser = () => { const val = document.getElementById('connect-search-id').value.trim().toLowerCase(); if(!val) return; window.openUserProfile(val); };

window.startQRScanner = () => {
    document.getElementById('qr-scanner-container').classList.remove('hidden');
    if (!window.html5QrcodeScanner) {
        window.html5QrcodeScanner = new Html5QrcodeScanner("connect-qr-reader", { fps: 15, qrbox: 250 }, false);
        window.html5QrcodeScanner.render((decodedText) => {
            if (decodedText.includes('user=')) { window.stopQRScanner(); let uid = decodedText.split('user=')[1].split('&')[0]; window.openUserProfile(uid); } 
            else { alert("❌ LỖI: Mã QR này không phải thẻ ID của hệ thống!"); }
        }, (err) => { });
    }
};
window.stopQRScanner = () => { if (window.html5QrcodeScanner) { window.html5QrcodeScanner.clear(); window.html5QrcodeScanner = null; } document.getElementById('qr-scanner-container').classList.add('hidden'); };
window.loadMyProfileTab = () => {
    if(!window.session) return;
    window.db.ref('users/' + window.session.id).once('value').then(s => {
        const u = s.val() || {}; document.getElementById('my-tab-name').innerText = u.name || window.session.name; document.getElementById('my-tab-id').innerText = "ID: " + window.session.id.toUpperCase(); document.getElementById('my-tab-avatar').src = u.avatar || window.session.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        document.getElementById('my-tab-birthyear').innerText = u.birthYear ? "🎂 Sinh năm: " + u.birthYear : "";
        const quoteEl = document.getElementById('my-tab-quote'); if (u.quote) { quoteEl.innerHTML = "❝ " + window.escapeHTML(u.quote) + " ❞"; quoteEl.classList.remove('hidden'); } else { quoteEl.classList.add('hidden'); }
        document.getElementById('my-tab-bio').innerHTML = window.escapeHTML(u.bio) || "Chưa có tiểu sử...";
        const cohortEl = document.getElementById('my-tab-cohort'); if (u.role === 'cuu_hs' && u.cohort) { cohortEl.innerText = `🎓 ${u.cohort}`; cohortEl.classList.remove('hidden'); } else { cohortEl.classList.add('hidden'); }
    });
};

window.openSelfEdit = () => { window.db.ref('users/'+window.session.id).once('value').then(s => { const u = s.val() || {}; document.getElementById('self-birthyear').value = u.birthYear || ''; document.getElementById('self-quote').value = u.quote || ''; document.getElementById('self-bio').value = u.bio || ''; window.toggleModal('user-profile-modal', false); window.toggleModal('self-edit-modal', true); }); };
window.saveSelfProfile = () => { const by = document.getElementById('self-birthyear').value.trim(); const quote = document.getElementById('self-quote').value.trim(); const bio = document.getElementById('self-bio').value.trim(); window.db.ref('users/'+window.session.id).update({ birthYear: by, quote: quote, bio: bio }).then(() => { alert("✅ Cập nhật hồ sơ thành công!"); window.toggleModal('self-edit-modal', false); window.loadMyProfileTab(); window.openUserProfile(window.session.id); }); };

window.openUserProfile = (uid) => {
    if(uid === 'system' || !uid) return;
    window.db.ref('users/'+uid).once('value').then(s => {
        if(!s.exists() && uid !== 'admin') return alert("❌ Không tìm thấy ID này!");
        const u = s.exists() ? s.val() : { name: 'BOSS QUÂN', role: 'admin', privacy: {hideAll: false} };
        const isHidden = u.privacy && u.privacy.hideAll && window.session.role !== 'admin' && uid !== window.session.id;
        document.getElementById('profile-name').innerText = isHidden ? "Người Dùng Ẩn Danh" : u.name; 
        document.getElementById('profile-id').innerText = "ID: " + uid.toUpperCase(); 
        document.getElementById('profile-birthyear').innerText = (isHidden || !u.birthYear) ? "" : "🎂 Sinh năm: " + u.birthYear;
        const quoteEl = document.getElementById('profile-quote'); if (isHidden || !u.quote) { quoteEl.classList.add('hidden'); } else { quoteEl.innerHTML = "❝ " + window.escapeHTML(u.quote) + " ❞"; quoteEl.classList.remove('hidden'); }
        document.getElementById('profile-bio').innerHTML = isHidden ? "Thông tin đã bị ẩn" : (window.escapeHTML(u.bio) || "Chưa có tiểu sử...");
        const cohortEl = document.getElementById('profile-cohort'); if (u.role === 'cuu_hs' && u.cohort) { cohortEl.innerText = `🎓 ${u.cohort}`; cohortEl.classList.remove('hidden'); } else { cohortEl.classList.add('hidden'); }
        const avtImg = document.getElementById('profile-avatar'); const hiddenAvt = document.getElementById('profile-hidden-avatar');
        if (isHidden) { avtImg.classList.add('hidden'); hiddenAvt.classList.remove('hidden'); } else { avtImg.src = u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; avtImg.classList.remove('hidden'); hiddenAvt.classList.add('hidden'); }
        const chatBtn = document.getElementById('profile-chat-btn'); const friendBtn = document.getElementById('profile-friend-btn'); const selfEditBtn = document.getElementById('profile-self-edit-btn');
        if (uid === window.session.id) { chatBtn.classList.add('hidden'); friendBtn.classList.add('hidden'); selfEditBtn.classList.remove('hidden'); } 
        else {
            selfEditBtn.classList.add('hidden'); chatBtn.classList.remove('hidden'); chatBtn.onclick = () => { window.toggleModal('user-profile-modal', false); window.switchTab('chat'); window.openDirectChat(uid); };
            window.db.ref(`friends/${window.session.id}/${uid}`).on('value', fSnap => {
                const fStatus = fSnap.val(); friendBtn.classList.remove('hidden');
                if (fStatus === 'accepted') { friendBtn.innerText = "✅ BẠN BÈ"; friendBtn.style.background = "var(--border)"; friendBtn.onclick = null; } 
                else if (fStatus === 'sent') { friendBtn.innerText = "⏳ ĐÃ GỬI YÊU CẦU"; friendBtn.style.background = "#FF9800"; friendBtn.onclick = null; } 
                else if (fStatus === 'received') { friendBtn.innerText = "🤝 CHẤP NHẬN KẾT BẠN"; friendBtn.style.background = "#4CAF50"; friendBtn.onclick = () => window.acceptFriendRequest(uid); } 
                else if (fStatus === 'declined') { friendBtn.innerText = "🚫 ĐÃ BỊ TỪ CHỐI"; friendBtn.style.background = "#dc3545"; friendBtn.onclick = () => alert("Người này đã từ chối bạn trước đó!"); }
                else { friendBtn.innerText = "➕ KẾT BẠN"; friendBtn.style.background = "#1877F2"; friendBtn.onclick = () => window.sendFriendRequest(uid); }
            });
        }
        window.toggleModal('user-profile-modal', true);
    });
};
window.sendFriendRequest = (targetId) => { window.db.ref(`friends/${targetId}/${window.session.id}`).once('value').then(snap => { if (snap.val() === 'declined') { alert("🚫 Bị block rồi!\nNgười này đã TỪ CHỐI lời mời của bạn."); } else { window.db.ref(`friends/${window.session.id}/${targetId}`).set('sent'); window.db.ref(`friends/${targetId}/${window.session.id}`).set('received'); alert("Đã gửi yêu cầu kết bạn!"); } }); };
window.acceptFriendRequest = (targetId) => { window.db.ref(`friends/${window.session.id}/${targetId}`).set('accepted'); window.db.ref(`friends/${targetId}/${window.session.id}`).set('accepted'); const cId = window.getConvoId(window.session.id, targetId); window.db.ref('chat_streaks/' + cId).once('value').then(s => { if(!s.exists()) window.db.ref('chat_streaks/' + cId).set({ count: 0, exp: 0, lastDate: window.getDateStr() }); }); alert("Hai bạn đã trở thành bạn bè!"); };
window.declineFriendRequest = (targetId) => { if(confirm("Bạn có chắc muốn từ chối lời mời kết bạn này?")) { window.db.ref(`friends/${window.session.id}/${targetId}`).set('declined'); window.db.ref(`friends/${targetId}/${window.session.id}`).remove(); } };
window.unfriendUser = (targetId, targetName) => {
    if(confirm(`⚠️ BẠN CÓ CHẮC CHẮN?\n\nMuốn HỦY KẾT BẠN với ${targetName}?\n(Tất cả chuỗi lửa của 2 người cũng sẽ bị xóa sạch)`)) {
        window.db.ref(`friends/${window.session.id}/${targetId}`).remove(); window.db.ref(`friends/${targetId}/${window.session.id}`).remove();
        const convoId = window.getConvoId(window.session.id, targetId); window.db.ref('chat_streaks/' + convoId).remove(); alert("Đã hủy kết bạn!");
    }
};
window.getConvoId = (id1, id2) => id1 < id2 ? id1 + '_' + id2 : id2 + '_' + id1;

window.loadFriendRequests = () => {
    if (!window.session) return;
    window.db.ref('friends/' + window.session.id).on('value', snap => {
        const data = snap.val() || {}; let reqHtml = ''; let friendHtml = ''; let hasReq = false; let friendCount = 0; let promises = [];
        for (let targetId in data) {
            const status = data[targetId];
            promises.push(window.db.ref('users/' + targetId).once('value').then(uS => {
                const u = uS.val(); if(!u) return;
                const tName = targetId === 'admin' ? 'BOSS QUÂN' : u.name;
                const tAvt = targetId === 'admin' ? 'https://cdn-icons-png.flaticon.com/512/149/149071.png' : (u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png');
                if (status === 'received') {
                    hasReq = true;
                    reqHtml += `<div style="display:flex; justify-content:space-between; align-items:center; background:var(--card); padding:10px; border-radius:10px; border:1px solid #FF9800; margin-bottom:8px;"><div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.openUserProfile('${targetId}')"><img src="${tAvt}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--border);"><div><b style="color:var(--pink); font-size:14px;">${tName}</b><br><small style="color:var(--text-light);">ID: ${targetId.toUpperCase()}</small></div></div><div style="display:flex; gap:5px;"><button class="btn-royal" style="background:#4CAF50; width:auto; padding:8px 12px; font-size:14px;" onclick="window.acceptFriendRequest('${targetId}')">✅</button><button class="btn-royal" style="background:#dc3545; width:auto; padding:8px 12px; font-size:14px;" onclick="window.declineFriendRequest('${targetId}')">❌</button></div></div>`;
                } else if (status === 'accepted') {
                    friendCount++;
                    friendHtml += `<div class="tt-item" style="padding:12px 0;"><div class="tt-avt-wrap" onclick="window.openUserProfile('${targetId}')"><img src="${tAvt}" class="tt-avt" style="width:45px; height:45px;"></div><div class="tt-info" onclick="window.openUserProfile('${targetId}')"><div class="tt-name" style="font-size:15px;">${tName}</div><span class="tt-preview">ID: ${targetId.toUpperCase()}</span></div><div class="tt-action"><button onclick="window.unfriendUser('${targetId}', '${tName}')" style="background:transparent; color:#dc3545; border:1px solid #dc3545; padding:6px 12px; border-radius:10px; font-size:12px; font-weight:bold; cursor:pointer;">Hủy</button></div></div>`;
                }
            }));
        }
        Promise.all(promises).then(() => {
            const reqZone = document.getElementById('friend-requests-zone'); const reqList = document.getElementById('friend-requests-list');
            if (hasReq) { reqList.innerHTML = reqHtml; reqZone.classList.remove('hidden'); } else { reqZone.classList.add('hidden'); reqList.innerHTML = ''; }
            document.getElementById('my-friends-list').innerHTML = friendHtml || '<p style="text-align:center; color:var(--text-light); font-size:13px; margin-top:20px; padding-bottom:20px;">Danh bạ trống. Hãy tìm bạn để kết nối nhé!</p>';
            const cntBadge = document.getElementById('friend-count-badge'); if(cntBadge) cntBadge.innerText = friendCount + " bạn";
        });
    });
};
// ==========================================
// PHẦN 3.1: TÍNH ĐIỂM, BẢNG ĐIỂM & SỬA ĐIỂM
// ==========================================
window.calcGPA = (m, p, t, thi) => { const nM = parseFloat(m) || 0; const nP = parseFloat(p) || 0; const nT = parseFloat(t) || 0; const nTh = parseFloat(thi) || 0; const res = (nM + nP + (nT * 2) + (nTh * 3)) / 7; return isNaN(res) ? "0.0" : res.toFixed(1); };
window.calcYearly = (a1, a2) => { const v1 = parseFloat(a1) || 0; const v2 = parseFloat(a2) || 0; if (v2 === 0 || window.isHk2Locked) return "-"; const y = (v1 + (v2 * 2)) / 3; return isNaN(y) ? "0.0" : y.toFixed(1); };

window.loadMasterGrades = () => {
    window.db.ref('users').on('value', uS => {
        const uMap = uS.val() || {}; window.db.ref('grades').on('value', sn => {
            let h = ''; const all = sn.val() || {};
            for (let i in uMap) {
                if (i === 'admin' || uMap[i].role !== 'hs') continue;
                const u = uMap[i];
                const g = all[i] || {}; const h1 = g.hk1 || { m: '', p: '', t: '', thi: '', hk: '-' }; const h2 = g.hk2 || { m: '', p: '', t: '', thi: '', hk: '-' };
                const t1 = window.calcGPA(h1.m, h1.p, h1.t, h1.thi); const t2 = window.calcGPA(h2.m, h2.p, h2.t, h2.thi); const cn = window.calcYearly(t1, t2); 
                const uN = u.name || "Không rõ";
                const avt = u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                
                // === HỆ THỐNG CẢNH BÁO THÔNG MINH ===
                let warningHtml = '';
                if (parseFloat(t1) < 5.0 || (parseFloat(t2) < 5.0 && t2 !== '-') || (parseFloat(cn) < 5.0 && cn !== '-')) {
                    warningHtml = '<i class="fas fa-exclamation-triangle anim-pulse" style="color:#dc3545; font-size:14px; margin-left:5px;" title="CẢNH BÁO ĐỎ: Điểm trung bình dưới 5.0!"></i>';
                } else if (h1.thi === '' || h1.thi === undefined || ( (h2.thi === '' || h2.thi === undefined) && !window.isHk2Locked )) {
                    warningHtml = '<i class="fas fa-bell anim-pulse" style="color:#FF9800; font-size:14px; margin-left:5px;" title="CHÚ Ý: Học sinh này đang bị thiếu điểm hệ số cao!"></i>';
                }

                h += `<tr>
                    <td class="sticky-col" onclick="window.openScoreModal('${i}', '${uN}')" style="cursor:pointer; background:var(--soft); border-right:2px solid var(--pink); color:var(--text); text-align:left; min-width:200px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${avt}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--pink); flex-shrink:0;">
                            <div style="line-height:1.3; overflow:hidden;">
                                <b style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; color:var(--pink);">${uN} ${warningHtml}</b>
                                <small style="color:var(--text-light); font-weight:bold;">ID: ${i.toUpperCase()}</small><br>
                                <span style="font-size:10px; color:#4CAF50; font-weight:bold; background:rgba(76, 175, 80, 0.1); padding:2px 5px; border-radius:5px;">HK1: ${h1.hk || '-'} | HK2: ${h2.hk || '-'}</span>
                            </div>
                            <i class="fas fa-edit" style="color:var(--pink); margin-left:auto; font-size:16px;"></i>
                        </div>
                    </td>
                    <td>${h1.m !== undefined ? h1.m : ''}</td><td>${h1.p !== undefined ? h1.p : ''}</td><td>${h1.t !== undefined ? h1.t : ''}</td><td>${h1.thi !== undefined ? h1.thi : ''}</td><td style="color:var(--pink);font-weight:bold;font-size:14px;">${t1}</td>
                    <td>${h2.m !== undefined ? h2.m : ''}</td><td>${h2.p !== undefined ? h2.p : ''}</td><td>${h2.t !== undefined ? h2.t : ''}</td><td>${h2.thi !== undefined ? h2.thi : ''}</td><td style="color:var(--pink);font-weight:bold;font-size:14px;">${t2}</td>
                    <td style="color:red;font-weight:900;font-size:16px;background:rgba(255,0,0,0.05);">${cn}</td>
                </tr>`;
            }
            const b = document.getElementById('master-grade-body'); if (b) b.innerHTML = h || '<tr><td colspan="12" style="text-align:center;">Chưa có học sinh nào.</td></tr>';
        });
    });
};


window.exportExcel = () => { let csv = "HỌ TÊN,ID,HK1_M,HK1_15P,HK1_1T,HK1_THI,HK1_TB,HK2_M,HK2_15P,HK2_1T,HK2_THI,HK2_TB,CẢ NĂM\n"; window.db.ref('users').once('value').then(uS => { const uMap = uS.val() || {}; window.db.ref('grades').once('value').then(sn => { const all = sn.val() || {}; for(let i in uMap) { if(i === 'admin' || uMap[i].role !== 'hs') continue; const g = all[i] || {}; const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const t1 = window.calcGPA(h1.m, h1.p, h1.t, h1.thi); const t2 = window.calcGPA(h2.m, h2.p, h2.t, h2.thi); const cn = window.calcYearly(t1, t2); csv += `"${uMap[i].name}","${i.toUpperCase()}",${h1.m},${h1.p},${h1.t},${h1.thi},${t1},${h2.m},${h2.p},${h2.t},${h2.thi},${t2},${cn}\n`; } const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "Bang_Diem_Hoc_Sinh.csv"; link.click(); }); }); };

window.openScoreModal = (id, name) => { document.getElementById('score-u-id').value = id; document.getElementById('score-u-name').innerText = name + " (" + id.toUpperCase() + ")"; document.getElementById('score-term').value = '1'; window.loadStudentScoreIntoModal(); window.toggleModal('score-modal', true); };
window.loadStudentScoreIntoModal = () => { const id = document.getElementById('score-u-id').value; const term = document.getElementById('score-term').value; window.db.ref(`grades/${id}/hk${term}`).once('value').then(s => { const d = s.val() || { m: '', p: '', t: '', thi: '', hk: 'Tốt' }; document.getElementById('score-m').value = d.m !== undefined ? d.m : ''; document.getElementById('score-15p').value = d.p !== undefined ? d.p : ''; document.getElementById('score-1t').value = d.t !== undefined ? d.t : ''; document.getElementById('score-thi').value = d.thi !== undefined ? d.thi : ''; document.getElementById('score-conduct').value = d.hk || 'Tốt'; }); };
window.confirmSaveScore = () => { const i = document.getElementById('score-u-id').value; const n = document.getElementById('score-u-name').innerText; const t = document.getElementById('score-term').value; const hk = document.getElementById('score-conduct').value; if (t === '2' && window.isHk2Locked) return alert("❌ KỲ 2 ĐÃ BỊ KHÓA!"); if (confirm(`Lưu điểm cho: ${n}?`)) { window.db.ref(`grades/${i}/hk${t}`).update({ m: parseFloat(document.getElementById('score-m').value) || 0, p: parseFloat(document.getElementById('score-15p').value) || 0, t: parseFloat(document.getElementById('score-1t').value) || 0, thi: parseFloat(document.getElementById('score-thi').value) || 0, hk: hk }).then(() => { alert("✅ LƯU THÀNH CÔNG!"); window.toggleModal('score-modal', false); }); } };
// ==========================================
// PHẦN 3.2: REALTIME, TẠO HS MỚI & QUẢN LÝ USER
// ==========================================
window.loadRealtime = () => {
    window.db.ref('config/clearPin').on('value', s => window.currentClearPin = s.val() || "654321");
    window.db.ref('config/hk2Locked').on('value', s => {
        window.isHk2Locked = s.val() === true; const tg = document.getElementById('lock-toggle'); if (tg) tg.checked = window.isHk2Locked;
        if (window.session && window.session.role === 'hs') {
            const msg = document.getElementById('lock-msg-hs'); if (msg) msg.classList[window.isHk2Locked ? 'remove' : 'add']('hidden');
            window.db.ref('grades/' + window.session.id).on('value', sn => {
                const g = sn.val() || {}; const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                const t1 = window.calcGPA(h1.m, h1.p, h1.t, h1.thi); let t2 = window.calcGPA(h2.m, h2.p, h2.t, h2.thi); let cn = window.calcYearly(t1, t2);
                let sM = h2.m, sP = h2.p, sT = h2.t, sThi = h2.thi, sHk = h2.hk || '-'; if (window.isHk2Locked) { sM = '-'; sP = '-'; sT = '-'; sThi = '-'; t2 = '-'; cn = '-'; sHk = '-'; }
                const ui = document.getElementById('personal-grades-ui'); if (ui) ui.innerHTML = `<div class="scroll-x"><table class="master-table"><tr><th class="sticky-col">KỲ</th><th>M</th><th>15P</th><th>1T</th><th>THI</th><th>TB</th><th>H.KIỂM</th></tr><tr><td class="sticky-col"><b>HK1</b></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td><b style="color:#4CAF50">${h1.hk || '-'}</b></td></tr><tr><td class="sticky-col"><b>HK2</b></td><td>${sM}</td><td>${sP}</td><td>${sT}</td><td>${sThi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td><b style="color:#4CAF50">${sHk}</b></td></tr><tr><td class="sticky-col"><b>CẢ NĂM</b></td><td colspan="4" style="text-align:right"><b>TỔNG KẾT:</b></td><td colspan="2" style="color:red;font-size:18px;font-weight:bold;">${cn}</td></tr></table></div>`;
            });
        }
    });

    // Đoạn check quyền tĩnh (Đã gỡ bỏ sự phụ thuộc vào Demo Mode)
    if (window.session) {
        const r = window.session.role;
        const isAdmin = (r === 'admin'); // Chỉ Admin xịn mới có quyền
        const isTeacher = (r === 'gv');

        const secZone = document.getElementById('admin-security-zone');
        if (secZone) { if (isAdmin) secZone.classList.remove('hidden'); else secZone.classList.add('hidden'); }

        const lockCard = document.getElementById('lock-hk2-card');
        if (lockCard) { if (isAdmin || isTeacher) lockCard.classList.remove('hidden'); else lockCard.classList.add('hidden'); }

        const rez = document.getElementById('rules-editor-zone');
        if(rez) { if (isAdmin || isTeacher) rez.classList.remove('hidden'); else rez.classList.add('hidden'); }
    }
};


window.createNewUser = () => {
    const id = document.getElementById('new-id').value.toLowerCase().trim(); const n = document.getElementById('new-name').value.trim(); const p = document.getElementById('new-pass').value.trim(); const r = document.getElementById('new-role').value;
    if (!id || !n || !p) return alert("Điền đủ thông tin!");
    window.db.ref('users/' + id).once('value').then(snap => {
        if (snap.exists()) { alert("❌ LỖI: ID '" + id + "' đã có người sử dụng!"); } else {
            const app2 = firebase.apps.length > 1 ? firebase.app('App2') : firebase.initializeApp(firebase.app().options, 'App2');
            app2.auth().createUserWithEmailAndPassword(id + '@kimminlai.com', p).then(() => {
                app2.auth().signOut(); 
                window.db.ref('users/' + id).set({ name: n, role: r, isLocked: false, allowPrivate: true }).then(() => { 
                    window.db.ref('user_passwords/' + id).set({ pass: p });
                    alert("✅ TẠO THÀNH CÔNG!"); document.getElementById('new-id').value = ''; document.getElementById('new-name').value = ''; document.getElementById('new-pass').value = ''; 
                });
            }).catch(e => alert("❌ Lỗi Auth: " + e.message));
        }
    });
};

window.loadUsers = () => {
    window.db.ref('users').on('value', s => {
        const d = s.val() || {}; window.allUsersMap = d;
        const renderTable = (pMap) => {
            let h = '', g = '', spyOptions = '<option value="">-- Chọn tài khoản --</option>'; 
            for (let i in d) {
                if (i === 'admin') continue; const u = d[i];
                if (u.role === 'cuu_hs') continue; // Loại bỏ hoàn toàn cựu học sinh
                
                const passDisplay = pMap[i] ? pMap[i].pass : '***';
                const lockBadge = u.isLocked ? '<span style="background:#FF9800;color:white;font-size:10px;padding:2px 5px;border-radius:5px;margin-left:5px;">ĐÃ KHÓA</span>' : '';
                const avt = u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                
                // Giao diện danh sách user có Avatar
                const rw = `<tr onclick="window.openUserActionMenu('${i}','${u.name}','${passDisplay}',${u.isLocked || false})" style="cursor:pointer;"><td style="text-align:left; display:flex; align-items:center; gap:10px;"><img src="${avt}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid var(--border);"><div><b style="color:var(--pink);">${u.name}</b> ${lockBadge}<br><small style="color:var(--text-light); font-weight:bold;">ID: ${i.toUpperCase()}</small></div></td><td>${passDisplay}</td><td style="text-align:right;"><i class="fas fa-ellipsis-v" style="color:var(--pink); padding:10px;"></i></td></tr>`;
                
                if (u.role === 'gv') g += rw; else h += rw; 
                spyOptions += `<option value="${i}">${u.name} (${i})</option>`;
            }
            document.getElementById('list-gv').innerHTML = g || '<tr><td colspan="3" style="text-align:center;">Chưa có giáo viên</td></tr>'; 
            document.getElementById('list-hs').innerHTML = h || '<tr><td colspan="3" style="text-align:center;">Chưa có học sinh</td></tr>';
            
            const lchs = document.getElementById('list-cuu-hs'); if (lchs) lchs.innerHTML = '';
            const streak1 = document.getElementById('streak-id-1'); if(streak1) streak1.innerHTML = spyOptions; 
            const streak2 = document.getElementById('streak-id-2'); if(streak2) streak2.innerHTML = spyOptions;
            if(typeof window.renderRecentChats === 'function') window.renderRecentChats(); if(typeof window.searchStudent === 'function') window.searchStudent();
        };
        if (window.session && window.session.role === 'admin') { window.db.ref('user_passwords').on('value', pSnap => { renderTable(pSnap.val() || {}); }); } else { renderTable({}); }
    });
};

window.searchStudent = () => { const filter = document.getElementById('search-user').value.toLowerCase(); const rows = document.querySelectorAll('#list-hs tr, #list-gv tr, #list-cuu-hs tr'); rows.forEach(row => { row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none'; }); };
window.openUserActionMenu = (id, name, pass, isLocked) => { document.getElementById('action-u-name').innerText = name + " (" + id.toUpperCase() + ")"; document.getElementById('btn-action-edit').onclick = () => { window.toggleModal('user-action-modal', false); window.openEditUser(id, name, pass); }; const lockBtn = document.getElementById('btn-action-lock'); if (isLocked) { lockBtn.innerHTML = "🔓 Mở Khóa"; lockBtn.style.background = "#4CAF50"; } else { lockBtn.innerHTML = "🔒 Khóa"; lockBtn.style.background = "#FF9800"; } lockBtn.onclick = () => { window.toggleModal('user-action-modal', false); window.clickToggleLock(id, name, isLocked); }; document.getElementById('btn-action-delete').onclick = () => { window.toggleModal('user-action-modal', false); window.clickDelete(id, name); }; window.toggleModal('user-action-modal', true); };
window.clickToggleLock = (i, n, l) => { if (l) window.db.ref('users/' + i).update({ isLocked: false, lockReason: null }); else { document.getElementById('lock-u-id').value = i; document.getElementById('lock-u-name').innerText = n; document.getElementById('lock-reason-input').value = ""; window.toggleModal('lock-reason-modal', true); } };
window.confirmLockUser = () => { const id = document.getElementById('lock-u-id').value; const reason = document.getElementById('lock-reason-input').value.trim() || "Vi phạm"; window.db.ref('users/' + id).update({ isLocked: true, lockReason: reason }); window.toggleModal('lock-reason-modal', false); };

window.openEditUser = (i, n, p) => { document.getElementById('edit-u-old-id').value = i; document.getElementById('edit-u-old-pass').value = p; document.getElementById('edit-u-name').innerText = n; document.getElementById('edit-u-new-id').value = i; document.getElementById('edit-u-pass').value = p; window.toggleModal('edit-user-modal', true); };
window.saveUserEdit = () => { 
    const id = document.getElementById('edit-u-old-id').value; const oldPass = document.getElementById('edit-u-old-pass').value; const newPass = document.getElementById('edit-u-pass').value.trim(); 
    if (!newPass) return alert("❌ Vui lòng nhập mật khẩu mới!"); if (newPass.length < 6) return alert("❌ Mật khẩu phải có ít nhất 6 ký tự!");
    alert("⏳ Đang ép hệ thống Firebase Auth đồng bộ mật khẩu mới...");
    const app2 = firebase.apps.length > 1 ? firebase.app('App2') : firebase.initializeApp(firebase.app().options, 'App2');
    app2.auth().signInWithEmailAndPassword(id + '@kimminlai.com', oldPass).then((userCred) => {
        userCred.user.updatePassword(newPass).then(() => { app2.auth().signOut(); window.db.ref('user_passwords/' + id).update({ pass: newPass }).then(() => { alert("✅ Đã đồng bộ Đổi mật khẩu thành công 100%!"); window.toggleModal('edit-user-modal', false); }); }).catch(e => { app2.auth().signOut(); alert("❌ Lỗi Auth: " + e.message); });
    }).catch(e => { alert("❌ LỖI NGHIÊM TRỌNG: Mật khẩu cũ bị sai lệch với Firebase.\n(Người dùng này đã bị lỗi Auth, hãy XÓA tài khoản và tạo lại!)"); });
};
window.clickDelete = (i, n) => { document.getElementById('delete-u-id').value = i; document.getElementById('delete-u-name').innerText = n; document.getElementById('delete-reason-input').value = ""; window.toggleModal('delete-reason-modal', true); };
window.confirmDeleteUser = () => { 
    const id = document.getElementById('delete-u-id').value; const reason = document.getElementById('delete-reason-input').value.trim(); 
    if(reason) window.db.ref('deleted_logs/' + id).set({ reason: reason, time: window.now() }); 
    alert("⏳ Đang truy quét và xóa tận gốc dữ liệu của tài khoản này...");
    let updates = {}; updates['users/' + id] = null; updates['user_passwords/' + id] = null; updates['grades/' + id] = null; updates['tracking/' + id] = null; updates['friends/' + id] = null; updates['unread/' + id] = null;
    window.db.ref().update(updates).then(() => { alert("✅ Đã tiễu trừ hoàn toàn tài khoản và dữ liệu liên quan!"); window.toggleModal('delete-reason-modal', false); });
};
window.openClearDataAuth = () => { window.toggleModal('clear-auth-modal', true); window.toggleSidebar(false); };
window.verifyClearPin = () => { if (document.getElementById('clear-pin-input').value === window.currentClearPin) { window.toggleModal('clear-auth-modal', false); window.toggleModal('clear-confirm-modal', true); } else alert("SAI MÃ PIN!"); };
window.changeClearPin = () => { const o = document.getElementById('old-pin-input').value; const n = document.getElementById('new-pin-input').value; if (o === window.currentClearPin) window.db.ref('config/clearPin').set(n).then(() => alert("ĐỔI PIN THÀNH CÔNG!")); else alert("MÃ PIN CŨ SAI!"); };

window.executeUpgradeYear = () => { let cohortName = prompt("🎓 CHUYỂN GIAO NĂM HỌC!\n\nĐặt tên cho lứa Cựu học sinh này (VD: Khóa 1):", "Khóa 1"); if (cohortName === null || cohortName.trim() === "") return alert("❌ Sếp phải nhập tên khóa!"); if (!window.db) return; window.db.ref('users').once('value').then(S => { let up = { 'grades': null, 'inbox': null, 'replies': null }; let us = S.val() || {}; for (let u in us) { if (us[u].role === 'hs') { up['users/' + u + '/role'] = 'cuu_hs'; up['users/' + u + '/cohort'] = cohortName.trim(); } } window.db.ref().update(up).then(() => { alert(`🎓 CHUYỂN GIAO THÀNH CÔNG!`); location.reload(); }); }); };
window.executeClearAlumni = () => { let confirmText = prompt("🧹 XÓA CỰU HỌC SINH!\n\nNhập 'XOA' viết hoa để xác nhận:", ""); if(confirmText !== "XOA") return alert("Đã hủy!"); if (!window.db) return; window.db.ref('users').once('value').then(S => { let up = {}; let us = S.val() || {}; let count = 0; for (let u in us) { if (us[u].role === 'cuu_hs') { up['users/' + u] = null; count++; } } if(count === 0) return alert("Chưa có Cựu Học Sinh nào!"); window.db.ref().update(up).then(() => { alert(`🧹 Đã quét sạch thành công ${count} tài khoản Cựu Học Sinh!`); location.reload(); }); }); };
window.executeHardReset = () => { 
    let confirmText = prompt("💣 CẢNH BÁO NGUY HIỂM!\n\nNhập 'XOA' viết hoa để xác nhận xóa sạch app:", ""); 
    if(confirmText !== "XOA") return alert("Đã hủy!"); 
    if (!window.db) return; 
    
    alert("⏳ Đang ném bom toàn bộ hệ thống... Vui lòng không đóng trang!"); 
    
    window.db.ref('users').once('value').then(S => { 
        let up = { 
            'grades': null, 'tracking': null, 'inbox': null, 'replies': null, 
            'chat': null, 'chat_streaks': null, 'unread': null, 'groups': null, 
            'typing': null, 'daily_tasks': null, 'friends': null, 'announcements': null 
        }; 
        let us = S.val() || {}; 
        
        for (let u in us) { 
            if (u !== 'admin') { 
                up['users/' + u] = null; 
                up['user_passwords/' + u] = null; 
                up['deleted_logs/' + u] = null;
            } 
        } 
        
        window.db.ref().update(up).then(() => { 
            alert("💣 HỆ THỐNG ĐÃ TRỞ VỀ TRẠNG THÁI TRẮNG TINH!"); 
            location.reload(); 
        }).catch(err => {
            alert("❌ Lỗi ném bom: " + err.message);
        });
    }); 
};

window.openAdminPassAuth = () => { document.getElementById('admin-pass-pin').value = ''; window.toggleModal('admin-pass-auth-modal', true); };
window.verifyAdminPassPin = () => { if (document.getElementById('admin-pass-pin').value === window.currentClearPin) { window.toggleModal('admin-pass-auth-modal', false); document.getElementById('old-admin-pass').value = ''; document.getElementById('new-admin-pass').value = ''; window.toggleModal('admin-pass-edit-modal', true); } else alert("❌ SAI MÃ PIN!"); };
window.changeAdminPass = () => { const o = document.getElementById('old-admin-pass').value.trim(); const n = document.getElementById('new-admin-pass').value.trim(); if (!o || !n) return alert("Nhập đủ Mật khẩu cũ và mới!"); const user = firebase.auth().currentUser; if (user) { user.updatePassword(n).then(() => { window.db.ref('user_passwords/admin').update({ pass: n }).then(() => { alert("✅ Đã đổi Mật khẩu Sếp Quân!"); window.toggleModal('admin-pass-edit-modal', false); }); }).catch(e => { if (e.code === 'auth/requires-recent-login') { alert("⚠️ BẢO MẬT FIREBASE: Phiên đăng nhập đã cũ!\n\nSếp hãy nhấn THOÁT 🚪, sau đó Đăng Nhập lại và thao tác Đổi Pass ngay nhé!"); } else { alert("❌ Lỗi đổi pass Auth: " + e.message); } }); } else alert("Chưa đăng nhập Auth!"); };
window.handleToggleLock = c => window.db.ref('config/hk2Locked').set(c.checked);
window.saveAnnouncement = () => { const txt = document.getElementById('rules-input').value.trim(); const target = document.getElementById('announce-target').value; if (!txt) return alert("Chưa nhập nội dung!"); window.db.ref('announcements').push({ text: txt, target: target, time: firebase.database.ServerValue.TIMESTAMP, author: window.session.name || "Admin" }).then(() => { alert("✅ Đã phát loa!"); document.getElementById('rules-input').value = ""; }); };
window.deleteAnnouncement = (key) => { if(confirm("🗑️ Bạn có chắc muốn gỡ thông báo này không?")) { window.db.ref('announcements/' + key).remove(); } };
window.loadTracking = () => { 
    // 1. Load bảng người dùng online
    window.db.ref('tracking').on('value', s => { 
        let h = ''; const d = s.val() || {}; const pad = num => num < 10 ? '0' + num : num; 
        const fmtDate = ms => { if (!ms) return '--'; const dt = new Date(ms); return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1); }; 
        for (let i in d) { const u = d[i]; const st = u.status === 'online' ? '🟢' : '🔴'; h += `<tr><td>${u.name || i}</td><td>${u.role || '-'}</td><td>${st}</td><td>${fmtDate(u.lastLogin)}</td><td>${fmtDate(u.lastLogout)}</td></tr>`; } 
        const tb = document.getElementById('tracking-body'); if(tb) tb.innerHTML = h; 
    }); 
    
    // 2. Load Hộp thư hỗ trợ cho Admin
    if (window.session && window.session.role === 'admin') {
        window.db.ref('inbox').on('value', snap => {
            let html = ''; const data = snap.val() || {}; let hasReq = false;
            for (let k in data) {
                hasReq = true; const req = data[k]; const dt = new Date(req.time); const pad = n => n < 10 ? '0' + n : n;
                const timeStr = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' - ' + pad(dt.getDate()) + '/' + pad(dt.getMonth()+1);
                
                html += `
                <div style="background:var(--bg); padding:15px; border-radius:10px; border-left:4px solid #FF9800; border-top:1px solid var(--border); border-right:1px solid var(--border); border-bottom:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <b style="color:var(--pink); font-size:16px;">${window.escapeHTML(req.name)}</b>
                        <span style="font-size:12px; color:var(--text-light);">${timeStr}</span>
                    </div>
                    <div style="font-size:13px; margin-bottom:12px;">
                        <b>Vấn đề:</b> <span style="color:#dc3545; font-weight:bold;">${window.escapeHTML(req.req)}</span><br>
                        <b style="margin-top:5px; display:inline-block;">Mã bí mật:</b> <span style="background:var(--soft); padding:3px 8px; border-radius:5px; border:1px dashed var(--pink); font-weight:bold; letter-spacing:1px;">${window.escapeHTML(req.secret)}</span>
                    </div>
                    <button class="btn-royal" style="background:#FF9800; padding:12px; font-size:13px; box-shadow:0 4px 10px rgba(255, 152, 0, 0.3);" onclick="window.replySupport('${k}', '${window.escapeHTML(req.name)}', '${window.escapeHTML(req.secret)}')">✍️ TRẢ LỜI & GIẢI QUYẾT</button>
                </div>`;
            }
            const inboxEl = document.getElementById('admin-inbox-list');
            if (inboxEl) inboxEl.innerHTML = hasReq ? html : '<div style="text-align:center; color:var(--text-light); padding:20px; font-size:14px;">📭 Hộp thư trống.<br>Hiện tại không có học sinh nào kêu cứu!</div>';
        });
    }
};

// 3. Hàm Admin trả lời học sinh
window.replySupport = (reqKey, reqName, secret) => {
    const replyMsg = prompt(`Nhập nội dung trả lời cho [${reqName}]:\\n(VD: ID của em là ABC / Pass mới là 123456)`);
    if (!replyMsg) return;
    
    // Tạo gói phản hồi gửi lên Firebase
    const replyId = new Date().getTime();
    window.db.ref('replies/' + replyId).set({ name: reqName, secret: secret, msg: replyMsg, time: replyId }).then(() => {
        // Trả lời xong thì xóa đơn trong Inbox cho sạch
        window.db.ref('inbox/' + reqKey).remove();
        alert("✅ Đã gửi phản hồi thành công! Học sinh có thể tra cứu ngay bây giờ.");
    });
};
// Hàm xóa thông báo dành cho Admin
window.deleteAnnouncement = (key) => {
    if(confirm("🗑️ Sếp có chắc muốn xóa vĩnh viễn thông báo này không?")) {
        window.db.ref('announcements/' + key).remove().then(() => {
            alert("✅ Đã gỡ thông báo thành công!");
        });
    }
};

// Hàm tải và hiển thị lịch sử thông báo
window.loadAnnouncements = () => {
    window.db.ref('announcements').on('value', s => {
        const el = document.getElementById('rules-display'); 
        if (!el || !window.session) return; 
        
        let html = ''; 
        const myRole = window.session.role; 
        const isAdmin = (myRole === 'admin'); 
        
        let arr = []; 
        s.forEach(child => { arr.push({ key: child.key, ...child.val() }); }); 
        arr.sort((a, b) => b.time - a.time); // Sắp xếp cái mới nhất lên đầu
        
        arr.forEach(a => {
            // Chỉ hiện thông báo phù hợp với vai trò người xem
            if (isAdmin || a.target === 'all' || a.target === myRole) {
                const dt = new Date(a.time); 
                const pad = n => n < 10 ? '0' + n : n; 
                const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())} - ${pad(dt.getDate())}/${pad(dt.getMonth()+1)}`;
                
                let targetLabel = ''; 
                if (isAdmin) { 
                    const lblMap = { 'all': '🌐 Tất cả', 'hs': '🎓 Học sinh', 'gv': '👨‍🏫 Giáo viên' }; 
                    targetLabel = `<span style="font-size:10px; background:#FF9800; color:white; padding:2px 6px; border-radius:10px; margin-left:8px;">Tới: ${lblMap[a.target] || '...'}</span>`; 
                }
                
                // Nút xóa hiện ra nếu là Admin
                let delBtn = isAdmin ? `<button onclick="window.deleteAnnouncement('${a.key}')" style="float:right; background:transparent; border:none; color:#dc3545; cursor:pointer; font-size:16px; padding:0 5px;">🗑️</button>` : '';
                
                html += `
                <div style="background:var(--card); padding:15px; border-radius:15px; border-left:4px solid var(--pink); margin-bottom:10px; border: 1px solid var(--border);">
                    <div style="font-size:11px; color:var(--text-light); border-bottom:1px solid var(--border); padding-bottom:5px; margin-bottom:8px;">
                        ${delBtn}
                        <b style="color:var(--pink);">${a.author}</b> • ${timeStr} ${targetLabel}
                    </div>
                    <div style="white-space:pre-wrap; font-size:14px; line-height:1.4;">${window.escapeHTML(a.text)}</div>
                </div>`;
            }
        });
        el.innerHTML = html || '<div style="text-align:center; color:#888; padding:20px;">📭 Hiện chưa có thông báo nào.</div>';
    });
};


window.openSupportMaster = () => { window.showSupportStep('menu'); window.toggleModal('support-master-modal', true); };
window.showSupportStep = (step) => {
    document.getElementById('support-step-1').classList.add('hidden'); document.getElementById('support-step-2').classList.add('hidden'); document.getElementById('support-step-3').classList.add('hidden');
    if(step === 'menu') { document.getElementById('support-step-1').classList.remove('hidden'); } 
    else if (step === 'forgot-id') { document.getElementById('support-dynamic-title').innerText = "QUÊN ID ĐĂNG NHẬP"; document.getElementById('support-type-hidden').value = "Quên ID"; document.getElementById('support-fullname').value = ""; document.getElementById('support-secret').value = ""; document.getElementById('support-step-2').classList.remove('hidden'); } 
    else if (step === 'forgot-pass') { document.getElementById('support-dynamic-title').innerText = "QUÊN MẬT KHẨU"; document.getElementById('support-type-hidden').value = "Quên Pass"; document.getElementById('support-fullname').value = ""; document.getElementById('support-secret').value = ""; document.getElementById('support-step-2').classList.remove('hidden'); } 
    else if (step === 'check-status') { document.getElementById('check-fullname').value = ""; document.getElementById('check-secret').value = ""; document.getElementById('support-step-3').classList.remove('hidden'); }
};

window.submitSupportRequest = (event) => { 
    const n = document.getElementById('support-fullname').value.trim(); 
    const t = document.getElementById('support-type-hidden').value; 
    const s = document.getElementById('support-secret').value.trim(); 
    
    if (!n || !s) return alert("❌ Vui lòng nhập đủ Họ Tên và Mã Bí Mật!"); 
    
    const btn = event ? event.target : document.querySelector('#support-step-2 .btn-royal');
    if (btn) { btn.disabled = true; btn.innerText = "ĐANG XỬ LÝ..."; }

    const safeKey = n.toLowerCase().replace(/\s+/g, ''); 
    const COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; 
    const nowMs = window.now(); 
    
    window.db.ref('support_cooldowns/' + safeKey).once('value').then(snap => { 
        if (snap.exists() && (nowMs - snap.val()) < COOLDOWN_MS) { 
            const daysLeft = Math.ceil((COOLDOWN_MS - (nowMs - snap.val())) / (1000 * 60 * 60 * 24)); 
            alert(`⏳ BẠN ĐÃ GỬI RỒI!\nHãy chờ Admin xử lý (đợi ${daysLeft} ngày nữa để gửi lại).`);
            if (btn) { btn.disabled = false; btn.innerText = "GỬI YÊU CẦU 🚀"; }
        } else {
            window.db.ref('inbox/' + nowMs).set({ name: n, id: 'Chưa rõ', req: t, secret: s, time: nowMs }).then(() => { 
                window.db.ref('support_cooldowns/' + safeKey).set(nowMs).then(() => { 
                    alert("✅ GỬI THÀNH CÔNG!\nMã Bí Mật của bạn là: " + s); 
                    window.toggleModal('support-master-modal', false); 
                    if (btn) { btn.disabled = false; btn.innerText = "GỬI YÊU CẦU 🚀"; }
                }); 
            }); 
        }
    }); 
};

window.checkSupportReply = () => { 
    const n = document.getElementById('check-fullname').value.trim().toLowerCase(); const s = document.getElementById('check-secret').value.trim(); 
    if (!n || !s) return alert("❌ Vui lòng nhập đủ thông tin!"); 
    window.db.ref('replies').once('value').then(snap => { 
        let f = false, m = "", rk = ""; const d = snap.val() || {}; 
        for (let k in d) { if (d[k].name && d[k].name.toLowerCase() === n && d[k].secret === s) { f = true; m = d[k].msg; rk = k; break; } } 
        if (f) { alert("📩 ADMIN ĐÃ TRẢ LỜI:\n\n" + m + "\n\n(Đã tự hủy để bảo mật!)"); window.db.ref('replies/' + rk).remove(); window.toggleModal('support-master-modal', false); } else { alert("⏳ Sai thông tin hoặc Admin chưa phản hồi!"); } 
    }); 
};


window.openChatChannel = (type) => {
    document.getElementById('btn-chat-global').style.background = type === 'global' ? 'var(--pink)' : 'var(--border)'; document.getElementById('btn-chat-global').style.color = type === 'global' ? 'white' : 'var(--text)';
    document.getElementById('btn-chat-private').style.background = type === 'private' ? 'var(--pink)' : 'var(--border)'; document.getElementById('btn-chat-private').style.color = type === 'private' ? 'white' : 'var(--text)';
    document.getElementById('btn-chat-group').style.background = type === 'group' ? 'var(--pink)' : 'var(--border)'; document.getElementById('btn-chat-group').style.color = type === 'group' ? 'white' : 'var(--text)';
    document.getElementById('chat-global-zone').classList.add('hidden'); document.getElementById('chat-private-zone').classList.add('hidden'); document.getElementById('chat-group-zone').classList.add('hidden');
    
    if (type === 'global') { 
        document.getElementById('chat-global-zone').classList.remove('hidden'); 
        window.currentVillage = 'hs'; 
        window.loadGlobalChat(); 
    } 
    else if (type === 'private') { 
        document.getElementById('chat-private-zone').classList.remove('hidden'); window.closePrivateChat(); window.closeGroupChat(); if(window.session && window.session.role !== 'admin') { document.getElementById('private-search-view').classList.remove('hidden'); window.renderRecentChats(); } 
    }
    else if (type === 'group') { 
        document.getElementById('chat-group-zone').classList.remove('hidden'); window.closePrivateChat(); window.closeGroupChat(); if(window.session && window.session.role !== 'admin') { window.loadGroups(); document.getElementById('group-list-view').classList.remove('hidden'); } 
    }
    
    if ((type === 'private' || type === 'group') && window.session && (window.session.role === 'admin' || window.isDemoMode)) { 
        document.getElementById('admin-spy-zone').classList.remove('hidden'); document.getElementById('private-search-view').classList.add('hidden'); document.getElementById('group-list-view').classList.add('hidden'); 
    }
};


window.loadGlobalChat = () => {
    if (window.currentChatRef) window.currentChatRef.off(); 
    const dbPath = 'chat/global_' + window.currentVillage;
    window.currentChatRef = window.db.ref(dbPath).limitToLast(50);
    window.currentChatRef.on('value', snap => { 
        let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, window.session && m.id === window.session.id, child.key, 'global_' + window.currentVillage, 'global'); }); 
        const box = document.getElementById('global-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:var(--text-light);margin-top:20px;">Ngôi làng này đang yên tĩnh.</div>'; box.scrollTop = box.scrollHeight; 
    });
    window.db.ref(`typing/global_${window.currentVillage}/global`).on('value', snap => { let t = []; snap.forEach(c => { if(c.key !== window.session.id) t.push(c.val()); }); const ind = document.getElementById('global-typing-indicator'); if(t.length>0) { ind.innerText = `${t.join(', ')} đang gõ...`; ind.classList.remove('hidden'); } else { ind.classList.add('hidden'); } });
};

window.lastGlobalChatTime = 0;
window.sendGlobalChat = () => { 
    const nowMs = window.now(); if (nowMs - window.lastGlobalChatTime < 3000) { return alert("⏳ TỪ TỪ ĐÃ BẠN ÊY! Đợi 3 giây để gửi tin nhắn tiếp theo."); }
    const input = document.getElementById('global-chat-input'); const txt = input.value.trim(); if (!txt || !window.session) return; 
    window.db.ref('chat/global_' + window.currentVillage).push({ id: window.session.id, name: window.session.name, text: txt, time: firebase.database.ServerValue.TIMESTAMP }); 
    input.value = ''; window.lastGlobalChatTime = nowMs; window.db.ref(`typing/global_${window.currentVillage}/global/${window.session.id}`).remove();
};

window.renderMessage = (msg, isMe, msgKey, type, convoId) => {
    const align = isMe ? 'align-self:flex-end;' : 'align-self:flex-start;'; const bgClass = isMe ? 'msg-me' : 'msg-other';
    const defaultBg = isMe ? 'background:var(--pink); color:white;' : 'background:var(--soft); color:var(--text);';
    const nameColor = isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-light)'; const nameAlign = isMe ? 'text-align:right;' : 'text-align:left;';
    let txtHtml = msg.text;
    
    if(txtHtml === '[UNSENT]') { 
        txtHtml = '<i style="color:var(--text-light); font-size:12px;">Tin nhắn đã thu hồi</i>'; 
    }
    else if(txtHtml && txtHtml.startsWith('[IMG]') && txtHtml.endsWith('[/IMG]')) { 
        const url = txtHtml.replace('[IMG]','').replace('[/IMG]',''); 
        txtHtml = `<img src="${url}" style="max-height:180px; max-width:100%; border-radius:10px; cursor:pointer; border:1px solid rgba(0,0,0,0.1); object-fit:cover; display:block; margin-top:5px;" onclick="window.viewFullImage('${url}')">`; 
    }
    else { 
        txtHtml = window.escapeHTML(txtHtml); 
    }
    
    const unsendBtn = (isMe && msg.text !== '[UNSENT]') ? `<span onclick="window.unsendMsg('${type}', '${convoId}', '${msgKey}')" style="font-size:12px; cursor:pointer; margin-left:10px; color:var(--text-light); display:inline-block; vertical-align:middle;">🗑️</span>` : '';
    
    return `<div class="${bgClass}" style="max-width:80%; ${align} ${defaultBg} padding:8px 12px; border-radius:15px; position:relative;"><div style="font-size:10px; font-weight:bold; margin-bottom:3px; ${nameAlign} color:${nameColor}; cursor:pointer;" onclick="window.openUserProfile('${msg.id}')">${msg.name}</div><div style="font-size:14px; word-break:break-word;">${txtHtml}${unsendBtn}</div></div>`;
};

window.triggerChatImage = (type) => { window.currentUploadType = type; document.getElementById('chat-img-file').click(); };

window.uploadChatImage = async () => {
    const f = document.getElementById('chat-img-file').files[0]; if(!f) return;
    alert("⏳ Đang tải ảnh lên khung chat...");
    const url = await window.uploadToImgBB(f);
    if(url) {
        const msgText = `[IMG]${url}[/IMG]`;
        if(window.currentUploadType === 'global') {
            window.db.ref('chat/global_' + window.currentVillage).push({ id: window.session.id, name: window.session.name, text: msgText, time: firebase.database.ServerValue.TIMESTAMP });
        }
        else if (window.currentUploadType === 'private') {
            const today = window.getDateStr(0);
  
            window.db.ref('chat/private/' + window.currentPrivateConvo).push({ id: window.session.id, name: window.session.name, text: msgText, time: firebase.database.ServerValue.TIMESTAMP });
        }
        else if (window.currentUploadType === 'group') {
            window.db.ref('chat/group/' + window.currentGroupChat).push({ id: window.session.id, name: window.session.name, text: msgText, time: firebase.database.ServerValue.TIMESTAMP });
        }
    }
    document.getElementById('chat-img-file').value = '';
};

window.unsendMsg = (type, convoId, msgKey) => {
    if(confirm("🗑️ Bạn có chắc muốn thu hồi tin nhắn này?")) {
        let refPath = `chat/${type}/`; 
        if (type.startsWith('global')) refPath = `chat/${type}/${msgKey}`; 
        else refPath += `${convoId}/${msgKey}`;
        window.db.ref(refPath).update({text: '[UNSENT]'});
    }
};

window.onChatInput = (type) => {
    let cId = ''; 
    if(type === 'global') {
        window.db.ref(`typing/global_${window.currentVillage}/global/${window.session.id}`).set(window.session.name);
        clearTimeout(window.typingTimeout); window.typingTimeout = setTimeout(() => window.db.ref(`typing/global_${window.currentVillage}/global/${window.session.id}`).remove(), 2000);
        return;
    }
    else if(type === 'private') cId = window.currentPrivateConvo; else if(type === 'group') cId = window.currentGroupChat;
    if(!cId) return; window.db.ref(`typing/${type}/${cId}/${window.session.id}`).set(window.session.name);
    clearTimeout(window.typingTimeout); window.typingTimeout = setTimeout(() => window.db.ref(`typing/${type}/${cId}/${window.session.id}`).remove(), 2000);
};
window.renderRecentChats = () => {
    if(!window.session || !window.allUsersMap) return; 
    const rList = document.getElementById('recent-chat-list'); 
    const onlineZone = document.getElementById('tt-online-zone'); 
    if(!rList) return;
    window.db.ref('chat_streaks').once('value').then(snap => {
        let html = ''; let onlineHtml = '';
        window.db.ref('tracking').once('value').then(trackSnap => {
            const trackData = trackSnap.val() || {};
            snap.forEach(child => {
                const convoId = child.key; 
                if(convoId.includes('_') && convoId.includes(window.session.id)) {
                    const targetId = convoId.replace(window.session.id, '').replace('_','');
                    const u = window.allUsersMap[targetId]; if(!u && targetId !== 'admin') return;
                    const tName = targetId === 'admin' ? 'BOSS QUÂN' : u.name; 
                    const tAvatar = targetId === 'admin' ? 'https://cdn-icons-png.flaticon.com/512/149/149071.png' : (u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png');
                    const hasUnread = (window.unreadData && window.unreadData[targetId]); 
                    const isOnline = trackData[targetId] && trackData[targetId].status === 'online'; 
                    
                    // --- GIAO DIỆN CHUẨN MESSENGER ---
                    const dotColor = isOnline ? '#31a24c' : 'transparent'; // Xanh lá báo Online
                    const onlineDot = isOnline ? `<div style="position:absolute; bottom:2px; right:2px; width:14px; height:14px; background:${dotColor}; border:2px solid var(--bg); border-radius:50%;"></div>` : '';
                    
                    // Xử lý in đậm nếu có tin nhắn mới
                    const nameWeight = hasUnread ? '800' : '600';
                    const nameColor = hasUnread ? 'var(--text)' : 'var(--text)';
                    const previewText = hasUnread ? 'Bạn có tin nhắn mới...' : 'Đã kết nối • Gần đây';
                    const previewColor = hasUnread ? 'var(--text)' : 'var(--text-light)';
                    const previewWeight = hasUnread ? 'bold' : 'normal';
                    const unreadDot = hasUnread ? `<div style="width:12px; height:12px; background:#0084ff; border-radius:50%; margin-top:5px;"></div>` : '';

                    // 1. Khối người dùng trong Danh Sách (Cột dọc)
                    html += `
                    <button onclick="window.openDirectChat('${targetId}')" style="display:flex; align-items:center; width:100%; background:transparent; border:none; padding:12px 15px; cursor:pointer; transition:0.2s; text-align:left;">
                        <div style="position:relative; margin-right:15px; flex-shrink:0;">
                            <img src="${tAvatar}" style="width:52px; height:52px; border-radius:50%; object-fit:cover;">
                            ${onlineDot}
                        </div>
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-size:16px; font-weight:${nameWeight}; color:${nameColor}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;">${tName}</div>
                            <div style="font-size:13px; color:${previewColor}; font-weight:${previewWeight}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${previewText}</div>
                        </div>
                        <div style="flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; width:20px;">
                            ${unreadDot}
                        </div>
                    </button>`;

                    // 2. Khối người dùng đang Online (Cuộn ngang ở trên cùng)
                    if (isOnline) { 
                        const shortName = tName.split(' ')[tName.split(' ').length - 1]; // Chỉ lấy tên thật (chữ cuối cùng)
                        onlineHtml += `
                        <div onclick="window.openDirectChat('${targetId}')" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; width:64px; flex-shrink:0;">
                            <div style="position:relative;">
                                <img src="${tAvatar}" style="width:56px; height:56px; border-radius:50%; object-fit:cover; border: 2px solid #0084ff; padding:2px;">
                                <div style="position:absolute; bottom:2px; right:2px; width:14px; height:14px; background:#31a24c; border:2px solid var(--card); border-radius:50%;"></div>
                            </div>
                            <span style="font-size:12px; color:var(--text); margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; text-align:center;">${shortName}</span>
                        </div>`; 
                    }
                }
            });
            rList.innerHTML = html || '<p style="text-align:center; color:var(--text-light); font-size:13px; margin-top:20px;">Bạn chưa kết nối với ai.</p>';
            if(onlineZone) { 
                onlineZone.innerHTML = onlineHtml; 
                onlineZone.style.display = onlineHtml ? 'flex' : 'none'; 
                // Căn chỉnh khoảng cách khung Online giống Messenger
                onlineZone.style.padding = '15px 10px';
                onlineZone.style.gap = '15px';
                onlineZone.style.overflowX = 'auto';
                onlineZone.style.borderBottom = '1px solid var(--border)';
            }
        });
    });
};


window.openDirectChat = (uid) => { window.db.ref('users/'+uid).once('value').then(s => { const u = s.val() || { name: 'BOSS QUÂN', role: 'admin', allowPrivate: true }; const tName = uid === 'admin' ? 'BOSS QUÂN' : u.name; window.closePrivateChat(); window.checkAndStartPrivateChat(uid, tName, u.allowPrivate !== false); }); };

window.checkAndStartPrivateChat = (targetId, targetName, allowPrivate) => {
    if (!allowPrivate && window.session.role !== 'admin') return alert("🔕 Người này TẮT nhận tin nhắn riêng!");
    document.getElementById('private-search-view').classList.add('hidden'); document.getElementById('private-chat-area').classList.remove('hidden');
    document.getElementById('private-chat-title').innerText = "💬 " + targetName + " (" + targetId.toUpperCase() + ")";
    window.currentPrivateConvo = window.getConvoId(window.session.id, targetId); window.db.ref('unread/' + window.session.id + '/' + targetId).remove();
    document.getElementById('private-chat-input-zone').classList.remove('hidden');
    if (window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/private/' + window.currentPrivateConvo);
    window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, m.id === window.session.id, child.key, 'private', window.currentPrivateConvo); }); const box = document.getElementById('private-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:var(--text-light);margin-top:20px;">Hãy gửi lời chào! 👋</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
    window.db.ref(`typing/private/${window.currentPrivateConvo}`).on('value', snap => { let t = []; snap.forEach(c => { if(c.key !== window.session.id) t.push(c.val()); }); const ind = document.getElementById('private-typing-indicator'); if(t.length>0) { ind.innerText = `${t.join(', ')} đang gõ...`; ind.classList.remove('hidden'); } else ind.classList.add('hidden'); });
};

window.closePrivateChat = () => { document.getElementById('private-chat-area').classList.add('hidden'); if (window.isSpying) { document.getElementById('admin-spy-zone').classList.remove('hidden'); window.isSpying = false; } else document.getElementById('private-search-view').classList.remove('hidden'); window.currentPrivateConvo = ""; if (window.currentChatRef) window.currentChatRef.off(); };

window.sendPrivateChat = () => { 
    const input = document.getElementById('private-chat-input'); const txt = input.value.trim(); if(!txt || !window.currentPrivateConvo) return;
    const targetId = window.currentPrivateConvo.replace(window.session.id, '').replace('_', '');
    const sendMsg = () => {
        const today = window.getDateStr(0);

        window.db.ref('chat/private/' + window.currentPrivateConvo).push({ id: window.session.id, name: window.session.name, text: txt, time: firebase.database.ServerValue.TIMESTAMP });
        window.db.ref('unread/' + targetId + '/' + window.session.id).set(true); window.db.ref(`typing/private/${window.currentPrivateConvo}/${window.session.id}`).remove(); input.value = '';
    };
    window.db.ref(`friends/${window.session.id}/${targetId}`).once('value').then(snap => {
        const isFriend = snap.val() === 'accepted'; const isAdmin = window.session.role === 'admin' || targetId === 'admin';
        if (!isFriend && !isAdmin) { window.db.ref('chat/private/' + window.currentPrivateConvo).orderByChild('id').equalTo(window.session.id).once('value').then(msgSnap => { if (msgSnap.numChildren() >= 1) { alert("⚠️ CHƯA KẾT BẠN!\nBạn chỉ được gửi 1 tin nhắn làm quen."); } else { sendMsg(); } }); } 
        else { sendMsg(); }
    });
};
window.loadGroups = () => {
    if(!window.session) return;
    window.db.ref('groups').on('value', snap => {
        let html = ''; snap.forEach(child => { const grp = child.val(); if (grp.members && grp.members[window.session.id] || window.session.role === 'admin') { html += `<button class="tt-item" onclick="window.openGroupChat('${child.key}', '${grp.name}', '${grp.admin}')"><div class="tt-avt-wrap"><div class="tt-avt" style="background:#ff0050; display:flex; justify-content:center; align-items:center; color:white; font-size:24px; font-weight:bold;">👥</div></div><div class="tt-info"><div class="tt-name">${grp.name}</div><span class="tt-preview">Nhóm • Quản trị viên: ${grp.admin.toUpperCase()}</span></div><div class="tt-action"><i class="fa-solid fa-chevron-right" style="color:var(--border);"></i></div></button>`; } });
        document.getElementById('my-groups-list').innerHTML = html || '<p style="text-align:center; color:var(--text-light); font-size:13px; margin-top:20px;">Chưa tham gia nhóm nào.</p>';
    });
};

window.openCreateGroupModal = () => { let gName = prompt("Nhập tên Nhóm:", "Nhóm Học Tập"); if(!gName) return; const gId = 'grp_' + new Date().getTime(); let members = {}; members[window.session.id] = true; window.db.ref('groups/' + gId).set({ name: gName, admin: window.session.id, members: members }).then(() => { alert("Tạo nhóm thành công!"); }); };
window.openGroupChat = (gId, gName, gAdmin) => {
    document.getElementById('group-list-view').classList.add('hidden'); document.getElementById('group-chat-area').classList.remove('hidden'); window.currentGroupChat = gId; window.currentGroupAdmin = gAdmin; const titleEl = document.getElementById('group-chat-title'); 
    titleEl.innerText = `👥 ${gName}`;
    if(window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/group/' + gId); window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, m.id === window.session.id, child.key, 'group', gId); }); const box = document.getElementById('group-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:var(--text-light);">Nhóm mới, hãy chào nhau!</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
    window.db.ref(`typing/group/${gId}`).on('value', snap => { let t = []; snap.forEach(c => { if(c.key !== window.session.id) t.push(c.val()); }); const ind = document.getElementById('group-typing-indicator'); if(t.length>0) { ind.innerText = `${t.join(', ')} đang gõ...`; ind.classList.remove('hidden'); } else { ind.classList.add('hidden'); } });
};

window.sendGroupChat = () => { 
    const input = document.getElementById('group-chat-input'); 
    const txt = input.value.trim(); 
    if(!txt || !window.currentGroupChat) return; 
    
    window.db.ref('chat/group/' + window.currentGroupChat).push({ 
        id: window.session.id, 
        name: window.session.name, 
        text: txt, 
        time: firebase.database.ServerValue.TIMESTAMP 
    }); 
    
    input.value = ''; 
    window.db.ref(`typing/group/${window.currentGroupChat}/${window.session.id}`).remove(); 
};


window.closeGroupChat = () => { document.getElementById('group-chat-area').classList.add('hidden'); if(!window.isSpying) document.getElementById('group-list-view').classList.remove('hidden'); window.currentGroupChat = ""; if(window.currentChatRef) window.currentChatRef.off(); if(window.currentStreakRef) window.currentStreakRef.off(); };

window.openGroupManageModal = () => { if(!window.currentGroupChat) return; window.db.ref('groups/' + window.currentGroupChat).once('value').then(snap => { const grp = snap.val(); const isAdmin = (window.session.id === grp.admin || window.session.role === 'admin'); document.getElementById('group-admin-status').innerText = isAdmin ? "👑 Quản trị viên" : "👤 Thành viên"; document.getElementById('group-add-member-zone').classList[isAdmin ? 'remove' : 'add']('hidden'); let html = ''; for(let uid in grp.members) { let kickBtn = (isAdmin && uid !== grp.admin) ? `<button style="color:red; background:none; border:none; cursor:pointer;" onclick="window.kickGroupMember('${uid}')">❌ Xóa</button>` : ''; let roleTxt = (uid === grp.admin) ? '👑 Admin' : '👤 Thành viên'; html += `<li style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;"><span><b style="color:var(--pink);">${uid.toUpperCase()}</b> <span style="color:var(--text-light);">(${roleTxt})</span></span> ${kickBtn}</li>`; } if(!isAdmin) { html += `<button style="width:100%; margin-top:15px; padding:10px; background:#dc3545; color:white; border:none; border-radius:10px; font-weight:bold;" onclick="window.leaveGroup()">🚪 RỜI NHÓM</button>`; } document.getElementById('group-member-list').innerHTML = html; window.toggleModal('group-manage-modal', true); }); };

window.addGroupMember = () => { const uid = document.getElementById('new-member-id').value.toLowerCase().trim(); if(!uid) return; window.db.ref('users/'+uid).once('value').then(s => { if(!s.exists()) return alert("ID không tồn tại!"); window.db.ref(`groups/${window.currentGroupChat}/members/${uid}`).set(true).then(() => { alert("Thêm thành công!"); document.getElementById('new-member-id').value = ''; window.openGroupManageModal(); }); }); };
window.kickGroupMember = (uid) => { if(confirm("Đuổi?")) { window.db.ref(`groups/${window.currentGroupChat}/members/${uid}`).remove().then(() => { window.openGroupManageModal(); }); } };
window.leaveGroup = () => { if(confirm("Bạn muốn rời nhóm này?")) { window.db.ref(`groups/${window.currentGroupChat}/members/${window.session.id}`).remove().then(() => { alert("Đã rời nhóm!"); window.toggleModal('group-manage-modal', false); window.closeGroupChat(); }); } };

window.loadAdminSpy = () => { 
    if (!window.session || window.session.role !== 'admin') return; 
    window.db.ref('chat_streaks').on('value', snap => { 
        let html = ''; 
        snap.forEach(child => { 
            const convoId = child.key; 
            if(convoId.includes('_')) { 
                const ids = convoId.split('_'); 
                const n1 = window.allUsersMap?.[ids[0]]?.name || ids[0]; 
                const n2 = window.allUsersMap?.[ids[1]]?.name || ids[1]; 
                html += `<div class="spy-convo-item card shadow-lux" style="padding:15px; cursor:pointer; margin-bottom:10px; border-left:4px solid #dc3545;" onclick="window.spyPrivateChat('${ids[0]}', '${ids[1]}')"><div style="font-weight:bold; color:var(--pink);">${n1} 💬 ${n2}</div><div style="font-size:12px; color:var(--text-light);">ID: ${ids[0]} & ${ids[1]}</div></div>`; 
            } else if (convoId.startsWith('grp_')) { 
                html += `<div class="spy-convo-item card shadow-lux" style="padding:15px; cursor:pointer; margin-bottom:10px; border-left:4px solid #9C27B0;" onclick="window.spyGroupChat('${convoId}')"><div style="font-weight:bold; color:#9C27B0;">👥 NHÓM: ${convoId}</div></div>`; 
            } 
        }); 
        document.getElementById('admin-convo-list').innerHTML = html || '<p style="text-align:center;color:var(--text-light);">Chưa có chat.</p>'; 
    }); 
};


window.spyPrivateChat = (id1, id2) => {
    if (!id1 || !id2) return; const convoId = window.getConvoId(id1, id2); window.isSpying = true;
    document.getElementById('admin-spy-zone').classList.add('hidden'); document.getElementById('private-chat-area').classList.remove('hidden');
    document.getElementById('private-chat-input-zone').classList.add('hidden'); document.getElementById('private-chat-title').innerText = "🕵️ Đọc lén: " + id1.toUpperCase() + " & " + id2.toUpperCase();
    if (window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/private/' + convoId);
    window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, m.id === id1, child.key, 'private', convoId); }); const box = document.getElementById('private-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;">Trống!</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
};

window.spyGroupChat = (gId) => {
    window.isSpying = true; document.getElementById('admin-spy-zone').classList.add('hidden'); document.getElementById('group-chat-area').classList.remove('hidden');
    window.db.ref('groups/' + gId).once('value').then(s => {
        if(!s.exists()) return; window.currentGroupChat = gId; document.getElementById('group-chat-title').innerText = "🕵️ Đọc lén Nhóm: " + s.val().name;
        if(window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/group/' + gId);
        window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, false, child.key, 'group', gId); }); const box = document.getElementById('group-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;">Trống!</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
    });
};


// BỔ SUNG CÁC HÀM QUẢN LÝ GIAO DIỆN (BRANDING) BỊ RỚT NHỊP
window.previewBrandLogo = i => { 
    const f = i.files[0]; if(!f) return; 
    window.tempBrandFile = f; 
    const r = new FileReader(); 
    r.onload = e => { 
        document.getElementById('brand-preview-logo').src = e.target.result; 
        document.getElementById('brand-preview-logo').classList.remove('hidden'); 
    }; 
    r.readAsDataURL(f); 
};

window.previewSplashLogo = i => { 
    const f = i.files[0]; if(!f) return; 
    window.tempSplashFile = f; 
    const r = new FileReader(); 
    r.onload = e => { 
        document.getElementById('splash-preview-logo').src = e.target.result; 
        document.getElementById('splash-preview-logo').classList.remove('hidden'); 
    }; 
    r.readAsDataURL(f); 
};

window.saveBranding = async () => { 
    if (!window.db) return; 
    let u = { name: document.getElementById('brand-name-input').value }; 
    alert("⏳ Đang lưu thiết lập, đang đẩy ảnh sang ImgBB...");
    
    if (window.tempBrandFile) { 
        const logoUrl = await window.uploadToImgBB(window.tempBrandFile); 
        if(logoUrl) u.logo = logoUrl; 
    }
    if (window.tempSplashFile) { 
        const splashUrl = await window.uploadToImgBB(window.tempSplashFile); 
        if(splashUrl) u.splashLogo = splashUrl; 
    }
    
    window.db.ref('config/branding').update(u).then(() => { 
        alert("✅ LƯU GIAO DIỆN THÀNH CÔNG!"); 
        if (u.splashLogo) localStorage.setItem('savedSplashLogo', u.splashLogo); 
        location.reload();
    });
};

// Hàm hỗ trợ tải ảnh lên ImgBB (Cần thiết để các tính năng ảnh hoạt động)
window.uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${window.IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const json = await res.json();
        return json.success ? json.data.url : null;
    } catch (e) { return null; }
};

// Hàm xử lý khi chọn ảnh cá nhân
window.uploadUserAvt = async () => {
    const file = document.getElementById('user-file').files[0];
    if(!file || !window.session) return;
    alert("⏳ Đang cập nhật ảnh đại diện...");
    const url = await window.uploadToImgBB(file);
    if(url) {
        window.db.ref('users/' + window.session.id).update({ avatar: url }).then(() => {
            window.session.avatar = url;
            document.getElementById('user-avatar').src = url;
            alert("✅ Đã đổi ảnh đại diện thành công!");
        });
    }
};

// Hàm xử lý khi bấm vào ảnh đại diện
window.onAvatarClick = () => {
    document.getElementById('user-file').click();
};
// Hàm xem phóng to ảnh trong khung chat
window.viewFullImage = (url) => {
    const imgEl = document.getElementById('full-avatar-img');
    if(imgEl) {
        imgEl.src = url;
        window.toggleModal('avatar-viewer-modal', true);
    }
};

// Hàm xem phóng to ảnh đại diện (Avatar)
window.viewFullAvatar = () => {
    const avatarSrc = document.getElementById('profile-avatar').src;
    if(avatarSrc) {
        window.viewFullImage(avatarSrc);
    }
};
// Hàm xem trước ảnh khi Admin chọn ảnh để cấp cho User
window.previewGrantImg = (input) => {
    const file = input.files[0];
    if (!file) return;
    
    window.tempGrantFile = file; // Lưu tạm file để lát nữa bấm Lưu sẽ upload
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const previewEl = document.getElementById('grant-preview-img');
        previewEl.src = e.target.result;
        previewEl.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

// Hàm thực hiện tải ảnh lên ImgBB và lưu đường dẫn vào database cho User
window.grantAvatar = async () => {
    const targetId = document.getElementById('avatar-target-id').value.trim().toLowerCase();
    
    if (!targetId) return alert("❌ Vui lòng nhập ID người nhận ảnh!");
    if (!window.tempGrantFile) return alert("❌ Vui lòng chọn một bức ảnh để cấp!");

    alert("⏳ Đang tải ảnh lên hệ thống...");
    const url = await window.uploadToImgBB(window.tempGrantFile);
    
    if (url) {
        window.db.ref('users/' + targetId).once('value').then(snap => {
            if (!snap.exists()) {
                alert("❌ Lỗi: Không tìm thấy ID người dùng này trong hệ thống!");
            } else {
                window.db.ref('users/' + targetId).update({ avatar: url }).then(() => {
                    alert("✅ Đã cấp ảnh thành công cho ID: " + targetId.toUpperCase());
                    
                    // Dọn dẹp giao diện sau khi cấp xong
                    document.getElementById('avatar-target-id').value = '';
                    document.getElementById('grant-preview-img').classList.add('hidden');
                    document.getElementById('grant-file').value = '';
                    window.tempGrantFile = null;
                });
            }
        });
    } else {
        alert("❌ Lỗi tải ảnh! Hãy kiểm tra lại kết nối mạng hoặc API Key.");
    }
};

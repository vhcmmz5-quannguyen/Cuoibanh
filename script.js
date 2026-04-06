window.db = null; window.session = null; var tempGrantImg = "", tempBrandLogo = "", tempSplashLogo = "";
window.isHk2Locked = false; window.isDemoMode = false; window.currentClearPin = "654321";
window.currentChatRef = null; window.currentPrivateConvo = ""; window.currentStreakRef = null; window.isSpying = false;
window.currentGroupChat = ""; window.currentGroupAdmin = ""; window.html5QrcodeScanner = null;

const showNetworkToast = (msg, bg) => { const t = document.getElementById('network-toast'); if(t) { t.innerText = msg; t.style.background = bg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 4000); } };
window.addEventListener('offline', () => showNetworkToast('⚠️ Đã mất kết nối mạng!', '#dc3545')); window.addEventListener('online', () => showNetworkToast('✅ Đã có mạng trở lại!', '#4CAF50'));
const setOfflineStatus = () => { if (window.session && window.db) window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }); };
window.addEventListener('beforeunload', setOfflineStatus); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') setOfflineStatus(); else if (document.visibilityState === 'visible' && window.session && window.db) window.db.ref('tracking/' + window.session.id).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); });

document.addEventListener('DOMContentLoaded', () => { const s = localStorage.getItem('savedSplashLogo'); if (s) { const defaultSpin = document.getElementById('default-spinner'); if (defaultSpin) defaultSpin.classList.add('hidden'); const c = document.getElementById('custom-splash-img'); if (c) { c.src = s; c.classList.remove('hidden'); c.style.display = 'block'; } } });
window.toggleModal = (id, show) => { const m = document.getElementById(id); if (m) m.classList[show ? 'remove' : 'add']('hidden'); };
window.toggleSidebar = (show) => { const s = document.getElementById('sidebar'); if (s) { s.classList[show ? 'add' : 'remove']('open'); if(show && window.session) document.getElementById('main-noti-dot').classList.add('hidden'); } };

window.switchTab = (id) => { 
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.add('hidden')); 
    const tb = document.getElementById('tab-' + id); 
    if (tb) tb.classList.remove('hidden'); 
    window.toggleSidebar(false); 
    if(id === 'chat') { openChatChannel('global'); document.getElementById('menu-noti-dot').classList.add('hidden'); } 
    if(id === 'myprofile' && typeof window.loadMyProfileTab === 'function') { window.loadMyProfileTab(); } 
};

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            const c = { apiKey: "AIzaSyAcfas2KJo9n4Lpb9YVhGOpKWfYgBlSE9U", authDomain: "app-co-eb5d0.firebaseapp.com", projectId: "app-co-eb5d0", storageBucket: "app-co-eb5d0.firebasestorage.app", messagingSenderId: "160906787270", appId: "1:160906787270:web:638e28599f303dfddd1ac7", databaseURL: "https://app-co-eb5d0-default-rtdb.firebaseio.com" };
            if (!firebase.apps.length) firebase.initializeApp(c);
            window.db = firebase.database();
            window.db.ref('.info/connected').on('value', snap => { if (snap.val() === true) { const gl = document.getElementById('global-loading'); if(gl) gl.classList.add('hidden'); } });
            window.db.ref('config/branding').on('value', s => { if (s.exists()) { const d = s.val(); applyBranding(d.name, d.logo); if (d.splashLogo) localStorage.setItem('savedSplashLogo', d.splashLogo); } const splash = document.getElementById('splash-screen'); const login = document.getElementById('login-screen'); if (splash) { splash.style.display = 'none'; splash.classList.add('hidden'); } if (login) login.classList.remove('hidden'); });
        }
    } catch (e) { console.log("Lỗi Firebase", e); }
}
initFirebase();
function applyBranding(n, l) { document.querySelectorAll('.dynamic-app-name').forEach(e => e.innerText = n || "KIM MIN LAI V3"); document.querySelectorAll('.dynamic-logo').forEach(e => { if (l) { e.src = l; e.classList.remove('hidden'); } else e.classList.add('hidden'); }); const b = document.getElementById('brand-name-input'); if (b) b.value = n || ""; }

window.handleLogin = () => {
    const i = document.getElementById('username').value.trim().toLowerCase(); const p = document.getElementById('password').value.trim(); const b = document.getElementById('login-btn');
    if (!i || !p) return alert("Điền đủ thông tin!");
    b.innerText = "ĐANG TẢI..."; b.disabled = true;
    const st = (d, u) => { window.db.ref('tracking/' + u).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); window.session = { id: u, role: d.role, name: d.name, avatar: d.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', allowPrivate: d.allowPrivate !== false }; startIntro(); };
    const emailAo = i + '@kimminlai.com';
    firebase.auth().signInWithEmailAndPassword(emailAo, p).then((userCredential) => {
        window.db.ref('users/' + i).once('value').then(s => {
            if (i === 'admin') { st(s.val() || { role: 'admin', name: 'BOSS QUÂN' }, 'admin'); } 
            else if (s.exists()) { if (s.val().isLocked) { alert("Tài khoản bị Khóa!"); firebase.auth().signOut(); b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false; } else st(s.val(), i); } 
            else { alert("Lỗi Data!"); firebase.auth().signOut(); b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false; }
        });
    }).catch((error) => { alert("Sai ID hoặc Mật khẩu!"); b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false; });
};

window.handleLogout = () => { if (window.session && window.db) window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }).then(() => location.reload()); else location.reload(); };
window.startIntro = () => { document.getElementById('login-screen').classList.add('hidden'); const o = document.getElementById('intro-overlay'); document.getElementById('intro-img').src = window.session.avatar; o.classList.remove('hidden'); setTimeout(() => { document.body.classList.add('shrink-anim'); setTimeout(() => { o.classList.add('hidden'); document.body.classList.remove('shrink-anim'); enterApp(); }, 850); }, 800); };

window.enterApp = () => { 
    document.getElementById('main-screen').classList.remove('hidden'); document.getElementById('display-name-real').innerText = window.session.name; document.getElementById('display-role').innerText = window.session.role.toUpperCase(); document.getElementById('user-avatar').src = window.session.avatar; 
    document.getElementById('connect-my-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(location.origin + location.pathname + '?user=' + window.session.id)}`;
    loadRealtime(); loadGroups(); loadFriendRequests();
    window.db.ref('unread/' + window.session.id).on('value', s => {
        if(s.exists() && Object.keys(s.val()).length > 0) { document.getElementById('main-noti-dot').classList.remove('hidden'); document.getElementById('menu-noti-dot').classList.remove('hidden'); document.getElementById('private-noti-dot').classList.remove('hidden'); window.unreadData = s.val(); } 
        else { document.getElementById('main-noti-dot').classList.add('hidden'); document.getElementById('menu-noti-dot').classList.add('hidden'); document.getElementById('private-noti-dot').classList.add('hidden'); window.unreadData = null; }
        renderRecentChats();
    });
    const urlParams = new URLSearchParams(window.location.search); const targetUser = urlParams.get('user');
    if(targetUser && targetUser !== window.session.id) { openUserProfile(targetUser); }
};

window.copyMyLink = () => { const link = location.origin + location.pathname + '?user=' + window.session.id; navigator.clipboard.writeText(link).then(() => alert("Đã sao chép liên kết!")); };
window.searchConnectUser = () => { const val = document.getElementById('connect-search-id').value.trim().toLowerCase(); if(!val) return; openUserProfile(val); };
window.startQRScanner = () => { if (!window.html5QrcodeScanner) { window.html5QrcodeScanner = new Html5QrcodeScanner("connect-qr-reader", { fps: 10, qrbox: {width: 250, height: 250} }, false); window.html5QrcodeScanner.render((decodedText) => { if (decodedText.includes(location.origin) && decodedText.includes('?user=')) { if(window.html5QrcodeScanner) { window.html5QrcodeScanner.clear(); window.html5QrcodeScanner = null; } const targetId = decodedText.split('?user=')[1]; openUserProfile(targetId); } else { alert("❌ LỖI: Mã QR không hợp lệ!"); } }, (error) => {}); } };
window.escapeHTML = (str) => { return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : ''; };
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
            selfEditBtn.classList.add('hidden'); chatBtn.classList.remove('hidden'); chatBtn.onclick = () => { toggleModal('user-profile-modal', false); switchTab('chat'); openChatChannel('private'); checkAndStartPrivateChat(uid, u.name, u.allowPrivate !== false); };
            window.db.ref(`friends/${window.session.id}/${uid}`).on('value', fSnap => {
                const fStatus = fSnap.val(); friendBtn.classList.remove('hidden');
                if (fStatus === 'accepted') { friendBtn.innerText = "✅ BẠN BÈ"; friendBtn.style.background = "#888"; friendBtn.onclick = null; } 
                else if (fStatus === 'sent') { friendBtn.innerText = "⏳ ĐÃ GỬI YÊU CẦU"; friendBtn.style.background = "#FF9800"; friendBtn.onclick = null; } 
                else if (fStatus === 'received') { friendBtn.innerText = "🤝 CHẤP NHẬN KẾT BẠN"; friendBtn.style.background = "#4CAF50"; friendBtn.onclick = () => acceptFriendRequest(uid); } 
                else if (fStatus === 'declined') { friendBtn.innerText = "🚫 ĐÃ BỊ TỪ CHỐI"; friendBtn.style.background = "#dc3545"; friendBtn.onclick = () => alert("Người này đã từ chối bạn trước đó!"); }
                else { friendBtn.innerText = "➕ KẾT BẠN"; friendBtn.style.background = "#1877F2"; friendBtn.onclick = () => sendFriendRequest(uid); }
            });
        }
        toggleModal('user-profile-modal', true);
    });
};

window.openSelfEdit = () => { window.db.ref('users/'+window.session.id).once('value').then(s => { const u = s.val() || {}; document.getElementById('self-birthyear').value = u.birthYear || ''; document.getElementById('self-quote').value = u.quote || ''; document.getElementById('self-bio').value = u.bio || ''; toggleModal('user-profile-modal', false); toggleModal('self-edit-modal', true); }); };
window.saveSelfProfile = () => { const by = document.getElementById('self-birthyear').value.trim(); const quote = document.getElementById('self-quote').value.trim(); const bio = document.getElementById('self-bio').value.trim(); window.db.ref('users/'+window.session.id).update({ birthYear: by, quote: quote, bio: bio }).then(() => { alert("✅ Cập nhật hồ sơ thành công!"); toggleModal('self-edit-modal', false); window.loadMyProfileTab(); openUserProfile(window.session.id); }); };
window.sendFriendRequest = (targetId) => { window.db.ref(`friends/${targetId}/${window.session.id}`).once('value').then(snap => { if (snap.val() === 'declined') { alert("🚫 Bị block rồi!\nNgười này đã TỪ CHỐI lời mời của bạn."); } else { window.db.ref(`friends/${window.session.id}/${targetId}`).set('sent'); window.db.ref(`friends/${targetId}/${window.session.id}`).set('received'); alert("Đã gửi yêu cầu kết bạn!"); } }); };
window.acceptFriendRequest = (targetId) => { window.db.ref(`friends/${window.session.id}/${targetId}`).set('accepted'); window.db.ref(`friends/${targetId}/${window.session.id}`).set('accepted'); alert("Hai bạn đã trở thành bạn bè!"); };
window.declineFriendRequest = (targetId) => { if(confirm("Bạn có chắc muốn từ chối lời mời kết bạn này?")) { window.db.ref(`friends/${window.session.id}/${targetId}`).set('declined'); window.db.ref(`friends/${targetId}/${window.session.id}`).remove(); } };

window.loadFriendRequests = () => {
    if (!window.session) return;
    window.db.ref('friends/' + window.session.id).on('value', snap => {
        const reqs = snap.val() || {}; let hasReq = false; let html = ''; let promises = [];
        for (let targetId in reqs) {
            if (reqs[targetId] === 'received') {
                hasReq = true;
                promises.push(window.db.ref('users/' + targetId).once('value').then(uS => {
                    const u = uS.val() || {name: targetId};
                    return `<div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:10px; border-radius:10px; border:1px solid #FF9800;"><div><b>${u.name}</b><br><small>ID: ${targetId.toUpperCase()}</small></div><div style="display:flex; gap:5px;"><button class="btn-royal" style="background:#4CAF50; width:auto; padding:6px 12px; font-size:11px;" onclick="acceptFriendRequest('${targetId}')">✅ NHẬN</button><button class="btn-royal" style="background:#dc3545; width:auto; padding:6px 12px; font-size:11px;" onclick="declineFriendRequest('${targetId}')">❌ XÓA</button></div></div>`;
                }));
            }
        }
        if (hasReq) { Promise.all(promises).then(res => { document.getElementById('friend-requests-list').innerHTML = res.join(''); document.getElementById('friend-requests-zone').classList.remove('hidden'); }); } 
        else { document.getElementById('friend-requests-zone').classList.add('hidden'); document.getElementById('friend-requests-list').innerHTML = ''; }
    });
};

// CHÌA KHÓA IMGBB CỦA SẾP
const IMGBB_API_KEY = "Cdb452c548546016f5ad7d5954d6d280"; 

window.uploadToImgBB = async (file) => {
    const formData = new FormData(); formData.append("image", file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const data = await res.json(); return data.data.url;
    } catch (err) { alert("❌ Lỗi up ảnh sang máy chủ trung gian!"); return null; }
};

window.viewFullAvatar = () => { document.getElementById('full-avatar-img').src = window.session.avatar; toggleModal('avatar-viewer-modal', true); }; 

window.onAvatarClick = () => { 
    if (window.session.role === 'admin') document.getElementById('user-file').click(); 
    else viewFullAvatar(); 
}; 
window.uploadUserAvt = async () => { 
    if (window.session.role !== 'admin') return alert("❌ Lỗi: Chỉ Admin mới có quyền đổi ảnh đại diện!");
    const f = document.getElementById('user-file').files[0]; if(!f) return;
    alert("⏳ Đang đẩy ảnh của Admin sang kho ImgBB... Sếp đợi vài giây nhé!");
    const imgUrl = await window.uploadToImgBB(f);
    if(imgUrl) {
        window.db.ref('users/' + window.session.id + '/avatar').set(imgUrl).then(() => {
            alert("✅ Cập nhật Avatar thành công!"); location.reload();
        });
    }
};

window.previewSplashLogo = i => { 
    const f = i.files[0]; if(!f) return; window.tempSplashFile = f; 
    const r = new FileReader(); r.onload = e => { document.getElementById('splash-preview-logo').src = e.target.result; document.getElementById('splash-preview-logo').classList.remove('hidden'); }; r.readAsDataURL(f); 
};
window.previewBrandLogo = i => { 
    const f = i.files[0]; if(!f) return; window.tempBrandFile = f; 
    const r = new FileReader(); r.onload = e => { document.getElementById('brand-preview-logo').src = e.target.result; document.getElementById('brand-preview-logo').classList.remove('hidden'); }; r.readAsDataURL(f); 
};
window.saveBranding = async () => { 
    if (!window.db) return; let u = { name: document.getElementById('brand-name-input').value }; 
    alert("⏳ Đang lưu thiết lập, đang gửi ảnh sang ImgBB...");
    if (window.tempBrandFile) { const logoUrl = await window.uploadToImgBB(window.tempBrandFile); if(logoUrl) u.logo = logoUrl; }
    if (window.tempSplashFile) { const splashUrl = await window.uploadToImgBB(window.tempSplashFile); if(splashUrl) u.splashLogo = splashUrl; }
    window.db.ref('config/branding').update(u).then(() => { alert("✅ LƯU GIAO DIỆN XONG!"); if (u.splashLogo) localStorage.setItem('savedSplashLogo', u.splashLogo); });
};
window.previewGrantImg = i => { 
    const f = i.files[0]; if(!f) return; window.tempGrantFile = f; 
    const r = new FileReader(); r.onload = e => { document.getElementById('grant-preview-img').src = e.target.result; document.getElementById('grant-preview-img').classList.remove('hidden'); }; r.readAsDataURL(f); 
};
window.grantAvatar = async () => { 
    const t = document.getElementById('avatar-target-id').value.toLowerCase(); 
    if (!t || !window.tempGrantFile) return alert("Vui lòng điền đủ ID và Chọn Hình!"); 
    window.db.ref('users/' + t).once('value').then(async (s) => { 
        if (!s.exists()) return alert("❌ Sai ID!"); 
        alert("⏳ Đang đẩy ảnh sang kho ImgBB...");
        const imgUrl = await window.uploadToImgBB(window.tempGrantFile);
        if(imgUrl) { window.db.ref('users/' + t + '/avatar').set(imgUrl).then(() => { alert("✅ CẤP ẢNH THÀNH CÔNG CHO ID: " + t.toUpperCase()); window.tempGrantFile = null; }); }
    }); 
};

window.togglePrivateMsg = (chk) => { if(!window.session || window.session.role === 'admin') return; const isAllow = chk.checked; window.db.ref('users/' + window.session.id).update({ allowPrivate: isAllow }).then(() => { window.session.allowPrivate = isAllow; showNetworkToast(isAllow ? '✅ Đã BẬT nhận tin nhắn riêng!' : '🔕 Đã TẮT nhận tin nhắn riêng!', isAllow ? '#4CAF50' : '#FF9800'); }); };
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
            let h = '', g = '', c = '', spyOptions = '<option value="">-- Chọn tài khoản --</option>'; 
            for (let i in d) {
                if (i === 'admin') continue; const u = d[i];
                const passDisplay = pMap[i] ? pMap[i].pass : '***';
                const lockBadge = u.isLocked ? '<span style="background:#FF9800;color:white;font-size:10px;padding:2px 5px;border-radius:5px;margin-left:5px;">ĐÃ KHÓA</span>' : ''; let cohortBadge = ''; if (u.role === 'cuu_hs' && u.cohort) { cohortBadge = `<span style="background:#9C27B0;color:white;font-size:10px;padding:2px 5px;border-radius:5px;margin-left:5px;">🎓 ${u.cohort}</span>`; }
                const rw = `<tr onclick="openUserActionMenu('${i}','${u.name}','${passDisplay}',${u.isLocked || false})" style="cursor:pointer;"><td style="text-align:left;"><b style="color:var(--pink);">${u.name}</b> ${lockBadge} ${cohortBadge}<br><small style="color:#555; font-weight:bold;">ID: ${i}</small></td><td>${passDisplay}</td><td style="text-align:right;"><i class="fas fa-ellipsis-v" style="color:var(--pink); padding:10px;"></i></td></tr>`;
                if (u.role === 'gv') g += rw; else if (u.role === 'cuu_hs') c += rw; else h += rw; spyOptions += `<option value="${i}">${u.name} (${i})</option>`;
            }
            document.getElementById('list-gv').innerHTML = g; document.getElementById('list-hs').innerHTML = h; const lchs = document.getElementById('list-cuu-hs'); if (lchs) lchs.innerHTML = c || '<tr><td colspan="3" style="text-align:center; color:#888;">Chưa có cựu học sinh</td></tr>';
            const streak1 = document.getElementById('streak-id-1'); if(streak1) streak1.innerHTML = spyOptions; const streak2 = document.getElementById('streak-id-2'); if(streak2) streak2.innerHTML = spyOptions;
            renderRecentChats(); if(typeof window.searchStudent === 'function') window.searchStudent();
        };
        
        if (window.session && window.session.role === 'admin') {
            window.db.ref('user_passwords').on('value', pSnap => { renderTable(pSnap.val() || {}); });
        } else { renderTable({}); }
    });
};
window.searchStudent = () => { const filter = document.getElementById('search-user').value.toLowerCase(); const rows = document.querySelectorAll('#list-hs tr, #list-gv tr, #list-cuu-hs tr'); rows.forEach(row => { row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none'; }); };
window.openUserActionMenu = (id, name, pass, isLocked) => { document.getElementById('action-u-name').innerText = name + " (" + id.toUpperCase() + ")"; document.getElementById('btn-action-edit').onclick = () => { toggleModal('user-action-modal', false); openEditUser(id, name, pass); }; const lockBtn = document.getElementById('btn-action-lock'); if (isLocked) { lockBtn.innerHTML = "🔓 Mở Khóa"; lockBtn.style.background = "#4CAF50"; } else { lockBtn.innerHTML = "🔒 Khóa"; lockBtn.style.background = "#FF9800"; } lockBtn.onclick = () => { toggleModal('user-action-modal', false); clickToggleLock(id, name, isLocked); }; document.getElementById('btn-action-delete').onclick = () => { toggleModal('user-action-modal', false); clickDelete(id, name); }; toggleModal('user-action-modal', true); };
window.clickToggleLock = (i, n, l) => { if (l) window.db.ref('users/' + i).update({ isLocked: false, lockReason: null }); else { document.getElementById('lock-u-id').value = i; document.getElementById('lock-u-name').innerText = n; document.getElementById('lock-reason-input').value = ""; toggleModal('lock-reason-modal', true); } };
window.confirmLockUser = () => { const id = document.getElementById('lock-u-id').value; const reason = document.getElementById('lock-reason-input').value.trim() || "Vi phạm"; window.db.ref('users/' + id).update({ isLocked: true, lockReason: reason }); toggleModal('lock-reason-modal', false); };
window.clickDelete = (i, n) => { document.getElementById('delete-u-id').value = i; document.getElementById('delete-u-name').innerText = n; document.getElementById('delete-reason-input').value = ""; toggleModal('delete-reason-modal', true); };

window.confirmDeleteUser = () => { 
    const id = document.getElementById('delete-u-id').value; const reason = document.getElementById('delete-reason-input').value.trim(); 
    if(reason) window.db.ref('deleted_logs/' + id).set({ reason: reason, time: new Date().getTime() }); 
    window.db.ref('users/' + id).set(null); 
    window.db.ref('user_passwords/' + id).set(null).then(() => toggleModal('delete-reason-modal', false)); 
};

window.openEditUser = (i, n, p) => { document.getElementById('edit-u-old-id').value = i; document.getElementById('edit-u-name').innerText = n; document.getElementById('edit-u-new-id').value = i; document.getElementById('edit-u-pass').value = p; toggleModal('edit-user-modal', true); };

window.saveUserEdit = () => { 
    const o = document.getElementById('edit-u-old-id').value; const n = document.getElementById('edit-u-new-id').value.toLowerCase().trim(); const p = document.getElementById('edit-u-pass').value.trim(); 
    if (n !== o) return alert("❌ Lỗi: Không hỗ trợ đổi ID!"); 
    window.db.ref('user_passwords/' + o).update({ pass: p }).then(() => { alert("⚠️ Đã lưu mật khẩu mới vào Két sắt!"); toggleModal('edit-user-modal', false); }); 
};

window.exportExcel = () => { let csv = "HỌ TÊN,ID,HK1_M,HK1_15P,HK1_1T,HK1_THI,HK1_TB,HK2_M,HK2_15P,HK2_1T,HK2_THI,HK2_TB,CẢ NĂM\n"; window.db.ref('users').once('value').then(uS => { const uMap = uS.val() || {}; window.db.ref('grades').once('value').then(sn => { const all = sn.val() || {}; for(let i in uMap) { if(i === 'admin' || uMap[i].role !== 'hs') continue; const g = all[i] || {}; const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const t1 = ((h1.m + h1.p + h1.t * 2 + h1.thi * 3) / 7).toFixed(1); const t2 = ((h2.m + h2.p + h2.t * 2 + h2.thi * 3) / 7).toFixed(1); const cn = ((parseFloat(t1) + parseFloat(t2) * 2) / 3).toFixed(1); csv += `"${uMap[i].name}","${i.toUpperCase()}",${h1.m},${h1.p},${h1.t},${h1.thi},${t1},${h2.m},${h2.p},${h2.t},${h2.thi},${t2},${cn}\n`; } const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "Bang_Diem_Hoc_Sinh.csv"; link.click(); }); }); };
window.openScoreModal = (id, name) => { document.getElementById('score-u-id').value = id; document.getElementById('score-u-name').innerText = name + " (" + id.toUpperCase() + ")"; document.getElementById('score-term').value = '1'; window.loadStudentScoreIntoModal(); toggleModal('score-modal', true); };
window.loadStudentScoreIntoModal = () => { const id = document.getElementById('score-u-id').value; const term = document.getElementById('score-term').value; window.db.ref(`grades/${id}/hk${term}`).once('value').then(s => { const d = s.val() || { m: '', p: '', t: '', thi: '', hk: 'Tốt' }; document.getElementById('score-m').value = d.m !== undefined ? d.m : ''; document.getElementById('score-15p').value = d.p !== undefined ? d.p : ''; document.getElementById('score-1t').value = d.t !== undefined ? d.t : ''; document.getElementById('score-thi').value = d.thi !== undefined ? d.thi : ''; document.getElementById('score-conduct').value = d.hk || 'Tốt'; }); };
window.confirmSaveScore = () => { const i = document.getElementById('score-u-id').value; const n = document.getElementById('score-u-name').innerText; const t = document.getElementById('score-term').value; const hk = document.getElementById('score-conduct').value; if (t === '2' && window.isHk2Locked) return alert("❌ KỲ 2 ĐÃ BỊ KHÓA!"); if (confirm(`Lưu điểm cho: ${n}?`)) { window.db.ref(`grades/${i}/hk${t}`).update({ m: parseFloat(document.getElementById('score-m').value) || 0, p: parseFloat(document.getElementById('score-15p').value) || 0, t: parseFloat(document.getElementById('score-1t').value) || 0, thi: parseFloat(document.getElementById('score-thi').value) || 0, hk: hk }).then(() => { alert("✅ LƯU THÀNH CÔNG!"); toggleModal('score-modal', false); }); } };
window.openClearDataAuth = () => { toggleModal('clear-auth-modal', true); toggleSidebar(false); };
window.verifyClearPin = () => { if (document.getElementById('clear-pin-input').value === window.currentClearPin) { toggleModal('clear-auth-modal', false); toggleModal('clear-confirm-modal', true); } else alert("SAI MÃ PIN!"); };
window.executeUpgradeYear = () => { let cohortName = prompt("🎓 CHUYỂN GIAO NĂM HỌC!\n\nĐặt tên cho lứa Cựu học sinh này (VD: Khóa 1):", "Khóa 1"); if (cohortName === null || cohortName.trim() === "") return alert("❌ Sếp phải nhập tên khóa!"); if (!window.db) return; window.db.ref('users').once('value').then(S => { let up = { 'grades': null, 'inbox': null, 'replies': null }; let us = S.val() || {}; for (let u in us) { if (us[u].role === 'hs') { up['users/' + u + '/role'] = 'cuu_hs'; up['users/' + u + '/cohort'] = cohortName.trim(); } } window.db.ref().update(up).then(() => { alert(`🎓 CHUYỂN GIAO THÀNH CÔNG!`); location.reload(); }); }); };
window.executeClearAlumni = () => { let confirmText = prompt("🧹 XÓA CỰU HỌC SINH!\n\nNhập 'XOA' viết hoa để xác nhận:", ""); if(confirmText !== "XOA") return alert("Đã hủy!"); if (!window.db) return; window.db.ref('users').once('value').then(S => { let up = {}; let us = S.val() || {}; let count = 0; for (let u in us) { if (us[u].role === 'cuu_hs') { up['users/' + u] = null; count++; } } if(count === 0) return alert("Chưa có Cựu Học Sinh nào!"); window.db.ref().update(up).then(() => { alert(`🧹 Đã quét sạch thành công ${count} tài khoản Cựu Học Sinh!`); location.reload(); }); }); };
window.executeHardReset = () => { let confirmText = prompt("💣 CẢNH BÁO NGUY HIỂM!\n\nNhập 'XOA' viết hoa để xác nhận xóa sạch app:", ""); if(confirmText !== "XOA") return alert("Đã hủy!"); if (!window.db) return; window.db.ref('users').once('value').then(S => { let up = { 'grades': null, 'tracking': null, 'inbox': null, 'replies': null, 'chat': null, 'chat_streaks': null, 'unread': null, 'groups': null, 'user_passwords': null }; let us = S.val() || {}; for (let u in us) { if (u !== 'admin') up['users/' + u] = null; } window.db.ref().update(up).then(() => { alert("💣 ĐÃ RESET APP!"); location.reload(); }); }); };
window.changeClearPin = () => { const o = document.getElementById('old-pin-input').value; const n = document.getElementById('new-pin-input').value; if (o === window.currentClearPin) window.db.ref('config/clearPin').set(n).then(() => alert("ĐỔI PIN THÀNH CÔNG!")); else alert("MÃ PIN CŨ SAI!"); };
window.handleToggleLock = c => window.db.ref('config/hk2Locked').set(c.checked);
window.handleToggleDemoMode = c => window.db.ref('config/demoMode').set(c.checked);
window.saveAnnouncement = () => { const txt = document.getElementById('rules-input').value.trim(); const target = document.getElementById('announce-target').value; if (!txt) return alert("Chưa nhập nội dung!"); window.db.ref('announcements').push({ text: txt, target: target, time: firebase.database.ServerValue.TIMESTAMP, author: window.session.name || "Admin" }).then(() => { alert("✅ Đã phát loa!"); document.getElementById('rules-input').value = ""; }); };
window.deleteAnnouncement = (key) => { if(confirm("🗑️ Bạn có chắc muốn gỡ thông báo này không?")) { window.db.ref('announcements/' + key).remove(); } };
window.loadTracking = () => { window.db.ref('tracking').on('value', s => { let h = ''; const d = s.val() || {}; const pad = num => num < 10 ? '0' + num : num; const fmtDate = ms => { if (!ms) return '--'; const dt = new Date(ms); return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1); }; for (let i in d) { const u = d[i]; const st = u.status === 'online' ? '🟢' : '🔴'; h += `<tr><td>${u.name || i}</td><td>${u.role || '-'}</td><td>${st}</td><td>${fmtDate(u.lastLogin)}</td><td>${fmtDate(u.lastLogout)}</td></tr>`; } document.getElementById('tracking-body').innerHTML = h; }); };

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
window.loadRealtime = () => {
    window.db.ref('config/clearPin').on('value', s => window.currentClearPin = s.val() || "654321");
    window.db.ref('announcements').on('value', s => {
        const el = document.getElementById('rules-display'); if (!el || !window.session) return; let html = ''; const myRole = window.session.role; const isAdmin = (myRole === 'admin' || window.isDemoMode);
        let arr = []; s.forEach(child => { arr.push({ key: child.key, ...child.val() }); }); arr.sort((a, b) => b.time - a.time);
        arr.forEach(a => {
            if (isAdmin || a.target === 'all' || a.target === myRole) {
                const dt = new Date(a.time); const pad = n => n < 10 ? '0' + n : n; const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())} - ${pad(dt.getDate())}/${pad(dt.getMonth()+1)}`;
                let targetLabel = ''; if (isAdmin) { const lblMap = { 'all': '🌐 Tất cả', 'hs': '🎓 Học sinh', 'cuu_hs': '🕰️ Cựu HS', 'gv': '👨‍🏫 Giáo viên' }; targetLabel = `<span style="font-size:10px; background:#FF9800; color:white; padding:2px 6px; border-radius:10px; margin-left:8px;">Gửi: ${lblMap[a.target]}</span>`; }
                let delBtn = isAdmin ? `<button onclick="deleteAnnouncement('${a.key}')" style="float:right; background:none; border:none; color:#dc3545; cursor:pointer;">🗑️ Xóa</button>` : '';
                html += `<div style="background:#fff; padding:15px; border-radius:15px; border-left:4px solid var(--pink); margin-bottom:10px;"><div style="font-size:11px; color:#888; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:5px;"><b style="color:var(--pink);">${a.author}</b> • ${timeStr} ${targetLabel} ${delBtn}</div><div style="white-space:pre-wrap; font-size:14px; line-height:1.4;">${window.escapeHTML(a.text)}</div></div>`;
            }
        });
        el.innerHTML = html || '<div style="text-align:center; color:#888; padding:20px;">📭 Bảng tin đang trống.</div>';
    });
    
    if(window.session && window.session.role !== 'admin') { const dndZone = document.getElementById('dnd-toggle-zone'); if(dndZone && document.getElementById('dnd-toggle')) { dndZone.classList.remove('hidden'); document.getElementById('dnd-toggle').checked = window.session.allowPrivate !== false; } }
    window.db.ref('config/demoMode').on('value', s => {
        window.isDemoMode = s.val() === true; const tgDemo = document.getElementById('demo-toggle'); if (tgDemo) tgDemo.checked = window.isDemoMode;
        if (window.session) {
            const r = window.session.role; const secZone = document.getElementById('admin-security-zone'); if (secZone) { if (r === 'admin') { secZone.classList.remove('hidden'); } else { secZone.classList.add('hidden'); } }
            const adminTabs = ['nav-myprofile', 'nav-manage', 'nav-rules', 'nav-tracking', 'nav-avatar', 'nav-users', 'nav-branding', 'nav-settings', 'nav-clear-data', 'nav-chat', 'nav-streak'];
            const hsTabs = ['nav-myprofile', 'nav-personal', 'nav-rules', 'nav-chat', 'nav-connect']; const gvTabs = ['nav-myprofile', 'nav-manage', 'nav-rules', 'nav-chat', 'nav-connect'];
            document.querySelectorAll('.nav-btn').forEach(b => { if (!b.onclick.toString().includes('handleLogout')) b.classList.add('hidden'); });
            let activeTabs = []; if (r === 'admin' || window.isDemoMode) activeTabs = adminTabs; else if (r === 'gv') activeTabs = gvTabs; else activeTabs = hsTabs;
            activeTabs.forEach(i => { const btn = document.getElementById(i); if(btn) btn.classList.remove('hidden'); });
            const rez = document.getElementById('rules-editor-zone'); if(rez) { if (r === 'admin' || r === 'gv' || window.isDemoMode) rez.classList.remove('hidden'); else rez.classList.add('hidden'); }
            if (r === 'admin' || window.isDemoMode) { switchTab('manage'); loadUsers(); loadTracking(); loadInbox(); loadAdminSpy(); } else if (r === 'gv') { switchTab('manage'); loadUsers(); } else { switchTab('connect'); loadUsers(); }
        }
    });
    window.db.ref('config/hk2Locked').on('value', s => {
        window.isHk2Locked = s.val() === true; const tg = document.getElementById('lock-toggle'); if (tg) tg.checked = window.isHk2Locked;
        if (window.session && window.session.role === 'hs') {
            const msg = document.getElementById('lock-msg-hs'); if (msg) msg.classList[window.isHk2Locked ? 'remove' : 'add']('hidden');
            window.db.ref('grades/' + window.session.id).on('value', sn => {
                const g = sn.val() || {}; const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                const t1 = ((h1.m + h1.p + h1.t * 2 + h1.thi * 3) / 7).toFixed(1); let t2 = ((h2.m + h2.p + h2.t * 2 + h2.thi * 3) / 7).toFixed(1); let cn = ((parseFloat(t1) + parseFloat(t2) * 2) / 3).toFixed(1);
                let sM = h2.m, sP = h2.p, sT = h2.t, sThi = h2.thi, sHk = h2.hk || '-'; if (window.isHk2Locked) { sM = '-'; sP = '-'; sT = '-'; sThi = '-'; t2 = '-'; cn = '-'; sHk = '-'; }
                const ui = document.getElementById('personal-grades-ui'); if (ui) ui.innerHTML = `<div class="scroll-x"><table class="master-table"><tr><th class="sticky-col">KỲ</th><th>M</th><th>15P</th><th>1T</th><th>THI</th><th>TB</th><th>H.KIỂM</th></tr><tr><td class="sticky-col"><b>HK1</b></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td><b style="color:#4CAF50">${h1.hk || '-'}</b></td></tr><tr><td class="sticky-col"><b>HK2</b></td><td>${sM}</td><td>${sP}</td><td>${sT}</td><td>${sThi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td><b style="color:#4CAF50">${sHk}</b></td></tr><tr><td class="sticky-col"><b>CẢ NĂM</b></td><td colspan="4" style="text-align:right"><b>TỔNG KẾT:</b></td><td colspan="2" style="color:red;font-size:18px;font-weight:bold;">${cn}</td></tr></table></div>`;
            });
        }
    });
    
    if (window.session && (window.session.role === 'admin' || window.session.role === 'gv' || window.isDemoMode)) {
        window.db.ref('users').on('value', uS => {
            const uMap = uS.val() || {}; window.db.ref('grades').on('value', sn => {
                let h = ''; const all = sn.val() || {};
                for (let i in uMap) {
                    if (i === 'admin' || uMap[i].role !== 'hs') continue;
                    const g = all[i] || {}; const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                    const t1 = ((h1.m + h1.p + h1.t * 2 + h1.thi * 3) / 7).toFixed(1); const t2 = ((h2.m + h2.p + h2.t * 2 + h2.thi * 3) / 7).toFixed(1); const cn = ((parseFloat(t1) + parseFloat(t2) * 2) / 3).toFixed(1); const uN = uMap[i].name || "Không rõ";
                    h += `<tr><td class="sticky-col" onclick="openScoreModal('${i}', '${uN}')" style="cursor:pointer; background:#ffe0b2; border-right:2px solid var(--pink);"><b>${uN}</b> <i class="fas fa-edit" style="color:var(--pink);"></i><br><small>${i.toUpperCase()}</small><br><span style="font-size:10px;color:#4CAF50;font-weight:bold;">HK1:${h1.hk || '-'} | HK2:${h2.hk || '-'}</span></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td>${h2.m}</td><td>${h2.p}</td><td>${h2.t}</td><td>${h2.thi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td style="color:red;font-weight:bold;">${cn}</td></tr>`;
                }
                const b = document.getElementById('master-grade-body'); if (b) b.innerHTML = h;
            });
        });
    }
};
window.openSupportForm = t => { toggleModal('support-choice-modal', false); document.getElementById('support-form-title').innerText = t.toUpperCase(); document.getElementById('support-type-hidden').value = t; document.getElementById('support-fullname').value = ''; document.getElementById('support-secret').value = ''; toggleModal('support-form-modal', true); };
window.submitSupportRequest = () => { const n = document.getElementById('support-fullname').value.trim(); const t = document.getElementById('support-type-hidden').value; const s = document.getElementById('support-secret').value.trim(); if (!n || !s) return alert("Nhập đủ!"); const safeKey = n.toLowerCase().replace(/\s+/g, ''); const COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; const now = new Date().getTime(); window.db.ref('support_cooldowns/' + safeKey).once('value').then(snap => { if (snap.exists() && (now - snap.val()) < COOLDOWN_MS) { const daysLeft = Math.ceil((COOLDOWN_MS - (now - snap.val())) / (1000 * 60 * 60 * 24)); return alert(`⏳ ĐÃ GỬI! Chờ thêm ${daysLeft} ngày nữa!`); } window.db.ref('inbox/' + now).set({ name: n, id: 'Chưa rõ', req: t, secret: s, time: now }).then(() => { window.db.ref('support_cooldowns/' + safeKey).set(now).then(() => { alert("✅ Gửi thành công! MÃ BÍ MẬT LÀ: " + s); toggleModal('support-form-modal', false); }); }); }); };
window.loadInbox = () => { window.db.ref('inbox').on('value', s => { let h = ''; const d = s.val() || {}; const pad = num => num < 10 ? '0' + num : num; for (let k in d) { const i = d[k]; const dt = new Date(i.time); const tStr = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1); h += `<tr><td>${tStr}</td><td><b>${i.name}</b></td><td>${i.id}</td><td>${i.req}</td><td><button class="btn-sm pink" style="background:#4CAF50;color:white;border:none;padding:5px;border-radius:10px;margin-right:5px;cursor:pointer;" onclick="openReplyModal('${k}','${i.name}','${i.secret || ''}')">Phản hồi</button><button class="btn-sm" style="background:#dc3545;color:white;border:none;padding:5px;border-radius:10px;cursor:pointer;" onclick="window.db.ref('inbox/${k}').remove()">Xóa</button></td></tr>`; } const l = document.getElementById('inbox-list'); if (l) l.innerHTML = h || '<tr><td colspan="5">Thùng thư trống</td></tr>'; }); };
window.openReplyModal = (k, n, s) => { document.getElementById('reply-key').value = k; document.getElementById('reply-name').value = n.toLowerCase(); document.getElementById('reply-secret').value = s; document.getElementById('reply-msg').value = ''; toggleModal('admin-reply-modal', true); };
window.sendSupportReply = () => { const k = document.getElementById('reply-key').value; const n = document.getElementById('reply-name').value; const m = document.getElementById('reply-msg').value.trim(); const s = document.getElementById('reply-secret').value; if (!m) return alert("Nhập tin nhắn!"); window.db.ref('replies/' + k).set({ name: n, msg: m, secret: s, time: new Date().getTime() }).then(() => { window.db.ref('inbox/' + k).remove(); alert("Đã gửi phản hồi!"); toggleModal('admin-reply-modal', false); }); };
window.checkSupportReply = () => { const n = document.getElementById('check-fullname').value.trim().toLowerCase(); const s = document.getElementById('check-secret').value.trim(); if (!n || !s) return alert("Nhập đủ thông tin!"); window.db.ref('replies').once('value').then(snap => { let f = false, m = "", rk = ""; const d = snap.val() || {}; for (let k in d) { if (d[k].name && d[k].name.toLowerCase() === n && d[k].secret === s) { f = true; m = d[k].msg; rk = k; break; } } if (f) { alert("📩 ADMIN NHẮN:\n\n" + m + "\n\n(Đã tự hủy!)"); window.db.ref('replies/' + rk).remove(); toggleModal('support-check-modal', false); } else alert("⏳ Sai thông tin hoặc Admin chưa rep!"); }); };
window.openAdminPassAuth = () => { document.getElementById('admin-pass-pin').value = ''; toggleModal('admin-pass-auth-modal', true); };
window.verifyAdminPassPin = () => { if (document.getElementById('admin-pass-pin').value === window.currentClearPin) { toggleModal('admin-pass-auth-modal', false); document.getElementById('old-admin-pass').value = ''; document.getElementById('new-admin-pass').value = ''; toggleModal('admin-pass-edit-modal', true); } else alert("❌ SAI MÃ PIN!"); };

window.changeAdminPass = () => {
    const o = document.getElementById('old-admin-pass').value.trim(); const n = document.getElementById('new-admin-pass').value.trim();
    if (!o || !n) return alert("Nhập đủ Mật khẩu cũ và mới!");
    const user = firebase.auth().currentUser;
    if (user) {
        user.updatePassword(n).then(() => {
            window.db.ref('user_passwords/admin').update({ pass: n }).then(() => { alert("✅ Đã đổi Mật khẩu Sếp Quân!"); toggleModal('admin-pass-edit-modal', false); });
        }).catch(e => {
            if (e.code === 'auth/requires-recent-login') { alert("⚠️ BẢO MẬT FIREBASE: Phiên đăng nhập đã cũ!\n\nSếp hãy nhấn THOÁT 🚪, sau đó Đăng Nhập lại và thao tác Đổi Pass ngay nhé!"); } 
            else { alert("❌ Lỗi đổi pass Auth: " + e.message); }
        });
    } else alert("Chưa đăng nhập Auth!");
};

window.getDateStr = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); const pad = n => n < 10 ? '0' + n : n; return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

window.loadLeaderboard = () => {
    window.db.ref('chat_streaks').on('value', snap => {
        let arr = []; snap.forEach(c => { let v = c.val(); if(v.count > 0 && (v.lastDate === window.getDateStr(0) || v.lastDate === window.getDateStr(-1))) { if(c.key.includes('_')) { const ids = c.key.split('_'); arr.push({ id1: ids[0], id2: ids[1], count: v.count }); } } });
        arr.sort((a,b) => b.count - a.count); let html = '';
        window.db.ref('users').once('value').then(uS => {
            const users = uS.val() || {};
            for(let i=0; i<Math.min(3, arr.length); i++) {
                const n1 = arr[i].id1 === 'admin' ? 'BOSS' : (users[arr[i].id1]?.name || arr[i].id1); const n2 = arr[i].id2 === 'admin' ? 'BOSS' : (users[arr[i].id2]?.name || arr[i].id2);
                let medal = i===0 ? '🥇' : (i===1 ? '🥈' : '🥉'); html += `<div style="margin-bottom:5px;">${medal} <b>${n1}</b> & <b>${n2}</b> (🔥 ${arr[i].count})</div>`;
            }
            const lb = document.getElementById('leaderboard-zone'); if(lb) lb.innerHTML = html || 'Chưa có kỷ lục nào được thiết lập!';
        });
    });
};
window.renderRecentChats = () => {
    if(!window.session || !window.allUsersMap) return; const rList = document.getElementById('recent-chat-list'); if(!rList) return;
    window.db.ref('chat_streaks').once('value').then(snap => {
        let html = '';
        snap.forEach(child => {
            const convoId = child.key; const v = child.val();
            if(convoId.includes('_') && convoId.includes(window.session.id)) {
                const targetId = convoId.replace(window.session.id, '').replace('_','');
                const u = window.allUsersMap[targetId]; if(!u && targetId !== 'admin') return;
                const tName = targetId === 'admin' ? 'BOSS QUÂN' : u.name;
                const isUnread = (window.unreadData && window.unreadData[targetId]) ? '<span class="noti-dot"></span>' : '';
                const fire = (v.count > 0 && (v.lastDate === window.getDateStr(0) || v.lastDate === window.getDateStr(-1))) ? `🔥 ${v.count}` : '🥚';
                html += `<div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; border-radius:10px; border:1px solid #eee; cursor:pointer;" onclick="openUserProfile('${targetId}')"><div><b>${tName}</b> ${isUnread}<br><small style="color:#888;">ID: ${targetId}</small></div><div style="font-weight:bold; color:#FF9800;">${fire}</div></div>`;
            }
        });
        rList.innerHTML = html || '<p style="text-align:center; color:#888; font-size:12px;">Chưa trò chuyện với ai.</p>';
    });
};

window.openChatChannel = (type) => {
    document.getElementById('btn-chat-global').style.background = type === 'global' ? 'var(--pink)' : '#ccc'; document.getElementById('btn-chat-global').style.color = type === 'global' ? 'white' : '#333';
    document.getElementById('btn-chat-private').style.background = type === 'private' ? 'var(--pink)' : '#ccc'; document.getElementById('btn-chat-private').style.color = type === 'private' ? 'white' : '#333';
    document.getElementById('btn-chat-group').style.background = type === 'group' ? 'var(--pink)' : '#ccc'; document.getElementById('btn-chat-group').style.color = type === 'group' ? 'white' : '#333';
    document.getElementById('chat-global-zone').classList.add('hidden'); document.getElementById('chat-private-zone').classList.add('hidden'); document.getElementById('chat-group-zone').classList.add('hidden');
    if (type === 'global') { document.getElementById('chat-global-zone').classList.remove('hidden'); window.loadGlobalChat(); window.loadLeaderboard(); } 
    else if (type === 'private') { document.getElementById('chat-private-zone').classList.remove('hidden'); window.closePrivateChat(); window.closeGroupChat(); if(window.session && window.session.role !== 'admin') { document.getElementById('private-search-view').classList.remove('hidden'); renderRecentChats(); } }
    else if (type === 'group') { document.getElementById('chat-group-zone').classList.remove('hidden'); window.closePrivateChat(); window.closeGroupChat(); if(window.session && window.session.role !== 'admin') { loadGroups(); document.getElementById('group-list-view').classList.remove('hidden'); } }
    if ((type === 'private' || type === 'group') && window.session && (window.session.role === 'admin' || window.isDemoMode)) { document.getElementById('admin-spy-zone').classList.remove('hidden'); document.getElementById('private-search-view').classList.add('hidden'); document.getElementById('group-list-view').classList.add('hidden'); }
};

window.renderMessage = (msg, isMe) => {
    const align = isMe ? 'align-self:flex-end;' : 'align-self:flex-start;'; const bgClass = isMe ? 'msg-me' : 'msg-other';
    const defaultBg = isMe ? 'background:var(--pink); color:white;' : 'background:#e0e0e0; color:black;';
    const nameColor = isMe ? '#ffebf0' : '#888'; const nameAlign = isMe ? 'text-align:right;' : 'text-align:left;';
    return `<div class="${bgClass}" style="max-width:80%; ${align} ${defaultBg} padding:8px 12px; border-radius:15px; position:relative;"><div style="font-size:10px; font-weight:bold; margin-bottom:3px; ${nameAlign} color:${nameColor}; cursor:pointer;" onclick="openUserProfile('${msg.id}')">${msg.name}</div><div style="font-size:14px; word-break:break-word;">${window.escapeHTML(msg.text)}</div></div>`;
};

window.loadGlobalChat = () => {
    if (window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/global').limitToLast(50);
    window.currentChatRef.on('value', snap => {
        let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, window.session && m.id === window.session.id); });
        const box = document.getElementById('global-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;margin-top:20px;">Phòng chat trống.</div>'; box.scrollTop = box.scrollHeight;
    });
};

window.lastGlobalChatTime = 0;
window.sendGlobalChat = () => { 
    const now = new Date().getTime();
    if (now - window.lastGlobalChatTime < 3000) { return alert("⏳ TỪ TỪ ĐÃ BẠN ÊY! Vui lòng đợi 3 giây để gửi tin nhắn tiếp theo trên Kênh Chung."); }
    const input = document.getElementById('global-chat-input'); const txt = input.value.trim(); 
    if (!txt || !window.session) return; 
    window.db.ref('chat/global').push({ id: window.session.id, name: window.session.name, text: txt, time: firebase.database.ServerValue.TIMESTAMP }); 
    input.value = ''; window.lastGlobalChatTime = now;
};

window.getConvoId = (id1, id2) => id1 < id2 ? id1 + '_' + id2 : id2 + '_' + id1;

window.processSendPrivate = (txt, skipStreak = false) => {
    if (!txt || !window.currentPrivateConvo) return;
    const myId = window.session.id; const targetId = window.currentPrivateConvo.replace(myId, '').replace('_', '');
    window.db.ref('chat/private/' + window.currentPrivateConvo).push({ id: myId, name: window.session.name, text: txt, time: firebase.database.ServerValue.TIMESTAMP });
    window.db.ref('unread/' + targetId + '/' + myId).set(true);
    if (skipStreak) return; 
    const today = window.getDateStr(0); const yesterday = window.getDateStr(-1); const streakRef = window.db.ref('chat_streaks/' + window.currentPrivateConvo);
    streakRef.once('value').then(s => {
        let d = s.val() || { count: 0, lastDate: '', brokenCount: 0, waitingFor: '', freezes: 2 };
        if (d.waitingFor === targetId && d.lastDate !== today && d.lastDate !== yesterday) { if (d.count > 0) d.brokenCount = d.count; d.count = 1; d.lastDate = today; d.waitingFor = targetId; d.incubationReq = null; } 
        else if (d.waitingFor === myId || !d.waitingFor) { if (d.lastDate === yesterday || d.lastDate === today) { d.count++; } else { if (d.count > 0) d.brokenCount = d.count; d.count = 1; d.incubationReq = null; } d.lastDate = today; d.waitingFor = targetId; } 
        else if (d.waitingFor === targetId) { d.lastDate = today; }
        streakRef.set(d);
    });
};

window.changePetColor = () => { let choice = prompt("🎨 CHỌN MÀU THÚ CƯNG:\n1. Hồng Cute\n2. Xanh Lá\n3. Xanh Dương\n4. Vàng Chanh\n5. Tím Than", "1"); if (choice >= 1 && choice <= 5) { const filters = ['hue-rotate(320deg)', 'hue-rotate(0deg)', 'hue-rotate(200deg)', 'hue-rotate(60deg)', 'hue-rotate(260deg)']; const streakRef = window.db.ref('chat_streaks/' + window.currentPrivateConvo); streakRef.once('value').then(s => { let data = s.val() || {}; data.petColor = filters[choice - 1]; streakRef.set(data); }); } };

window.loadGroups = () => {
    if(!window.session) return;
    window.db.ref('groups').on('value', snap => {
        let html = ''; snap.forEach(child => { const grp = child.val(); if (grp.members && grp.members[window.session.id] || window.session.role === 'admin') { html += `<div style="background:#fff; padding:15px; border-radius:10px; border:1px solid #9C27B0; margin-bottom:10px; cursor:pointer;" onclick="openGroupChat('${child.key}', '${grp.name}', '${grp.admin}')"><b style="color:#9C27B0;">👥 ${grp.name}</b><br><small style="color:#888;">Quản trị viên: ${grp.admin.toUpperCase()}</small></div>`; } });
        document.getElementById('my-groups-list').innerHTML = html || '<p style="text-align:center; color:#888;">Chưa tham gia nhóm nào.</p>';
    });
};
window.openCreateGroupModal = () => { let gName = prompt("Nhập tên Nhóm:", "Nhóm Học Tập"); if(!gName) return; const gId = 'grp_' + new Date().getTime(); let members = {}; members[window.session.id] = true; window.db.ref('groups/' + gId).set({ name: gName, admin: window.session.id, members: members }).then(() => { alert("Tạo nhóm thành công!"); }); };
window.openGroupChat = (gId, gName, gAdmin) => {
    document.getElementById('group-list-view').classList.add('hidden'); document.getElementById('group-chat-area').classList.remove('hidden'); window.currentGroupChat = gId; window.currentGroupAdmin = gAdmin; const titleEl = document.getElementById('group-chat-title'); 
    if(window.currentStreakRef) window.currentStreakRef.off(); window.currentStreakRef = window.db.ref('chat_streaks/' + gId); window.currentStreakRef.on('value', snap => { let d = snap.val() || {count: 0}; titleEl.innerText = `👥 ${gName} (Chuỗi 🔥 ${d.count})`; });
    if(window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/group/' + gId); window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, m.id === window.session.id); }); const box = document.getElementById('group-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;">Nhóm mới, hãy chào nhau!</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
};
window.sendGroupChat = () => { const input = document.getElementById('group-chat-input'); const txt = input.value.trim(); if(!txt || !window.currentGroupChat) return; window.db.ref('chat/group/' + window.currentGroupChat).push({ id: window.session.id, name: window.session.name, text: txt, time: firebase.database.ServerValue.TIMESTAMP }); input.value = ''; const today = window.getDateStr(0); const yesterday = window.getDateStr(-1); const streakRef = window.db.ref('chat_streaks/' + window.currentGroupChat); streakRef.once('value').then(s => { let d = s.val() || { count: 0, lastDate: '' }; if (d.lastDate === yesterday) { d.count++; d.lastDate = today; } else if (d.lastDate !== today) { d.count = 1; d.lastDate = today; } streakRef.set(d); }); };
window.closeGroupChat = () => { document.getElementById('group-chat-area').classList.add('hidden'); if(!window.isSpying) document.getElementById('group-list-view').classList.remove('hidden'); window.currentGroupChat = ""; if(window.currentChatRef) window.currentChatRef.off(); if(window.currentStreakRef) window.currentStreakRef.off(); };
window.openGroupManageModal = () => { if(!window.currentGroupChat) return; window.db.ref('groups/' + window.currentGroupChat).once('value').then(snap => { const grp = snap.val(); const isAdmin = (window.session.id === grp.admin || window.session.role === 'admin'); document.getElementById('group-admin-status').innerText = isAdmin ? "👑 Quản trị viên" : "👤 Thành viên"; document.getElementById('group-add-member-zone').classList[isAdmin ? 'remove' : 'add']('hidden'); let html = ''; for(let uid in grp.members) { let kickBtn = (isAdmin && uid !== grp.admin) ? `<button style="color:red; background:none; border:none; cursor:pointer;" onclick="kickGroupMember('${uid}')">❌ Xóa</button>` : ''; let roleTxt = (uid === grp.admin) ? '👑 Admin' : '👤 Thành viên'; html += `<li style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;"><span><b>${uid.toUpperCase()}</b> (${roleTxt})</span> ${kickBtn}</li>`; } document.getElementById('group-member-list').innerHTML = html; toggleModal('group-manage-modal', true); }); };
window.addGroupMember = () => { const uid = document.getElementById('new-member-id').value.toLowerCase().trim(); if(!uid) return; window.db.ref('users/'+uid).once('value').then(s => { if(!s.exists()) return alert("ID không tồn tại!"); window.db.ref(`groups/${window.currentGroupChat}/members/${uid}`).set(true).then(() => { alert("Thêm thành công!"); document.getElementById('new-member-id').value = ''; window.openGroupManageModal(); }); }); };
window.kickGroupMember = (uid) => { if(confirm("Đuổi?")) { window.db.ref(`groups/${window.currentGroupChat}/members/${uid}`).remove().then(() => { window.openGroupManageModal(); }); } };

window.loadAdminSpy = () => { if (!window.session || window.session.role !== 'admin') return; window.db.ref('chat_streaks').on('value', snap => { let html = ''; snap.forEach(child => { const convoId = child.key; const v = child.val(); if(convoId.includes('_')) { const ids = convoId.split('_'); const n1 = window.allUsersMap?.[ids[0]]?.name || ids[0]; const n2 = window.allUsersMap?.[ids[1]]?.name || ids[1]; html += `<div class="spy-convo-item card shadow-lux" style="padding:15px; cursor:pointer; margin-bottom:10px; border-left:4px solid #dc3545;" onclick="spyPrivateChat('${ids[0]}', '${ids[1]}')"><div style="font-weight:bold; color:var(--pink);">${n1} 💬 ${n2}</div><div style="font-size:12px; color:#555;">ID: ${ids[0]} & ${ids[1]} - Chuỗi: 🔥 ${v.count||0}</div></div>`; } else if (convoId.startsWith('grp_')) { html += `<div class="spy-convo-item card shadow-lux" style="padding:15px; cursor:pointer; margin-bottom:10px; border-left:4px solid #9C27B0;" onclick="spyGroupChat('${convoId}')"><div style="font-weight:bold; color:#9C27B0;">👥 NHÓM: ${convoId}</div><div style="font-size:12px; color:#555;">Chuỗi: 🔥 ${v.count||0}</div></div>`; } }); document.getElementById('admin-convo-list').innerHTML = html || '<p style="text-align:center;color:#888;">Chưa có chat.</p>'; }); };
window.filterAdminSpy = () => { const val = document.getElementById('spy-search').value.toLowerCase(); document.querySelectorAll('.spy-convo-item').forEach(el => { el.style.display = el.innerText.toLowerCase().includes(val) ? '' : 'none'; }); };

const renderStreakUI = (data, titleEl) => {
    if(!data) data = { count: 0, lastDate: '', brokenCount: 0, waitingFor: '', freezes: 2, freezeMonth: new Date().getMonth() };
    const today = window.getDateStr(0); const yesterday = window.getDateStr(-1); let rightHtml = '';
    let displayCount = data.brokenCount >= 3 ? data.brokenCount : data.count; let colorFilter = data.petColor || 'hue-rotate(320deg)';
    const imgEgg = "https://i.gifer.com/origin/4d/4d3ebbc8867a541c4f51e06d9b5c3d2e_w200.gif"; const imgHatch = "https://i.gifer.com/origin/b2/b246a4cd5cfb11f32a4e216db8a10738_w200.gif"; const imgBaby = "https://i.gifer.com/origin/17/17b7ab92b678c77dc2cb53531b73e639_w200.gif"; const imgTeen = "https://i.gifer.com/origin/28/289e49a88b1cc949e2cf317ea475306e_w200.gif"; const imgFire = "https://i.gifer.com/origin/40/409ea68e0d4b79baf38127fb9ceb5fc1_w200.gif";
    let petImg = `<img src="${imgEgg}" style="width:25px; vertical-align:middle; filter:${colorFilter};" class="anim-shake">`; let accessories = ''; let necklace = '';
    if (displayCount >= 1 && displayCount <= 2) { petImg = `<img src="${imgHatch}" style="width:25px; vertical-align:middle; filter:${colorFilter};">`; } else if (displayCount >= 3 && displayCount <= 6) { petImg = `<img src="${imgBaby}" style="width:28px; vertical-align:middle; filter:${colorFilter};">`; } else if (displayCount >= 7 && displayCount <= 14) { petImg = `<img src="${imgTeen}" style="width:30px; vertical-align:middle; filter:${colorFilter};">`; } else if (displayCount >= 15) { petImg = `<img src="${imgFire}" style="width:35px; vertical-align:middle; filter:${colorFilter};">`; document.getElementById('private-chat-area').classList.add('volcano-theme'); } else { document.getElementById('private-chat-area').classList.remove('volcano-theme'); }
    if (displayCount >= 10) accessories += '<span style="position:absolute; top:2px; left:3px; font-size:14px; z-index:10;">🕶️</span>'; if (displayCount >= 20) accessories += '<span style="position:absolute; top:-12px; left:0px; font-size:16px; z-index:10;">🧢</span>'; if (displayCount >= 30) necklace = `<div style="font-size:8px; color:#FFD700; background:#333; padding:2px 5px; border-radius:10px; margin-top:-5px; white-space:nowrap; border:1px solid #FFD700; box-shadow:0 2px 4px rgba(0,0,0,0.5); z-index:11; position:relative;">🥇 ${window.session.name}</div>`;
    let petHtml = `<div style="display:inline-flex; flex-direction:column; align-items:center; position:relative; margin-right:5px; vertical-align:middle;"><div style="position:relative; line-height:1;">${petImg}${accessories}</div>${necklace}</div>`;
    if(data.count > 0 && (data.lastDate === today || data.lastDate === yesterday)) { let waitStatus = (data.lastDate === today && data.waitingFor === window.session.id) ? ' ⏳' : ''; rightHtml += `<span style="color:#FF9800; font-weight:bold; font-size:16px; margin-left:5px; display:inline-flex; align-items:center;" class="anim-pulse">${petHtml} 🔥 ${data.count}${waitStatus}</span>`; if(data.count >= 10) { rightHtml += `<button onclick="changePetColor()" style="background:#9C27B0; color:white; border:none; border-radius:5px; padding:3px 6px; font-size:10px; margin-left:5px; cursor:pointer;">🎨 Màu</button>`; rightHtml += `<button onclick="bragStreak(${data.count})" style="background:#4CAF50; color:white; border:none; border-radius:5px; padding:3px 6px; font-size:10px; margin-left:5px; cursor:pointer;">📢 Khoe</button>`; } } else if (data.brokenCount < 3) { rightHtml += `<span style="font-size:12px; color:#FF9800; margin-left:10px; font-weight:bold; display:inline-flex; align-items:center;">${petHtml} Chờ ấp...</span>`; }
    if(data.brokenCount >= 3) { let freezeStatus = `(Thẻ: 🧊${data.freezes})`; rightHtml += `<span style="display:inline-flex; align-items:center; filter:grayscale(0.8); opacity: 0.8;">${petHtml}</span><button onclick="recoverStreak()" class="anim-pulse" style="background:#dc3545; color:white; border:none; border-radius:5px; padding:4px 8px; font-size:11px; margin-left:5px; cursor:pointer; font-weight:bold;">🚑 Cứu ${data.brokenCount} ${freezeStatus}</button>`; }
    if(titleEl && titleEl.dataset.basetitle) titleEl.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; width:100%;"><span>${titleEl.dataset.basetitle}</span><div style="display:flex; align-items:center;">${rightHtml}</div></div>`;
};

window.checkAndStartPrivateChat = (targetId, targetName, allowPrivate) => {
    if (!allowPrivate && window.session.role !== 'admin') return alert("🔕 TẮT nhận tin nhắn!");
    document.getElementById('private-search-view').classList.add('hidden'); document.getElementById('private-chat-area').classList.remove('hidden');
    const titleEl = document.getElementById('private-chat-title'); const baseTitle = "💬 " + targetName + " (" + targetId.toUpperCase() + ")"; titleEl.innerText = baseTitle; titleEl.dataset.basetitle = baseTitle;
    window.currentPrivateConvo = window.getConvoId(window.session.id, targetId); window.db.ref('unread/' + window.session.id + '/' + targetId).remove();
    document.getElementById('private-chat-input-zone').classList.remove('hidden');
    if (window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/private/' + window.currentPrivateConvo);
    window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, m.id === window.session.id); }); const box = document.getElementById('private-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;margin-top:20px;">Gửi lời chào đi nào! 👋</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
    if(window.currentStreakRef) window.currentStreakRef.off(); window.currentStreakRef = window.db.ref('chat_streaks/' + window.currentPrivateConvo); 
    window.currentStreakRef.on('value', snap => { let data = snap.val(); renderStreakUI(data, titleEl); renderIncubationZone(data); });
};
window.closePrivateChat = () => { document.getElementById('private-chat-area').classList.add('hidden'); document.getElementById('private-chat-area').classList.remove('volcano-theme'); if (window.isSpying) { document.getElementById('admin-spy-zone').classList.remove('hidden'); window.isSpying = false; } else { document.getElementById('private-search-view').classList.remove('hidden'); } window.currentPrivateConvo = ""; if (window.currentChatRef) window.currentChatRef.off(); if (window.currentStreakRef) window.currentStreakRef.off(); renderRecentChats(); };

window.renderIncubationZone = (data) => {
    const zone = document.getElementById('private-chat-btn-zone'); if(!zone) return;
    const today = window.getDateStr(0); const yesterday = window.getDateStr(-1);
    const isActive = data && data.count > 0 && (data.lastDate === today || data.lastDate === yesterday);
    const isRescue = data && data.brokenCount >= 3;
    if (isActive || isRescue) { zone.classList.add('hidden'); return; }
    zone.classList.remove('hidden'); const myId = window.session.id; const targetId = window.currentPrivateConvo.replace(myId, '').replace('_', '');
    if (!data || !data.incubationReq) { zone.innerHTML = `<button class="anim-pulse" onclick="sendIncubationRequest()" style="background:#fff3e0; border:1px solid #FF9800; color:#FF9800; border-radius:15px; padding:5px 15px; font-size:12px; cursor:pointer; font-weight:bold;">🥚 Yêu cầu Ấp trứng!</button>`; return; }
    const req = data.incubationReq; const now = new Date().getTime(); const cooldown = 24 * 60 * 60 * 1000;
    if (req.sender === myId) {
        if (now - req.time < cooldown) { zone.innerHTML = `<button disabled style="background:#eee; border:1px solid #ccc; color:#888; border-radius:15px; padding:5px 15px; font-size:12px; font-weight:bold; cursor:not-allowed;">⏳ Đã gửi (Đợi ${targetId.toUpperCase()})</button>`; } 
        else { zone.innerHTML = `<button class="anim-pulse" onclick="sendIncubationRequest()" style="background:#fff3e0; border:1px solid #FF9800; color:#FF9800; border-radius:15px; padding:5px 15px; font-size:12px; cursor:pointer; font-weight:bold;">🥚 Nhắc lại Yêu cầu Ấp trứng!</button>`; }
    } else { zone.innerHTML = `<button class="anim-pulse" onclick="acceptIncubation()" style="background:#4CAF50; border:1px solid #388E3C; color:white; border-radius:15px; padding:5px 15px; font-size:12px; cursor:pointer; font-weight:bold; margin-right:5px;">✅ Chấp nhận Ấp</button><button onclick="declineIncubation()" style="background:#dc3545; border:1px solid #c82333; color:white; border-radius:15px; padding:5px 15px; font-size:12px; cursor:pointer; font-weight:bold;">❌ Xóa</button>`; }
};

window.sendIncubationRequest = () => {
    const convoId = window.currentPrivateConvo; if(!convoId) return; const targetId = convoId.replace(window.session.id, '').replace('_', '');
    window.db.ref(`friends/${window.session.id}/${targetId}`).once('value').then(snap => {
        const isFriend = snap.val() === 'accepted'; const isAdmin = window.session.role === 'admin' || targetId === 'admin';
        if (!isFriend && !isAdmin) return alert("⚠️ CHƯA KẾT BẠN!\nPhải kết bạn mới có thể ấp trứng!");
        window.db.ref('chat_streaks/' + convoId + '/incubationReq').set({ sender: window.session.id, time: firebase.database.ServerValue.TIMESTAMP });
        const msgs = ["Êyy, vào ấp trứng cùng tớ đi! 🥚🔥", "Cày chuỗi 2 chiều nuôi rồng không bạn êy? 🦖🔥"]; 
        window.processSendPrivate(msgs[Math.floor(Math.random() * msgs.length)], true); 
    });
};

window.acceptIncubation = () => { const convoId = window.currentPrivateConvo; if(!convoId) return; window.db.ref('chat_streaks/' + convoId + '/incubationReq').remove().then(() => { window.processSendPrivate("✅ Tớ đồng ý! Cùng nuôi rồng nhé! 🦖🔥", false); }); };
window.declineIncubation = () => { const convoId = window.currentPrivateConvo; if(!convoId) return; window.db.ref('chat_streaks/' + convoId + '/incubationReq').remove(); };

window.sendPrivateChat = () => { 
    const input = document.getElementById('private-chat-input'); const txt = input.value.trim(); if(!txt || !window.currentPrivateConvo) return;
    const targetId = window.currentPrivateConvo.replace(window.session.id, '').replace('_', '');
    window.db.ref(`friends/${window.session.id}/${targetId}`).once('value').then(snap => {
        const isFriend = snap.val() === 'accepted'; const isAdmin = window.session.role === 'admin' || targetId === 'admin';
        if (!isFriend && !isAdmin) {
            window.db.ref('chat/private/' + window.currentPrivateConvo).orderByChild('id').equalTo(window.session.id).once('value').then(msgSnap => {
                if (msgSnap.numChildren() >= 1) { alert("⚠️ CHƯA KẾT BẠN!\nBạn chỉ được gửi 1 tin nhắn làm quen."); } else { window.processSendPrivate(txt, false); input.value = ''; }
            });
        } else { window.processSendPrivate(txt, false); input.value = ''; }
    });
};

window.recoverStreak = () => { const streakRef = window.db.ref('chat_streaks/' + window.currentPrivateConvo); streakRef.once('value').then(s => { let data = s.val(); if(!data || data.brokenCount < 3) return; data.count = data.brokenCount + data.count; data.brokenCount = 0; streakRef.set(data).then(() => { alert("🚑 KHÔI PHỤC THÀNH CÔNG! Chuỗi: " + data.count); window.db.ref('chat/global').push({ id: 'system', name: '📢 LOA PHƯỜNG', text: `🚑 BẤT NGỜ CHƯA! ${window.session.name} vừa hồi sinh chuỗi ${data.count} ngày từ cõi chết! 🔥`, time: firebase.database.ServerValue.TIMESTAMP }); }); }); };
window.bragStreak = (count) => { if(confirm(`Phát loa Kênh Chung khoe chuỗi ${count}?`)) { window.db.ref('chat/global').push({ id: 'system', name: '📢 LOA PHƯỜNG', text: `🎉 ĐỈNH CỦA CHÓP! ${window.session.name} và đối tác đang giữ CHUỖI ${count} NGÀY! 🔥`, time: firebase.database.ServerValue.TIMESTAMP }); alert("Đã phát loa!"); } };

window.spyPrivateChat = (id1, id2) => {
    if (!id1 || !id2) return; const convoId = window.getConvoId(id1, id2); window.isSpying = true;
    document.getElementById('admin-spy-zone').classList.add('hidden'); document.getElementById('private-chat-area').classList.remove('hidden');
    document.getElementById('private-chat-input-zone').classList.add('hidden'); const titleEl = document.getElementById('private-chat-title'); const baseTitle = "🕵️ Đọc lén: " + id1.toUpperCase() + " & " + id2.toUpperCase(); titleEl.innerText = baseTitle; titleEl.dataset.basetitle = baseTitle;
    if (window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/private/' + convoId);
    window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, m.id === id1); }); const box = document.getElementById('private-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;">Trống!</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); });
    if(window.currentStreakRef) window.currentStreakRef.off(); window.currentStreakRef = window.db.ref('chat_streaks/' + convoId); window.currentStreakRef.on('value', snap => renderStreakUI(snap.val(), titleEl));
};

window.spyGroupChat = (gId) => { window.isSpying = true; document.getElementById('admin-spy-zone').classList.add('hidden'); document.getElementById('group-chat-area').classList.remove('hidden'); window.db.ref('groups/' + gId).once('value').then(s => { if(!s.exists()) return; const gName = s.val().name; window.currentGroupChat = gId; window.currentGroupAdmin = s.val().admin; document.getElementById('group-chat-title').innerText = "🕵️ Đọc lén Nhóm: " + gName; if(window.currentChatRef) window.currentChatRef.off(); window.currentChatRef = window.db.ref('chat/group/' + gId); window.currentChatRef.on('value', snap => { let html = ''; snap.forEach(child => { const m = child.val(); html += window.renderMessage(m, false); }); const box = document.getElementById('group-chat-box'); box.innerHTML = html || '<div style="text-align:center;color:#888;">Trống!</div>'; setTimeout(()=>{box.scrollTop = box.scrollHeight;}, 100); }); }); };
// HÀM CUỐI CÙNG (Đã được bẻ dòng cho điện thoại dễ copy)
window.executeHackStreak = () => { 
    const id1 = document.getElementById('streak-id-1').value; 
    const id2 = document.getElementById('streak-id-2').value; 
    let newStreak = document.getElementById('streak-value').value; 
    
    if (!id1 || !id2) return alert("Chọn 2 tài khoản!"); 
    if (id1 === id2) return alert("Không chọn 2 người giống nhau!"); 
    if (newStreak === "") return alert("Nhập số chuỗi!"); 
    
    newStreak = parseInt(newStreak); 
    if (isNaN(newStreak) || newStreak < 0) return alert("Số không hợp lệ!"); 
    
    const convoId = window.getConvoId(id1, id2); 
    const streakRef = window.db.ref('chat_streaks/' + convoId); 
    const today = window.getDateStr(0); 
    
    streakRef.once('value').then(s => { 
        let data = s.val() || { count: 0, lastDate: '', brokenCount: 0, waitingFor:'', freezes:2, freezeMonth:new Date().getMonth() }; 
        data.count = newStreak; 
        data.lastDate = today; 
        data.brokenCount = 0; 
        streakRef.set(data).then(() => { 
            alert(`🪄 BÙM! Chuỗi của ${id1} & ${id2} giờ là ${newStreak}!`); 
            document.getElementById('streak-value').value = ""; 
        }); 
    }); 
};

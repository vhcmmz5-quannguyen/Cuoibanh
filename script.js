window.db = null;
window.session = null;
var tempGrantImg = "", tempBrandLogo = "", tempSplashLogo = "";
window.isHk2Locked = false;
window.isDemoMode = false;
window.currentClearPin = "654321";

const showNetworkToast = (msg, bg) => {
    const t = document.getElementById('network-toast');
    if(t) {
        t.innerText = msg;
        t.style.background = bg;
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 4000);
    }
};

window.addEventListener('offline', () => showNetworkToast('⚠️ Đã mất kết nối mạng!', '#dc3545'));
window.addEventListener('online', () => showNetworkToast('✅ Đã có mạng trở lại!', '#4CAF50'));

const setOfflineStatus = () => {
    if (window.session && window.db) {
        window.db.ref('tracking/' + window.session.id).update({
            status: 'offline',
            lastLogout: firebase.database.ServerValue.TIMESTAMP
        });
    }
};

window.addEventListener('beforeunload', setOfflineStatus);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        setOfflineStatus();
    } else if (document.visibilityState === 'visible' && window.session && window.db) {
        window.db.ref('tracking/' + window.session.id).update({
            status: 'online',
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Chỉ lấy Logo ảo thuật ra hiển thị, KHÔNG dùng setTimeout để tự tắt nữa
    const s = localStorage.getItem('savedSplashLogo');
    if (s) {
        const defaultSpin = document.getElementById('default-spinner');
        if (defaultSpin) defaultSpin.classList.add('hidden');
        const c = document.getElementById('custom-splash-img');
        if (c) { c.src = s; c.classList.remove('hidden'); c.style.display = 'block'; }
    }
});
window.toggleModal = (id, show) => {
    const m = document.getElementById(id);
    if (m) m.classList[show ? 'remove' : 'add']('hidden');
};

window.toggleSidebar = (show) => {
    const s = document.getElementById('sidebar');
    if (s) s.classList[show ? 'add' : 'remove']('open');
};

window.switchTab = (id) => {
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.add('hidden'));
    const tb = document.getElementById('tab-' + id);
    if (tb) tb.classList.remove('hidden');
    window.toggleSidebar(false);
};

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            const c = {
                apiKey: "AIzaSyAcfas2KJo9n4Lpb9YVhGOpKWfYgBlSE9U",
                authDomain: "app-co-eb5d0.firebaseapp.com",
                projectId: "app-co-eb5d0",
                storageBucket: "app-co-eb5d0.firebasestorage.app",
                messagingSenderId: "160906787270",
                appId: "1:160906787270:web:638e28599f303dfddd1ac7",
                databaseURL: "https://app-co-eb5d0-default-rtdb.firebaseio.com"
            };
            if (!firebase.apps.length) firebase.initializeApp(c);
            window.db = firebase.database();
            
            window.db.ref('.info/connected').on('value', snap => {
                if (snap.val() === true) {
                    const gl = document.getElementById('global-loading');
                    if(gl) gl.classList.add('hidden');
                }
            });

            // TẢI LOGO XONG MỚI TẮT MÀN HÌNH CHỜ!
            window.db.ref('config/branding').once('value').then(s => {
                if (s.exists()) {
                    const d = s.val();
                    applyBranding(d.name, d.logo);
                    if (d.splashLogo) localStorage.setItem('savedSplashLogo', d.splashLogo);
                }
                const splash = document.getElementById('splash-screen');
                const login = document.getElementById('login-screen');
                if (splash) { splash.style.display = 'none'; splash.classList.add('hidden'); }
                if (login) login.classList.remove('hidden');
            }).catch(e => {
                console.log("Lỗi mạng:", e);
                const splash = document.getElementById('splash-screen');
                const login = document.getElementById('login-screen');
                if (splash) { splash.style.display = 'none'; splash.classList.add('hidden'); }
                if (login) login.classList.remove('hidden');
            });
            
            window.db.ref('config/branding').on('value', s => {
                if (s.exists()) {
                    const d = s.val();
                    applyBranding(d.name, d.logo);
                    if (d.splashLogo) localStorage.setItem('savedSplashLogo', d.splashLogo);
                }
            });
        }
    } catch (e) { console.log("Lỗi Firebase", e); }
}
initFirebase();

function applyBranding(n, l) {
    document.querySelectorAll('.dynamic-app-name').forEach(e => e.innerText = n || "KIM MIN LAI V3");
    document.querySelectorAll('.dynamic-logo').forEach(e => {
        if (l) { e.src = l; e.classList.remove('hidden'); } 
        else { e.classList.add('hidden'); }
    });
    const b = document.getElementById('brand-name-input');
    if (b) b.value = n || "";
}

window.handleLogin = () => {
    const i = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value.trim();
    const b = document.getElementById('login-btn');
    if (!i || !p) return alert("Điền đủ ID và Mật khẩu!");
    b.innerText = "ĐANG TẢI..."; b.disabled = true;
    
    const st = (d, u) => {
        window.db.ref('tracking/' + u).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP });
        window.db.ref('tracking/' + u).onDisconnect().update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP });
        window.session = { id: u, role: d.role, name: d.name, avatar: d.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' };
        startIntro();
    };
    
    if (i === 'admin' && p === '123') {
        window.db.ref('users/admin').once('value').then(s => st(s.val() || { role: 'admin', name: 'BOSS QUÂN' }, 'admin'));
    } else {
        window.db.ref('users/' + i).once('value').then(s => {
            if (s.exists() && s.val().pass === p) {
                if (s.val().isLocked) {
                    alert(`Tài khoản đã bị Khóa!\nLý do: ${s.val().lockReason || 'Không rõ'}`);
                    b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false;
                } else st(s.val(), i);
            } else {
                alert("Sai ID hoặc Mật khẩu!");
                b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false;
            }
        });
    }
};

window.handleLogout = () => {
    if (window.session && window.db) {
        window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }).then(() => location.reload());
    } else location.reload();
};

window.startIntro = () => {
    document.getElementById('login-screen').classList.add('hidden');
    const o = document.getElementById('intro-overlay');
    const i = document.getElementById('intro-img');
    i.src = window.session.avatar;
    o.classList.remove('hidden');
    setTimeout(() => {
        document.body.classList.add('shrink-anim');
        setTimeout(() => { o.classList.add('hidden'); document.body.classList.remove('shrink-anim'); enterApp(); }, 850);
    }, 800);
};

window.enterApp = () => {
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('display-name-real').innerText = window.session.name;
    document.getElementById('display-role').innerText = window.session.role.toUpperCase();
    document.getElementById('user-avatar').src = window.session.avatar;
    loadRealtime();
};
window.viewFullAvatar = () => {
    document.getElementById('full-avatar-img').src = window.session.avatar;
    toggleModal('avatar-viewer-modal', true);
};

window.onAvatarClick = () => {
    if (window.session.role === 'admin') document.getElementById('user-file').click();
    else viewFullAvatar();
};

window.uploadUserAvt = () => {
    const f = document.getElementById('user-file').files[0];
    const r = new FileReader();
    r.onloadend = () => window.db.ref('users/' + window.session.id + '/avatar').set(r.result).then(() => location.reload());
    r.readAsDataURL(f);
};

window.previewSplashLogo = i => {
    const f = i.files[0];
    if (f.size > 1048576) return alert("Ảnh > 1MB!");
    const r = new FileReader();
    r.onload = e => {
        tempSplashLogo = e.target.result;
        const p = document.getElementById('splash-preview-logo');
        p.src = tempSplashLogo; p.classList.remove('hidden');
    };
    r.readAsDataURL(f);
};

window.previewBrandLogo = i => {
    const f = i.files[0];
    if (f.size > 1048576) return alert("Ảnh > 1MB!");
    const r = new FileReader();
    r.onload = e => {
        tempBrandLogo = e.target.result;
        const p = document.getElementById('brand-preview-logo');
        p.src = tempBrandLogo; p.classList.remove('hidden');
    };
    r.readAsDataURL(f);
};

window.saveBranding = () => {
    if (!window.db) return;
    let u = { name: document.getElementById('brand-name-input').value };
    if (tempBrandLogo) u.logo = tempBrandLogo;
    if (tempSplashLogo) u.splashLogo = tempSplashLogo;
    window.db.ref('config/branding').update(u).then(() => {
        alert("LƯU GIAO DIỆN XONG!");
        if (tempSplashLogo) localStorage.setItem('savedSplashLogo', tempSplashLogo);
    });
};

window.previewGrantImg = i => {
    const r = new FileReader();
    r.onload = e => {
        tempGrantImg = e.target.result;
        const p = document.getElementById('grant-preview-img');
        p.src = tempGrantImg; p.classList.remove('hidden');
    };
    r.readAsDataURL(i.files[0]);
};

window.grantAvatar = () => {
    const t = document.getElementById('avatar-target-id').value.toLowerCase();
    if (!t || !tempGrantImg) return alert("Vui lòng điền đủ ID và Hình!");
    window.db.ref('users/' + t).once('value').then(s => {
        if (s.exists()) window.db.ref('users/' + t + '/avatar').set(tempGrantImg).then(() => alert("CẤP THÀNH CÔNG!"));
        else alert("Sai ID!");
    });
};

window.createNewUser = () => {
    const id = document.getElementById('new-id').value.toLowerCase().trim();
    const n = document.getElementById('new-name').value.trim();
    const p = document.getElementById('new-pass').value.trim();
    const r = document.getElementById('new-role').value;
    if (!id || !n || !p) return alert("Điền đủ thông tin!");
    window.db.ref('users/' + id).set({ name: n, pass: p, role: r, isLocked: false }).then(() => alert("TẠO XONG!"));
};

window.loadUsers = () => {
    window.db.ref('users').on('value', s => {
        let h = '', g = '';
        const d = s.val() || {};
        for (let i in d) {
            if (i === 'admin') continue;
            const u = d[i];
            const c = u.isLocked ? "checked" : "";
            const rw = `<tr><td><b>${u.name}</b><br><small>ID:${i}</small></td><td>${u.pass}</td><td><button onclick="openEditUser('${i}','${u.name}','${u.pass}')" class="btn-sm pink" style="margin-right:5px;border:none;padding:5px;border-radius:10px;background:var(--pink);color:white;">Sửa</button><button onclick="clickDelete('${i}','${u.name}')" class="btn-sm" style="background:#dc3545;color:white;border:none;padding:5px;border-radius:10px;margin-right:5px;">Xóa</button><label class="switch" style="transform:scale(0.8);vertical-align:middle;"><input type="checkbox" ${c} onchange="clickToggleLock('${i}','${u.name}',${u.isLocked || false})"><span class="slider round"></span></label></td></tr>`;
            if (u.role === 'gv') g += rw; else h += rw;
        }
        document.getElementById('list-gv').innerHTML = g;
        document.getElementById('list-hs').innerHTML = h;
    });
};

window.clickToggleLock = (i, n, l) => {
    if (l) window.db.ref('users/' + i).update({ isLocked: false, lockReason: null });
    else {
        document.getElementById('lock-u-id').value = i;
        document.getElementById('lock-u-name').innerText = n;
        document.getElementById('lock-reason-input').value = "";
        toggleModal('lock-reason-modal', true);
    }
};

window.confirmLockUser = () => {
    const id = document.getElementById('lock-u-id').value;
    const reason = document.getElementById('lock-reason-input').value.trim() || "Vi phạm nội quy";
    window.db.ref('users/' + id).update({ isLocked: true, lockReason: reason });
    toggleModal('lock-reason-modal', false);
};

window.clickDelete = (i, n) => {
    document.getElementById('delete-u-id').value = i;
    document.getElementById('delete-u-name').innerText = n;
    document.getElementById('delete-reason-input').value = "";
    toggleModal('delete-reason-modal', true);
};

window.confirmDeleteUser = () => {
    const id = document.getElementById('delete-u-id').value;
    const reason = document.getElementById('delete-reason-input').value.trim();
    if(reason) window.db.ref('deleted_logs/' + id).set({ reason: reason, time: new Date().getTime() });
    window.db.ref('users/' + id).set(null).then(() => toggleModal('delete-reason-modal', false));
};

window.openEditUser = (i, n, p) => {
    document.getElementById('edit-u-old-id').value = i;
    document.getElementById('edit-u-name').innerText = n;
    document.getElementById('edit-u-new-id').value = i;
    document.getElementById('edit-u-pass').value = p;
    toggleModal('edit-user-modal', true);
};

window.saveUserEdit = () => {
    const o = document.getElementById('edit-u-old-id').value;
    const n = document.getElementById('edit-u-new-id').value.toLowerCase().trim();
    const p = document.getElementById('edit-u-pass').value.trim();
    if (n === o) window.db.ref('users/' + o).update({ pass: p }).then(() => toggleModal('edit-user-modal', false));
    else {
        window.db.ref('users/' + o).once('value').then(s => {
            let d = s.val(); d.pass = p;
            window.db.ref().update({ ['users/' + n]: d, ['users/' + o]: null }).then(() => toggleModal('edit-user-modal', false));
        });
    }
};
window.openScoreModal = (id, name) => {
    document.getElementById('score-u-id').value = id;
    document.getElementById('score-u-name').innerText = name + " (" + id.toUpperCase() + ")";
    document.getElementById('score-term').value = '1';
    window.loadStudentScoreIntoModal();
    toggleModal('score-modal', true);
};

window.loadStudentScoreIntoModal = () => {
    const id = document.getElementById('score-u-id').value;
    const term = document.getElementById('score-term').value;
    window.db.ref(`grades/${id}/hk${term}`).once('value').then(s => {
        const d = s.val() || { m: '', p: '', t: '', thi: '', hk: 'Tốt' };
        document.getElementById('score-m').value = d.m !== undefined ? d.m : '';
        document.getElementById('score-15p').value = d.p !== undefined ? d.p : '';
        document.getElementById('score-1t').value = d.t !== undefined ? d.t : '';
        document.getElementById('score-thi').value = d.thi !== undefined ? d.thi : '';
        document.getElementById('score-conduct').value = d.hk || 'Tốt';
    });
};

window.confirmSaveScore = () => {
    const i = document.getElementById('score-u-id').value;
    const n = document.getElementById('score-u-name').innerText;
    const t = document.getElementById('score-term').value;
    const hk = document.getElementById('score-conduct').value;
    if (t === '2' && window.isHk2Locked) return alert("❌ KỲ 2 ĐÃ BỊ KHÓA, KHÔNG THỂ SỬA ĐIỂM!");
    if (confirm(`Bạn muốn lưu điểm cho em: ${n} (Kỳ ${t}) không?`)) {
        window.db.ref(`grades/${i}/hk${t}`).update({
            m: parseFloat(document.getElementById('score-m').value) || 0,
            p: parseFloat(document.getElementById('score-15p').value) || 0,
            t: parseFloat(document.getElementById('score-1t').value) || 0,
            thi: parseFloat(document.getElementById('score-thi').value) || 0,
            hk: hk
        }).then(() => { alert("✅ LƯU ĐIỂM THÀNH CÔNG!"); toggleModal('score-modal', false); });
    }
};

window.openClearDataAuth = () => { toggleModal('clear-auth-modal', true); toggleSidebar(false); };

window.verifyClearPin = () => {
    if (document.getElementById('clear-pin-input').value === window.currentClearPin) {
        toggleModal('clear-auth-modal', false); toggleModal('clear-confirm-modal', true);
    } else alert("SAI MÃ PIN!");
};

window.executeClearData = () => {
    if (!window.db) return;
    window.db.ref('users').once('value').then(S => {
        let up = { 'grades': null, 'tracking': null, 'inbox': null, 'replies': null };
        let us = S.val() || {};
        for (let u in us) { if (u !== 'admin') up['users/' + u] = null; }
        window.db.ref().update(up).then(() => { alert("🔥 ĐĐÃ RESET DỮ LIỆU!"); location.reload(); });
    });
};

window.changeClearPin = () => {
    const o = document.getElementById('old-pin-input').value;
    const n = document.getElementById('new-pin-input').value;
    if (o === window.currentClearPin) window.db.ref('config/clearPin').set(n).then(() => alert("ĐỔI PIN THÀNH CÔNG!"));
    else alert("MÃ PIN CŨ SAI!");
};

window.saveRules = () => window.db.ref('config/rules').set(document.getElementById('rules-input').value).then(() => alert("LƯU NỘI QUY XONG!"));
window.handleToggleLock = c => window.db.ref('config/hk2Locked').set(c.checked);
window.handleToggleDemoMode = c => window.db.ref('config/demoMode').set(c.checked);

window.loadTracking = () => {
    window.db.ref('tracking').on('value', s => {
        let h = ''; const d = s.val() || {};
        const pad = num => num < 10 ? '0' + num : num;
        const fmtDate = ms => { if (!ms) return '--'; const dt = new Date(ms); return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1); };
        for (let i in d) {
            const u = d[i]; const st = u.status === 'online' ? '🟢' : '🔴';
            h += `<tr><td>${u.name || i}</td><td>${u.role || '-'}</td><td>${st}</td><td>${fmtDate(u.lastLogin)}</td><td>${fmtDate(u.lastLogout)}</td></tr>`;
        }
        document.getElementById('tracking-body').innerHTML = h;
    });
};

window.loadRealtime = () => {
    window.db.ref('config/clearPin').on('value', s => window.currentClearPin = s.val() || "654321");
    window.db.ref('config/rules').on('value', s => {
        const el = document.getElementById('rules-display');
        const inEl = document.getElementById('rules-input');
        if (el) el.innerText = s.val() || "Chưa có nội quy";
        if (inEl) inEl.value = s.val() || "";
    });
    
    window.db.ref('config/demoMode').on('value', s => {
        window.isDemoMode = s.val() === true;
        const tgDemo = document.getElementById('demo-toggle');
        if (tgDemo) tgDemo.checked = window.isDemoMode;

        if (window.session) {
            const r = window.session.role;
            
            // ẨN VÙNG BẢO MẬT KHỎI HỌC SINH
            const secZone = document.getElementById('admin-security-zone');
            if (secZone) {
                if (r === 'admin') { secZone.classList.remove('hidden'); } 
                else { secZone.classList.add('hidden'); }
            }

            const adminTabs = ['nav-manage', 'nav-rules', 'nav-tracking', 'nav-avatar', 'nav-users', 'nav-branding', 'nav-settings', 'nav-clear-data'];
            const hsTabs = ['nav-personal', 'nav-rules'];
            const gvTabs = ['nav-manage', 'nav-rules'];

            document.querySelectorAll('.nav-btn').forEach(b => {
                if (!b.onclick.toString().includes('handleLogout')) b.classList.add('hidden');
            });

            let activeTabs = [];
            if (r === 'admin' || window.isDemoMode) activeTabs = adminTabs;
            else if (r === 'gv') activeTabs = gvTabs;
            else activeTabs = hsTabs;

            activeTabs.forEach(i => {
                const btn = document.getElementById(i);
                if(btn) btn.classList.remove('hidden');
            });

            const rez = document.getElementById('rules-editor-zone');
            if(rez) {
                if (r === 'admin' || r === 'gv' || window.isDemoMode) rez.classList.remove('hidden');
                else rez.classList.add('hidden');
            }
            
            if (r === 'admin' || window.isDemoMode) { switchTab('manage'); loadUsers(); loadTracking(); loadInbox(); }
            else if (r === 'gv') { switchTab('manage'); }
            else { switchTab('personal'); }
        }
    });

    window.db.ref('config/hk2Locked').on('value', s => {
        window.isHk2Locked = s.val() === true;
        const tg = document.getElementById('lock-toggle');
        if (tg) tg.checked = window.isHk2Locked;
        
        if (window.session && window.session.role === 'hs') {
            const msg = document.getElementById('lock-msg-hs');
            if (msg) msg.classList[window.isHk2Locked ? 'remove' : 'add']('hidden');
            
            window.db.ref('grades/' + window.session.id).on('value', sn => {
                const g = sn.val() || {};
                const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                const t1 = ((h1.m + h1.p + h1.t * 2 + h1.thi * 3) / 7).toFixed(1);
                let t2 = ((h2.m + h2.p + h2.t * 2 + h2.thi * 3) / 7).toFixed(1);
                let cn = ((parseFloat(t1) + parseFloat(t2) * 2) / 3).toFixed(1);
                
                let sM = h2.m, sP = h2.p, sT = h2.t, sThi = h2.thi, sHk = h2.hk || '-';
                if (window.isHk2Locked) { sM = '-'; sP = '-'; sT = '-'; sThi = '-'; t2 = '-'; cn = '-'; sHk = '-'; }
                
                const ui = document.getElementById('personal-grades-ui');
                if (ui) ui.innerHTML = `<div class="scroll-x"><table class="master-table"><tr><th class="sticky-col">KỲ</th><th>M</th><th>15P</th><th>1T</th><th>THI</th><th>TB</th><th>H.KIỂM</th></tr><tr><td class="sticky-col"><b>HK1</b></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td><b style="color:#4CAF50">${h1.hk || '-'}</b></td></tr><tr><td class="sticky-col"><b>HK2</b></td><td>${sM}</td><td>${sP}</td><td>${sT}</td><td>${sThi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td><b style="color:#4CAF50">${sHk}</b></td></tr><tr><td class="sticky-col"><b>CẢ NĂM</b></td><td colspan="4" style="text-align:right"><b>TỔNG KẾT:</b></td><td colspan="2" style="color:red;font-size:18px;font-weight:bold;">${cn}</td></tr></table></div>`;
            });
        }
    });
    
    if (window.session && (window.session.role === 'admin' || window.session.role === 'gv' || window.isDemoMode)) {
        window.db.ref('users').on('value', uS => {
            const uMap = uS.val() || {};
            window.db.ref('grades').on('value', sn => {
                let h = ''; const all = sn.val() || {};
                for (let i in all) {
                    const g = all[i];
                    const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                    const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
                    const t1 = ((h1.m + h1.p + h1.t * 2 + h1.thi * 3) / 7).toFixed(1);
                    const t2 = ((h2.m + h2.p + h2.t * 2 + h2.thi * 3) / 7).toFixed(1);
                    const cn = ((parseFloat(t1) + parseFloat(t2) * 2) / 3).toFixed(1);
                    const uN = uMap[i] ? uMap[i].name : "Không rõ";
                    h += `<tr><td class="sticky-col" onclick="openScoreModal('${i}', '${uN}')" style="cursor:pointer; background:#ffe0b2; border-right:2px solid var(--pink);"><b>${uN}</b> <i class="fas fa-edit" style="color:var(--pink);"></i><br><small>${i.toUpperCase()}</small><br><span style="font-size:10px;color:#4CAF50;font-weight:bold;">HK1:${h1.hk || '-'} | HK2:${h2.hk || '-'}</span></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td>${h2.m}</td><td>${h2.p}</td><td>${h2.t}</td><td>${h2.thi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td style="color:red;font-weight:bold;">${cn}</td></tr>`;
                }
                const b = document.getElementById('master-grade-body');
                if (b) b.innerHTML = h;
            });
        });
    }
};
window.openSupportForm = t => {
    toggleModal('support-choice-modal', false);
    document.getElementById('support-form-title').innerText = t.toUpperCase();
    document.getElementById('support-type-hidden').value = t;
    document.getElementById('support-fullname').value = '';
    document.getElementById('support-secret').value = '';
    toggleModal('support-form-modal', true);
};

window.submitSupportRequest = () => {
    const n = document.getElementById('support-fullname').value.trim();
    const t = document.getElementById('support-type-hidden').value;
    const s = document.getElementById('support-secret').value.trim();
    if (!n || !s) return alert("Vui lòng nhập đủ Tên và Mã bí mật!");
    
    const safeKey = n.toLowerCase().replace(/\s+/g, ''); 
    const COOLDOWN_DAYS = 10; 
    const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    window.db.ref('support_cooldowns/' + safeKey).once('value').then(snap => {
        if (snap.exists() && (now - snap.val()) < COOLDOWN_MS) {
            const daysLeft = Math.ceil((COOLDOWN_MS - (now - snap.val())) / (1000 * 60 * 60 * 24));
            return alert(`⏳ BẠN ĐÃ GỬI YÊU CẦU RỒI!\n\nHệ thống chống spam yêu cầu bạn chờ thêm ${daysLeft} ngày nữa mới được gửi lại.\n\n👉 Hãy ra ngoài và dùng tính năng "Tra cứu Admin phản hồi" nhé!`);
        }
        window.db.ref('inbox/' + now).set({ name: n, id: 'Chưa rõ', req: t, secret: s, time: now }).then(() => {
            window.db.ref('support_cooldowns/' + safeKey).set(now).then(() => {
                alert("✅ Đã gửi yêu cầu thành công!\n\nNHỚ KỸ MÃ BÍ MẬT CỦA BẠN LÀ: " + s);
                toggleModal('support-form-modal', false);
            });
        });
    });
};

window.loadInbox = () => {
    window.db.ref('inbox').on('value', s => {
        let h = ''; const d = s.val() || {};
        const pad = num => num < 10 ? '0' + num : num;
        for (let k in d) {
            const i = d[k]; const dt = new Date(i.time);
            const tStr = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1);
            h += `<tr><td>${tStr}</td><td><b>${i.name}</b></td><td>${i.id}</td><td>${i.req}</td><td><button class="btn-sm pink" style="background:#4CAF50;color:white;border:none;padding:5px;border-radius:10px;margin-right:5px;cursor:pointer;" onclick="openReplyModal('${k}','${i.name}','${i.secret || ''}')">Phản hồi</button><button class="btn-sm" style="background:#dc3545;color:white;border:none;padding:5px;border-radius:10px;cursor:pointer;" onclick="window.db.ref('inbox/${k}').remove()">Xóa</button></td></tr>`;
        }
        const l = document.getElementById('inbox-list');
        if (l) l.innerHTML = h || '<tr><td colspan="5">Thùng thư trống</td></tr>';
    });
};

window.openReplyModal = (k, n, s) => {
    document.getElementById('reply-key').value = k;
    document.getElementById('reply-name').value = n.toLowerCase();
    document.getElementById('reply-secret').value = s;
    document.getElementById('reply-to-name').innerText = n;
    document.getElementById('reply-msg').value = '';
    toggleModal('admin-reply-modal', true);
};

window.sendSupportReply = () => {
    const k = document.getElementById('reply-key').value;
    const n = document.getElementById('reply-name').value;
    const m = document.getElementById('reply-msg').value.trim();
    const s = document.getElementById('reply-secret').value;
    if (!m) return alert("Vui lòng nhập tin nhắn!");
    window.db.ref('replies/' + k).set({ name: n, msg: m, secret: s, time: new Date().getTime() }).then(() => {
        window.db.ref('inbox/' + k).remove(); alert("Đã gửi phản hồi thành công!"); toggleModal('admin-reply-modal', false);
    });
};

window.checkSupportReply = () => {
    const n = document.getElementById('check-fullname').value.trim().toLowerCase();
    const s = document.getElementById('check-secret').value.trim();
    if (!n || !s) return alert("Vui lòng nhập đủ Tên và Mã bí mật!");
    window.db.ref('replies').once('value').then(snap => {
        let f = false, m = "", rk = ""; const d = snap.val() || {};
        for (let k in d) { if (d[k].name && d[k].name.toLowerCase() === n && d[k].secret === s) { f = true; m = d[k].msg; rk = k; break; } }
        if (f) {
            alert("📩 ADMIN NHẮN:\n\n" + m + "\n\n(Thư này đã tự hủy để bảo mật tuyệt đối!)");
            window.db.ref('replies/' + rk).remove(); toggleModal('support-check-modal', false);
        } else alert("⏳ Sai Tên, sai Mã bí mật hoặc Admin chưa phản hồi!");
    });
};

window.openAdminPassAuth = () => { document.getElementById('admin-pass-pin').value = ''; toggleModal('admin-pass-auth-modal', true); };

window.verifyAdminPassPin = () => {
    if (document.getElementById('admin-pass-pin').value === window.currentClearPin) {
        toggleModal('admin-pass-auth-modal', false);
        document.getElementById('old-admin-pass').value = ''; document.getElementById('new-admin-pass').value = '';
        toggleModal('admin-pass-edit-modal', true);
    } else alert("❌ SAI MÃ PIN BẢO MẬT!");
};

window.changeAdminPass = () => {
    const o = document.getElementById('old-admin-pass').value.trim();
    const n = document.getElementById('new-admin-pass').value.trim();
    if (!o || !n) return alert("Nhập đủ Mật khẩu cũ và mới!");
    window.db.ref('users/admin').once('value').then(s => {
        const a = s.val() || {}; const c = a.pass || '123';
        if (o === c) {
            a.pass = n; a.role = 'admin'; a.name = a.name || 'BOSS QUÂN';
            window.db.ref('users/admin').set(a).then(() => { alert("✅ Đã đổi Mật khẩu Sếp Quân thành công!"); toggleModal('admin-pass-edit-modal', false); });
        } else alert("❌ SAI MẬT KHẨU CŨ!");
    });
};

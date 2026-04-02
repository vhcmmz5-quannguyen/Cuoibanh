window.db=null;window.session=null;var tempGrantImg="",tempBrandLogo="",tempSplashLogo="";window.isHk2Locked=false;window.currentClearPin="654321";

document.addEventListener('DOMContentLoaded',()=>{const s=localStorage.getItem('savedSplashLogo');if(s){document.getElementById('default-spinner').classList.add('hidden');const c=document.getElementById('custom-splash-img');if(c){c.src=s;c.classList.remove('hidden');}}});
window.toggleModal=(id,show)=>{const m=document.getElementById(id);if(m)m.classList[show?'remove':'add']('hidden');};
window.toggleSidebar=(show)=>{const s=document.getElementById('sidebar');if(s)s.classList[show?'add':'remove']('open');};
window.switchTab=(id)=>{document.querySelectorAll('.tab-pane').forEach(t=>t.classList.add('hidden'));const tb=document.getElementById('tab-'+id);if(tb)tb.classList.remove('hidden');window.toggleSidebar(false);};

function initFirebase(){try{if(typeof firebase!=='undefined'){const c={apiKey:"AIzaSyAcfas2KJo9n4Lpb9YVhGOpKWfYgBlSE9U",authDomain:"app-co-eb5d0.firebaseapp.com",projectId:"app-co-eb5d0",storageBucket:"app-co-eb5d0.firebasestorage.app",messagingSenderId:"160906787270",appId:"1:160906787270:web:638e28599f303dfddd1ac7",databaseURL:"https://app-co-eb5d0-default-rtdb.firebaseio.com"};if(!firebase.apps.length)firebase.initializeApp(c);window.db=firebase.database();window.db.ref('config/branding').once('value').then(s=>{if(s.exists()){const d=s.val();applyBranding(d.name,d.logo);if(d.splashLogo)localStorage.setItem('savedSplashLogo',d.splashLogo);}hideSplash();}).catch(()=>hideSplash());window.db.ref('config/branding').on('value',s=>{if(s.exists())applyBranding(s.val().name,s.val().logo);});}}catch(e){hideSplash();}}
function hideSplash(){const s=document.getElementById('splash-screen');if(s){s.style.opacity='0';setTimeout(()=>{s.classList.add('hidden');document.getElementById('login-screen').classList.remove('hidden');},500);}}
initFirebase();

function applyBranding(n,l){document.querySelectorAll('.dynamic-app-name').forEach(e=>e.innerText=n||"KIM MIN LAI V3");document.querySelectorAll('.dynamic-logo').forEach(e=>{if(l){e.src=l;e.classList.remove('hidden');}else e.classList.add('hidden');});const b=document.getElementById('brand-name-input');if(b)b.value=n||"";}
window.handleLogin=()=>{const id=document.getElementById('username').value.trim().toLowerCase(),ps=document.getElementById('password').value.trim(),btn=document.getElementById('login-btn');if(!id||!ps)return alert("Điền đủ!");btn.innerText="ĐANG TẢI...";btn.disabled=true;const st=(d,uid)=>{window.db.ref('tracking/'+uid).update({status:'online',lastLogin:firebase.database.ServerValue.TIMESTAMP});window.db.ref('tracking/'+uid).onDisconnect().update({status:'offline',lastLogout:firebase.database.ServerValue.TIMESTAMP});window.session={id:uid,role:d.role,name:d.name,avatar:d.avatar||'https://cdn-icons-png.flaticon.com/512/149/149071.png'};startIntro();};if(id==='admin'&&ps==='123'){window.db.ref('users/admin').once('value').then(s=>st(s.val()||{role:'admin',name:'BOSS QUÂN'},'admin'));}else{window.db.ref('users/'+id).once('value').then(s=>{if(s.exists()&&s.val().pass===ps){if(s.val().isLocked){alert("Tài khoản đã bị Khóa!");btn.innerText="VÀO HỆ THỐNG 🚀";btn.disabled=false;}else st(s.val(),id);}else{alert("Sai ID hoặc Mật khẩu!");btn.innerText="VÀO HỆ THỐNG 🚀";btn.disabled=false;}});}};
window.handleLogout=()=>{if(window.session&&window.db)window.db.ref('tracking/'+window.session.id).update({status:'offline',lastLogout:firebase.database.ServerValue.TIMESTAMP}).then(()=>location.reload());else location.reload();};
window.startIntro=()=>{document.getElementById('login-screen').classList.add('hidden');const o=document.getElementById('intro-overlay'),i=document.getElementById('intro-img');i.src=window.session.avatar;o.classList.remove('hidden');setTimeout(()=>{document.body.classList.add('shrink-anim');setTimeout(()=>{o.classList.add('hidden');document.body.classList.remove('shrink-anim');enterApp();},850);},800);};

window.enterApp=()=>{
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('display-name-real').innerText=window.session.name;
    document.getElementById('display-role').innerText=window.session.role.toUpperCase();
    document.getElementById('user-avatar').src=window.session.avatar;
    document.querySelectorAll('.nav-btn').forEach(b=>{if(!b.onclick.toString().includes('handleLogout'))b.classList.add('hidden');else b.classList.remove('hidden');});
    
    const r=window.session.role;
    if(r==='admin'){
        ['nav-manage','nav-rules','nav-tracking','nav-avatar','nav-users','nav-branding','nav-settings','nav-clear-data'].forEach(i=>document.getElementById(i).classList.remove('hidden'));
        document.getElementById('quick-editor').classList.remove('hidden');
        document.getElementById('rules-editor-zone').classList.remove('hidden');
        switchTab('manage'); loadUsers(); loadTracking(); loadInbox();
    }else if(r==='gv'){
        // ĐÃ TÍCH HỢP CHO GIÁO VIÊN: Có quyền sửa Nội Quy và Quản lý điểm
        ['nav-manage','nav-rules'].forEach(i=>document.getElementById(i).classList.remove('hidden'));
        document.getElementById('quick-editor').classList.remove('hidden');
        document.getElementById('rules-editor-zone').classList.remove('hidden'); // Bật ô viết nội quy cho GV
        switchTab('manage');
    }else{
        ['nav-personal','nav-rules'].forEach(i=>document.getElementById(i).classList.remove('hidden'));
        switchTab('personal');
    }
    loadRealtime();
};

window.viewFullAvatar=()=>{document.getElementById('full-avatar-img').src=window.session.avatar;toggleModal('avatar-viewer-modal',true);};
window.onAvatarClick=()=>{if(window.session.role==='admin')document.getElementById('user-file').click();else viewFullAvatar();};
window.uploadUserAvt=()=>{const f=document.getElementById('user-file').files[0],r=new FileReader();r.onloadend=()=>{window.db.ref('users/'+window.session.id+'/avatar').set(r.result).then(()=>location.reload());};r.readAsDataURL(f);};

window.previewSplashLogo=i=>{const f=i.files[0];if(f.size>1048576)return alert(">1MB!");const r=new FileReader();r.onload=e=>{tempSplashLogo=e.target.result;const p=document.getElementById('splash-preview-logo');p.src=tempSplashLogo;p.classList.remove('hidden');};r.readAsDataURL(f);};
window.previewBrandLogo=i=>{const f=i.files[0];if(f.size>1048576)return alert(">1MB!");const r=new FileReader();r.onload=e=>{tempBrandLogo=e.target.result;const p=document.getElementById('brand-preview-logo');p.src=tempBrandLogo;p.classList.remove('hidden');};r.readAsDataURL(f);};
window.saveBranding=()=>{if(!window.db)return;let u={name:document.getElementById('brand-name-input').value};if(tempBrandLogo)u.logo=tempBrandLogo;if(tempSplashLogo)u.splashLogo=tempSplashLogo;window.db.ref('config/branding').update(u).then(()=>{alert("LƯU XONG!");if(tempSplashLogo)localStorage.setItem('savedSplashLogo',tempSplashLogo);});};

window.previewGrantImg=i=>{const r=new FileReader();r.onload=e=>{tempGrantImg=e.target.result;const p=document.getElementById('grant-preview-img');p.src=tempGrantImg;p.classList.remove('hidden');};r.readAsDataURL(i.files[0]);};
window.grantAvatar=()=>{const t=document.getElementById('avatar-target-id').value.toLowerCase();if(!t||!tempGrantImg)return alert("Điền đủ!");window.db.ref('users/'+t).once('value').then(s=>{if(s.exists()){window.db.ref('users/'+t+'/avatar').set(tempGrantImg).then(()=>alert("CẤP XONG!"));}else alert("Sai ID!");});};

window.createNewUser=()=>{const id=document.getElementById('new-id').value.toLowerCase().trim(),n=document.getElementById('new-name').value.trim(),p=document.getElementById('new-pass').value.trim(),r=document.getElementById('new-role').value;if(!id||!n||!p)return alert("Điền đủ!");window.db.ref('users/'+id).set({name:n,pass:p,role:r,isLocked:false}).then(()=>alert("TẠO XONG!"));};
window.loadUsers=()=>{window.db.ref('users').on('value',s=>{let h='',g='',d=s.val()||{};for(let i in d){if(i==='admin')continue;const u=d[i],c=u.isLocked?"checked":"";const r=`<tr><td><b>${u.name}</b><br><small>ID:${i}</small></td><td>${u.pass}</td><td><button onclick="openEditUser('${i}','${u.name}','${u.pass}')" class="btn-sm pink" style="margin-right:5px;border:none;padding:5px;border-radius:10px;background:var(--pink);color:white;">Sửa</button><button onclick="clickDelete('${i}','${u.name}')" class="btn-sm" style="background:#dc3545;color:white;border:none;padding:5px;border-radius:10px;margin-right:5px;">Xóa</button><label class="switch" style="transform:scale(0.8);"><input type="checkbox" ${c} onchange="clickToggleLock('${i}','${u.name}',${u.isLocked||false})"><span class="slider round"></span></label></td></tr>`;if(u.role==='gv')g+=r;else h+=r;}document.getElementById('list-gv').innerHTML=g;document.getElementById('list-hs').innerHTML=h;});};
window.clickToggleLock=(i,n,l)=>{if(l)window.db.ref('users/'+i).update({isLocked:false});else{document.getElementById('lock-u-id').value=i;document.getElementById('lock-u-name').innerText=n;toggleModal('lock-reason-modal',true);}};window.confirmLockUser=()=>{window.db.ref('users/'+document.getElementById('lock-u-id').value).update({isLocked:true});toggleModal('lock-reason-modal',false);};
window.clickDelete=(i,n)=>{document.getElementById('delete-u-id').value=i;document.getElementById('delete-u-name').innerText=n;toggleModal('delete-reason-modal',true);};window.confirmDeleteUser=()=>{window.db.ref('users/'+document.getElementById('delete-u-id').value).set(null).then(()=>toggleModal('delete-reason-modal',false));};
window.openEditUser=(id,n,p)=>{document.getElementById('edit-u-old-id').value=id;document.getElementById('edit-u-name').innerText=n;document.getElementById('edit-u-new-id').value=id;document.getElementById('edit-u-pass').value=p;toggleModal('edit-user-modal',true);};
window.saveUserEdit=()=>{const o=document.getElementById('edit-u-old-id').value,n=document.getElementById('edit-u-new-id').value.toLowerCase().trim(),p=document.getElementById('edit-u-pass').value.trim();if(n===o){window.db.ref('users/'+o).update({pass:p}).then(()=>toggleModal('edit-user-modal',false));}else{window.db.ref('users/'+o).once('value').then(s=>{let d=s.val();d.pass=p;window.db.ref().update({['users/'+n]:d,['users/'+o]:null}).then(()=>toggleModal('edit-user-modal',false));});}};

window.saveScoreData=()=>{const i=document.getElementById('s-name').value.toLowerCase().trim(),t=document.getElementById('s-term').value;if(!i)return alert("Điền ID!");window.db.ref('users/'+i).once('value').then(s=>{if(s.exists()&&s.val().role==='hs'){if(t==='2'&&window.isHk2Locked)return alert("❌ HK2 ĐÃ KHÓA!");window.db.ref(`grades/${i}/hk${t}`).set({m:parseFloat(document.getElementById('s-m').value)||0,p:parseFloat(document.getElementById('s-15p').value)||0,t:parseFloat(document.getElementById('s-1t').value)||0,thi:parseFloat(document.getElementById('s-thi').value)||0}).then(()=>alert("LƯU XONG!"));}else alert("Chỉ nhập điểm Học Sinh!");});};
window.openClearDataAuth=()=>{toggleModal('clear-auth-modal',true);toggleSidebar(false);};window.verifyClearPin=()=>{if(document.getElementById('clear-pin-input').value===window.currentClearPin){toggleModal('clear-auth-modal',false);toggleModal('clear-confirm-modal',true);}else alert("SAI PIN!");};
window.executeClearData=()=>{if(!window.db)return;window.db.ref('users').once('value').then(uS=>{let up={'grades':null,'tracking':null,'inbox':null,'replies':null};let us=uS.val()||{};for(let u in us){if(u!=='admin')up['users/'+u]=null;}window.db.ref().update(up).then(()=>{alert("🔥 ĐÃ RESET 100%");location.reload();});});};

window.changeClearPin=()=>{const o=document.getElementById('old-pin-input').value,n=document.getElementById('new-pin-input').value;if(o===window.currentClearPin){window.db.ref('config/clearPin').set(n).then(()=>alert("ĐỔI XONG!"));}else alert("PIN CŨ SAI!");};
window.saveRules=()=>{window.db.ref('config/rules').set(document.getElementById('rules-input').value).then(()=>alert("LƯU NỘI QUY XONG!"));};
window.handleToggleLock=c=>{window.db.ref('config/hk2Locked').set(c.checked);};

window.loadTracking=()=>{window.db.ref('tracking').on('value',s=>{let h='',d=s.val()||{};for(let i in d){const u=d[i],st=u.status==='online'?'🟢':'🔴';h+=`<tr><td>${u.name||i}</td><td>${u.role||'-'}</td><td>${st}</td><td>${u.lastLogin?new Date(u.lastLogin).getHours()+':'+new Date(u.lastLogin).getMinutes():'--'}</td><td>${u.lastLogout?new Date(u.lastLogout).getHours()+':'+new Date(u.lastLogout).getMinutes():'--'}</td></tr>`;}document.getElementById('tracking-body').innerHTML=h;});};

window.loadRealtime=()=>{
    window.db.ref('config/clearPin').on('value',s=>window.currentClearPin=s.val()||"654321");
    window.db.ref('config/rules').on('value',s=>{const el=document.getElementById('rules-display'),inEl=document.getElementById('rules-input');if(el)el.innerText=s.val()||"Chưa có nội quy";if(inEl)inEl.value=s.val()||"";});
    window.db.ref('config/hk2Locked').on('value',s=>{
        window.isHk2Locked=s.val()===true;const tg=document.getElementById('lock-toggle');if(tg)tg.checked=window.isHk2Locked;
        if(window.session.role==='hs'){
            const msg=document.getElementById('lock-msg-hs');if(msg)msg.classList[window.isHk2Locked?'remove':'add']('hidden');
            window.db.ref('grades/'+window.session.id).on('value',sn=>{
                const g=sn.val()||{hk1:{m:0,p:0,t:0,thi:0},hk2:{m:0,p:0,t:0,thi:0}};
                const t1=((g.hk1.m+g.hk1.p+g.hk1.t*2+g.hk1.thi*3)/7).toFixed(1),t2=((g.hk2.m+g.hk2.p+g.hk2.t*2+g.hk2.thi*3)/7).toFixed(1),cn=((parseFloat(t1)+parseFloat(t2)*2)/3).toFixed(1);
                const ui=document.getElementById('personal-grades-ui');if(ui)ui.innerHTML=`<table class="master-table"><tr><th>KỲ</th><th>M</th><th>15P</th><th>1T</th><th>THI</th><th>TB</th></tr><tr><td>HK1</td><td>${g.hk1.m}</td><td>${g.hk1.p}</td><td>${g.hk1.t}</td><td>${g.hk1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td></tr><tr><td>HK2</td><td>${g.hk2.m}</td><td>${g.hk2.p}</td><td>${g.hk2.t}</td><td>${g.hk2.thi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td></tr><tr><td colspan="5"><b>TB CẢ NĂM</b></td><td style="color:red;font-size:18px;font-weight:bold;">${cn}</td></tr></table>`;
            });
        }
    });
    if(window.session.role==='admin'||window.session.role==='gv'){
        window.db.ref('grades').on('value',sn=>{
            let h='',all=sn.val()||{};
            for(let i in all){
                const g=all[i],h1=g.hk1||{m:0,p:0,t:0,thi:0},h2=g.hk2||{m:0,p:0,t:0,thi:0};
                const t1=((h1.m+h1.p+h1.t*2+h1.thi*3)/7).toFixed(1),t2=((h2.m+h2.p+h2.t*2+h2.thi*3)/7).toFixed(1),cn=((parseFloat(t1)+parseFloat(t2)*2)/3).toFixed(1);
                h+=`<tr><td><b>${i.toUpperCase()}</b></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td>${h2.m}</td><td>${h2.p}</td><td>${h2.t}</td><td>${h2.thi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td style="color:red;font-weight:bold;">${cn}</td></tr>`;
            }
            const b=document.getElementById('master-grade-body');if(b)b.innerHTML=h;
        });
    }
};

window.openSupportForm=t=>{toggleModal('support-choice-modal',false);document.getElementById('support-form-title').innerText=t.toUpperCase();document.getElementById('support-type-hidden').value=t;document.getElementById('support-fullname').value='';toggleModal('support-form-modal',true);};
window.submitSupportRequest=()=>{const n=document.getElementById('support-fullname').value.trim(),t=document.getElementById('support-type-hidden').value;if(!n)return alert("Vui lòng nhập Họ Tên!");const tm=new Date().getTime();window.db.ref('inbox/'+tm).set({name:n,id:'Chưa rõ',req:t,time:tm}).then(()=>{alert("Đã gửi cho Admin thành công!");toggleModal('support-form-modal',false);});};
window.loadInbox=()=>{window.db.ref('inbox').on('value',s=>{let h='',d=s.val()||{};for(let k in d){const i=d[k],dt=new Date(i.time);const tStr=dt.getHours()+':'+dt.getMinutes()+' '+dt.getDate()+'/'+(dt.getMonth()+1);h+=`<tr><td>${tStr}</td><td><b>${i.name}</b></td><td>${i.id}</td><td>${i.req}</td><td><button class="btn-sm pink" style="background:#4CAF50;color:white;border:none;padding:5px;border-radius:10px;margin-right:5px;cursor:pointer;" onclick="openReplyModal('${k}','${i.name}')">Phản hồi</button><button class="btn-sm" style="background:#dc3545;color:white;border:none;padding:5px;border-radius:10px;cursor:pointer;" onclick="window.db.ref('inbox/${k}').remove()">Xóa</button></td></tr>`;}const l=document.getElementById('inbox-list');if(l)l.innerHTML=h||'<tr><td colspan="5">Thùng thư trống</td></tr>';});};
window.openReplyModal=(k,n)=>{document.getElementById('reply-key').value=k;document.getElementById('reply-name').value=n.toLowerCase();document.getElementById('reply-to-name').innerText=n;document.getElementById('reply-msg').value='';toggleModal('admin-reply-modal',true);};
window.sendSupportReply=()=>{const k=document.getElementById('reply-key').value,n=document.getElementById('reply-name').value,m=document.getElementById('reply-msg').value.trim();if(!m)return alert("Vui lòng nhập tin nhắn!");window.db.ref('replies/'+n).set({msg:m,time:new Date().getTime()}).then(()=>{window.db.ref('inbox/'+k).remove();alert("Đã gửi phản hồi!");toggleModal('admin-reply-modal',false);});};
window.checkSupportReply=()=>{const n=document.getElementById('check-fullname').value.trim().toLowerCase();if(!n)return alert("Vui lòng nhập tên của bạn!");window.db.ref('replies/'+n).once('value').then(s=>{if(s.exists()){alert("📩 ADMIN QUÂN NHẮN:\n\n"+s.val().msg);toggleModal('support-check-modal',false);}else alert("⏳ Admin chưa phản hồi hoặc bạn nhập sai Tên!");});};

window.openAdminPassAuth=()=>{document.getElementById('admin-pass-pin').value='';toggleModal('admin-pass-auth-modal',true);};
window.verifyAdminPassPin=()=>{if(document.getElementById('admin-pass-pin').value===window.currentClearPin){toggleModal('admin-pass-auth-modal',false);document.getElementById('old-admin-pass').value='';document.getElementById('new-admin-pass').value='';toggleModal('admin-pass-edit-modal',true);}else alert("❌ SAI MÃ PIN BẢO MẬT!");};
window.changeAdminPass=()=>{const o=document.getElementById('old-admin-pass').value.trim(),n=document.getElementById('new-admin-pass').value.trim();if(!o||!n)return alert("Nhập đủ Mật khẩu cũ và mới!");window.db.ref('users/admin').once('value').then(s=>{const a=s.val()||{},c=a.pass||'123';if(o===c){a.pass=n;a.role='admin';a.name=a.name||'BOSS QUÂN';window.db.ref('users/admin').set(a).then(()=>{alert("✅ Đã đổi Mật khẩu Sếp Quân thành công!");toggleModal('admin-pass-edit-modal',false);});}else alert("❌ SAI MẬT KHẨU CŨ!");});};

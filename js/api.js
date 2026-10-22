// ============================================
// PASTE YOUR DEPLOYED GOOGLE SCRIPT URL BELOW
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbygUZGL45qpxvNXRrgVCcoXoQUCvrmr5MEDyDsPF_cbK-E-UX6wYHq-D47bNJr2ZHd6Gg/exec';

// ============================================
// API FUNCTIONS
// ============================================

async function apiGet(action, params = {}) {
  try {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
      url.searchParams.append(key, params[key]);
    }
    const response = await fetch(url.toString());
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API GET Error:', error);
    throw error;
  }
}

async function apiPost(action, body = {}) {
  try {
    body.action = action;
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API POST Error:', error);
    throw error;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

function setAdminSession() {
  sessionStorage.setItem('sofAdmin', 'true');
  sessionStorage.setItem('sofAdminTime', Date.now().toString());
}

function checkAdminSession() {
  const isAdmin = sessionStorage.getItem('sofAdmin');
  const loginTime = sessionStorage.getItem('sofAdminTime');
  if (!isAdmin || !loginTime) return false;
  // 2 hour timeout
  if (Date.now() - parseInt(loginTime) > 7200000) {
    clearAdminSession();
    return false;
  }
  return true;
}

function clearAdminSession() {
  sessionStorage.removeItem('sofAdmin');
  sessionStorage.removeItem('sofAdminTime');
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  setTimeout(function() { toast.className = 'toast'; }, 3500);
}

// ============================================
// DATE FORMATTER (Frontend Safety)
// ============================================

function formatISODate(value) {
  if (!value) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }
  }
  return value;
}

function formatISODateTime(value) {
  if (!value) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + hours + ':' + mins + ' ' + ampm;
    }
  }
  return value;
}

// ============================================
// RECEIPT HTML BUILDER (Shared)
// ============================================

function buildReceiptHTML(r) {
  var utrRow = (r.paymentMode === 'UPI' && r.utrNo)
    ? '<div class="receipt-row"><span class="r-label">UTR / Transaction No.</span><span class="r-value">' + r.utrNo + '</span></div>'
    : '';

  return '<div class="receipt-box" id="receiptPrintArea">' +
    '<div class="receipt-top">' +
      '<div class="receipt-logos">' +
        '<img src="https://sofworld.org/sites/default/files/SOF%20Logo%20100.png" alt="SOF" class="receipt-logo-img" onerror="this.style.display=\'none\'">' +
        '<div class="receipt-title-block">' +
          '<h3>Science Olympiad Foundation</h3>' +
          '<p>DAV Public School, NTPC</p>' +
          '<span class="receipt-tag">PAYMENT RECEIPT</span>' +
        '</div>' +
        '<img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/DAV_Emblem.png/150px-DAV_Emblem.png" alt="DAV" class="receipt-logo-img" onerror="this.style.display=\'none\'">' +
      '</div>' +
    '</div>' +
    '<div class="receipt-body-content">' +
      '<div class="receipt-row"><span class="r-label">Receipt No.</span><span class="r-value">' + r.receiptNo + '</span></div>' +
      '<div class="receipt-row"><span class="r-label">Date</span><span class="r-value">' + formatISODateTime(r.receiptDate) + '</span></div>' +
      '<div class="receipt-divider"></div>' +
      '<div class="receipt-row"><span class="r-label">Tracking ID</span><span class="r-value">' + r.trackingId + '</span></div>' +
      '<div class="receipt-row"><span class="r-label">Student Name</span><span class="r-value">' + r.studentName + '</span></div>' +
      '<div class="receipt-row"><span class="r-label">Class - Section</span><span class="r-value">' + r.className + ' - ' + r.section + '</span></div>' +
      '<div class="receipt-row"><span class="r-label">Mobile No.</span><span class="r-value">' + r.mobile + '</span></div>' +
      '<div class="receipt-divider"></div>' +
      '<div class="receipt-row"><span class="r-label">Olympiad(s)</span><span class="r-value">' + r.olympiads.join(', ') + '</span></div>' +
      '<div class="receipt-row"><span class="r-label">No. of Olympiads</span><span class="r-value">' + r.olympiads.length + '</span></div>' +
      '<div class="receipt-row"><span class="r-label">Rate per Olympiad</span><span class="r-value">₹200</span></div>' +
      '<div class="receipt-row"><span class="r-label">Payment Mode</span><span class="r-value">' + r.paymentMode + '</span></div>' +
      utrRow +
      '<div class="receipt-total-row">' +
        '<span>Total Amount Paid</span>' +
        '<span>₹' + r.totalAmount + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="receipt-footer-section">' +
      '<p>This is a computer-generated receipt and does not require a signature.</p>' +
      '<p>&copy; 2026-27 Science Olympiad Foundation | DAV Public School, NTPC</p>' +
    '</div>' +
  '</div>';
}

function printReceiptContent() {
  var area = document.getElementById('receiptPrintArea');
  if (!area) return;
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><title>SOF Receipt</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' +
      '*{margin:0;padding:0;box-sizing:border-box;}' +
      'body{font-family:"Inter",sans-serif;padding:30px;background:white;}' +
      '.receipt-box{border:2px solid #1a237e;border-radius:14px;padding:30px;max-width:520px;margin:0 auto;}' +
      '.receipt-top{border-bottom:2px dashed #cbd5e1;padding-bottom:18px;margin-bottom:18px;}' +
      '.receipt-logos{display:flex;align-items:center;justify-content:center;gap:15px;}' +
      '.receipt-logo-img{width:50px;height:50px;object-fit:contain;border-radius:50%;}' +
      '.receipt-title-block{text-align:center;}' +
      '.receipt-title-block h3{color:#1a237e;font-size:1.05rem;}' +
      '.receipt-title-block p{color:#64748b;font-size:0.82rem;}' +
      '.receipt-tag{display:inline-block;margin-top:6px;padding:3px 14px;background:#e8eaf6;color:#1a237e;border-radius:20px;font-weight:700;font-size:0.78rem;}' +
      '.receipt-body-content{padding:5px 0;}' +
      '.receipt-row{display:flex;justify-content:space-between;padding:5px 0;font-size:0.88rem;}' +
      '.r-label{color:#64748b;}.r-value{font-weight:600;color:#1e293b;}' +
      '.receipt-divider{height:1px;background:#e2e8f0;margin:8px 0;}' +
      '.receipt-total-row{display:flex;justify-content:space-between;padding:12px 0 5px;margin-top:10px;border-top:2px solid #1a237e;font-size:1.1rem;font-weight:700;color:#1a237e;}' +
      '.receipt-footer-section{text-align:center;margin-top:18px;padding-top:15px;border-top:2px dashed #cbd5e1;}' +
      '.receipt-footer-section p{font-size:0.72rem;color:#94a3b8;line-height:1.6;}' +
    '</style></head><body>' +
    area.outerHTML +
    '<script>setTimeout(function(){window.print();},500);<\/script>' +
  '</body></html>');
}
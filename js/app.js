/**
 * Samut Prakan Citizen Report App
 * Main JavaScript Application
 */

// ===================================
// Global State
// ===================================
const AppState = {
  reports: JSON.parse(localStorage.getItem('reports') || '[]'),
  currentReport: null
};

// ===================================
// Samut Prakan District-Subdistrict Data
// ===================================
const LOCATION_DATA = {
  'เมืองสมุทรปราการ': [
    'ปากน้ำ', 'สำโรงเหนือ', 'บางเมือง', 'ท้ายบ้าน', 'บางปูใหม่',
    'แพรกษา', 'บางโปรง', 'บางปู', 'บางด้วน', 'บางเมืองใหม่',
    'เทพารักษ์', 'ท้ายบ้านใหม่', 'แพรกษาใหม่'
  ],
  'บางบ่อ': [
    'บางบ่อ', 'บ้านระกาศ', 'บางพลีน้อย', 'บางเพรียง', 'คลองด่าน',
    'คลองสวน', 'เปร็ง', 'คลองนิยมยาตรา'
  ],
  'บางพลี': [
    'บางพลีใหญ่', 'บางแก้ว', 'บางปลา', 'บางโฉลง', 'ราชาเทวะ', 'หนองปรือ'
  ],
  'พระประแดง': [
    'ตลาด', 'บางพึ่ง', 'บางจาก', 'บางครุ', 'บางหญ้าแพรก',
    'บางหัวเสือ', 'สำโรงกลาง', 'สำโรง', 'สำโรงใต้', 'บางยอ',
    'บางกะเจ้า', 'บางน้ำผึ้ง', 'บางกอบัว', 'บางกระสอบ', 'ทรงคนอง'
  ],
  'พระสมุทรเจดีย์': [
    'นาเกลือ', 'บ้านคลองสวน', 'แหลมฟ้าผ่า', 'ปากคลองบางปลากด', 'ในคลองบางปลากด'
  ],
  'บางเสาธง': [
    'บางเสาธง', 'ศีรษะจรเข้น้อย', 'ศีรษะจรเข้ใหญ่'
  ]
};

// ===================================
// Utility Functions
// ===================================
function generateId() {
  return 'ST' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function saveReports() {
  try {
    localStorage.setItem('reports', JSON.stringify(AppState.reports));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      // Storage full, try to save without images for the oldest reports or current report
      console.warn('LocalStorage full, attempting to cleanup...');
      alert('หน่วยความจำเต็ม! ระบบจะบันทึกข้อมูลโดยไม่รวมรูปภาพ');

      // Remove images from the most recent report (likely the culprit)
      if (AppState.reports.length > 0) {
        AppState.reports[0].images = [];
      }

      try {
        localStorage.setItem('reports', JSON.stringify(AppState.reports));
      } catch (retryErr) {
        alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลบประวัติการแจ้งปัญหาเก่าๆ ออกบ้าง');
      }
    }
  }
}

// Helper: Compress Image
function compressImage(base64Str, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

// ===================================
// Navigation
// ===================================
function initNavigation() {
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', () => {
      navbarMenu.classList.toggle('active');

      // Animate hamburger
      const spans = navbarToggle.querySelectorAll('span');
      spans.forEach(span => span.classList.toggle('active'));
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar')) {
        navbarMenu.classList.remove('active');
      }
    });

    // Close menu when clicking on a link
    navbarMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navbarMenu.classList.remove('active');
      });
    });
  }
}

// ===================================
// Report Form
// ===================================
function initReportForm() {
  const form = document.getElementById('reportForm');
  if (!form) return;

  // Category selection
  const categoryButtons = document.querySelectorAll('.category-btn');
  const categoryInput = document.getElementById('category');

  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (categoryInput) {
        categoryInput.value = btn.dataset.category;
      }
    });
  });

  // District-Subdistrict Dynamic Dropdown
  const districtSelect = document.getElementById('districtSelect');
  const subdistrictSelect = document.getElementById('subdistrictSelect');

  if (districtSelect && subdistrictSelect) {
    districtSelect.addEventListener('change', () => {
      const district = districtSelect.value;

      // Clear current options
      subdistrictSelect.innerHTML = '';

      if (district && LOCATION_DATA[district]) {
        subdistrictSelect.disabled = false;
        subdistrictSelect.innerHTML = '<option value="">เลือกตำบล/แขวง</option>';

        LOCATION_DATA[district].forEach(subdistrict => {
          const option = document.createElement('option');
          option.value = subdistrict;
          option.textContent = subdistrict;
          subdistrictSelect.appendChild(option);
        });
      } else {
        subdistrictSelect.disabled = true;
        subdistrictSelect.innerHTML = '<option value="">กรุณาเลือกอำเภอก่อน</option>';
      }
    });
  }

  // Geolocation
  const getLocationBtn = document.getElementById('getLocationBtn');
  const locationTextarea = document.getElementById('locationTextarea');
  const locationHint = document.getElementById('locationHint');
  const latitudeInput = document.getElementById('latitudeInput');
  const longitudeInput = document.getElementById('longitudeInput');

  if (getLocationBtn && locationTextarea) {
    getLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
        return;
      }

      getLocationBtn.disabled = true;
      getLocationBtn.innerHTML = '⏳ กำลังระบุตำแหน่ง...';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (latitudeInput) latitudeInput.value = lat;
          if (longitudeInput) longitudeInput.value = lng;

          // Add coordinates to location textarea
          const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
          const coordText = `\n\n📍 พิกัด GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n🗺️ แผนที่: ${googleMapsLink}`;

          if (!locationTextarea.value.includes('พิกัด GPS')) {
            locationTextarea.value += coordText;
          }

          if (locationHint) {
            locationHint.innerHTML = `✅ ได้รับตำแหน่งแล้ว (<a href="${googleMapsLink}" target="_blank">ดูบนแผนที่</a>)`;
            locationHint.style.color = 'var(--success)';
          }

          getLocationBtn.disabled = false;
          getLocationBtn.innerHTML = '✅ ได้ตำแหน่งแล้ว';

          setTimeout(() => {
            getLocationBtn.innerHTML = '📍 ใช้ตำแหน่งปัจจุบัน';
          }, 3000);
        },
        (error) => {
          let errorMessage = 'ไม่สามารถระบุตำแหน่งได้';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'กรุณาอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'ไม่สามารถระบุตำแหน่งได้ในขณะนี้';
              break;
            case error.TIMEOUT:
              errorMessage = 'หมดเวลาในการระบุตำแหน่ง';
              break;
          }

          alert(errorMessage);
          getLocationBtn.disabled = false;
          getLocationBtn.innerHTML = '📍 ใช้ตำแหน่งปัจจุบัน';
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Image upload
  const fileUpload = document.getElementById('imageUpload');
  const fileInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const uploadedImages = [];

  if (fileUpload && fileInput) {
    fileUpload.addEventListener('click', () => fileInput.click());

    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.classList.add('dragover');
    });

    fileUpload.addEventListener('dragleave', () => {
      fileUpload.classList.remove('dragover');
    });

    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && uploadedImages.length < 5) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            // Initial preview with loading state if needed, or just wait
            // Compress image to max 800px width, 0.7 quality
            const compressedDataUrl = await compressImage(e.target.result, 800, 0.7);

            if (uploadedImages.length < 5) {
              uploadedImages.push(compressedDataUrl);
              updateImagePreview();
            }
          } catch (err) {
            console.error('Image compression failed:', err);
            // Fallback to original if compression fails (though risky for storage)
            if (uploadedImages.length < 5) {
              uploadedImages.push(e.target.result);
              updateImagePreview();
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function updateImagePreview() {
    if (!imagePreview) return;

    imagePreview.innerHTML = uploadedImages.map((img, index) => `
      <div class="image-preview-item">
        <img src="${img}" alt="Preview ${index + 1}">
        <button type="button" class="image-preview-remove" onclick="removeImage(${index})">×</button>
      </div>
    `).join('');
  }

  window.removeImage = function (index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
  };

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Submit event triggered');

    if (!validateForm(form)) {
      console.log('Validation failed');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ กำลังส่งข้อมูล...';
    }

    console.log('Validation passed, processing...');

    const formData = new FormData(form);
    const reportData = {
      category: formData.get('category'),
      description: formData.get('description'),
      district: formData.get('district'),
      subdistrict: formData.get('subdistrict'),
      location: formData.get('location'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      line: formData.get('line'),
      images: [...uploadedImages],
      // New fields from UI
      pdpaAccepted: formData.get('pdpa') === 'on',
      // In real world, captcha would be verified here
    };

    try {
      // Use Database Service
      const newReport = await dbService.createReport(reportData);

      // Show success modal
      showSuccessModal(newReport.id);

      // Reset form
      form.reset();
      uploadedImages.length = 0;
      updateImagePreview();

      // Reset specific UI elements
      const selectedBtn = document.querySelector('.category-btn.selected');
      if (selectedBtn) selectedBtn.classList.remove('selected');
      if (document.getElementById('subdistrictSelect')) {
        document.getElementById('subdistrictSelect').disabled = true;
        document.getElementById('subdistrictSelect').innerHTML = '<option value="">กรุณาเลือกอำเภอก่อน</option>';
      }

      // Restore button (modal will cover it anyway)
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '✅ ส่งเรื่องร้องเรียน';
      }

    } catch (err) {
      console.error('Submission error:', err);
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + err.message);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '❌ ลองใหม่อีกครั้ง';
      }
    }
  });
}

function validateForm(form) {
  let isValid = true;
  let firstErrorElement = null;
  const requiredFields = form.querySelectorAll('[required]');

  // Validate category first
  const categoryInput = document.getElementById('category');
  const categorySection = document.querySelector('.category-section');

  if (categoryInput && !categoryInput.value) {
    isValid = false;
    if (categorySection) {
      const errorEl = categorySection.querySelector('.form-error');
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'กรุณาเลือกหมวดหมู่ปัญหา';
      }
      firstErrorElement = categorySection;
    }
  } else if (categorySection) {
    const errorEl = categorySection.querySelector('.form-error');
    if (errorEl) errorEl.style.display = 'none';
  }

  requiredFields.forEach(field => {
    // Skip hidden inputs (category is validated separately)
    if (field.type === 'hidden') return;

    const errorElement = field.parentElement.querySelector('.form-error');

    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('error');
      field.style.borderColor = 'var(--error)';
      if (errorElement) {
        errorElement.textContent = 'กรุณากรอกข้อมูลนี้';
        errorElement.style.display = 'block';
      }
      if (!firstErrorElement) {
        firstErrorElement = field;
      }
    } else {
      field.classList.remove('error');
      field.style.borderColor = '';
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }
  });

  // Scroll to first error and show alert
  if (!isValid) {
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Flash animation for the error section
      firstErrorElement.style.animation = 'none';
      setTimeout(() => {
        firstErrorElement.style.animation = 'shake 0.5s ease';
      }, 10);
    }
    // Fallback: Alert the user if validation fails so they know something happened
    alert('กรุณากรอกข้อมูลให้ครบถ้วน (ช่องที่มีกรอบสีแดง)');
  }

  return isValid;
}

function showSuccessModal(reportId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-icon success">✓</div>
      <h3>ส่งเรื่องร้องเรียนสำเร็จ!</h3>
      <p>หมายเลขอ้างอิงของคุณคือ:</p>
      <div class="report-id">${reportId}</div>
      <p class="modal-hint">กรุณาเก็บหมายเลขนี้ไว้เพื่อติดตามสถานะ</p>
      <div class="modal-buttons">
        <button class="btn btn-secondary" onclick="copyReportId('${reportId}')">คัดลอกหมายเลข</button>
        <a href="track.html?id=${reportId}" class="btn btn-primary">ติดตามสถานะ</a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add modal styles dynamically
  addModalStyles();

  // Close modal on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function copyReportId(id) {
  navigator.clipboard.writeText(id).then(() => {
    alert('คัดลอกหมายเลขอ้างอิงแล้ว: ' + id);
  });
}

function addModalStyles() {
  if (document.getElementById('modal-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'modal-styles';
  styles.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.3s ease;
    }
    
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      max-width: 400px;
      width: 90%;
      animation: slideUp 0.3s ease;
    }
    
    .modal-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin: 0 auto 1rem;
    }
    
    .modal-icon.success {
      background: #d1fae5;
      color: #059669;
    }
    
    .report-id {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0052cc;
      background: #e6f0ff;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      letter-spacing: 2px;
    }
    
    .modal-hint {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    
    .modal-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styles);
}

// ===================================
// Track Status
// ===================================
// Track Status
async function initTrackPage() {
  const searchForm = document.getElementById('trackSearchForm');
  const resultContainer = document.getElementById('trackResult');
  const recentContainer = document.getElementById('recentReports');

  // Load Recent Reports (from DB Service)
  if (recentContainer) {
    try {
      const reports = await dbService.getAllReports();
      // Sort by date desc
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (reports.length === 0) {
        recentContainer.innerHTML = '<p class="text-muted text-center">ยังไม่มีรายการร้องเรียน</p>';
      } else {
        recentContainer.innerHTML = reports.slice(0, 5).map(r => `
                <div class="card mb-4" style="cursor: pointer;" onclick="searchReport('${r.id}')">
                    <div class="card-body flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <div class="card-icon" style="font-size: 1.5rem;">${getCategoryIcon(r.category)}</div>
                            <div>
                                <h4 style="margin:0;">${r.description.substring(0, 30)}${r.description.length > 30 ? '...' : ''}</h4>
                                <div class="text-muted" style="font-size: 0.8em;">
                                    ${r.id} • ${new Date(r.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                        <span class="badge ${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span>
                    </div>
                </div>
            `).join('');
      }
    } catch (err) {
      console.error('Failed to load recent reports', err);
    }
  }

  if (!searchForm) return;

  // Check URL for report ID
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  if (reportId) {
    document.getElementById('trackId').value = reportId;
    searchReport(reportId);
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const trackId = document.getElementById('trackId').value.trim().toUpperCase();
    searchReport(trackId);
  });
}

function getCategoryIcon(cat) {
  const map = { road: '🛣️', flood: '💧', electric: '💡', trash: '🗑️', safety: '🛡️', other: '📋' };
  return map[cat] || '📋';
}

function getStatusClass(status) {
  return status === 'completed' ? 'badge-completed' : (status === 'in_progress' ? 'badge-progress' : 'badge-pending');
}

function getStatusLabel(status) {
  const map = { pending: 'รอตรวจสอบ', accepted: 'รับเรื่องแล้ว', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น' };
  return map[status] || status;
}

// Make available globally for inline onclick
window.searchReport = searchReport;

// Track Status with DB Service
async function searchReport(trackId) {
  const resultContainer = document.getElementById('trackResult');
  const searchBtn = document.querySelector('#trackSearchForm button');
  const trackInput = document.getElementById('trackId');
  const phoneInput = document.getElementById('trackPhone'); // New privacy input

  if (!resultContainer) return;

  // Auto-fill input if empty (UX improvement)
  if (trackInput && !trackInput.value) {
    trackInput.value = trackId;
  }

  // Get Phone Number from Input or URL
  let phone = phoneInput ? phoneInput.value.trim() : '';
  if (!phone) {
    const urlParams = new URLSearchParams(window.location.search);
    phone = urlParams.get('phone') || '';
    if (phoneInput && phone) phoneInput.value = phone;
  }

  // If entering manually and phone is missing (except for quick click which might prompt)
  if (!phone && trackId) {
    if (phoneInput) {
      phoneInput.focus();
      alert('กรุณาระบุเบอร์โทรศัพท์เพื่อยืนยันตัวตน');
      return;
    }
  }

  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.textContent = '⏳ กำลังตรวจสอบ...';
  }

  try {
    const report = await dbService.getReportById(trackId);

    if (report) {
      // Privacy Check: Phone MUST match (last 4 digits or full?) -> Let's do full match for safety
      if (report.phone !== phone) {
        console.warn('Phone mismatch for privacy:', report.phone, phone);
        // Redirect to Error Page
        window.location.href = 'track_error.html';
      } else {
        // Success - Show Details
        resultContainer.innerHTML = renderReportDetails(report);
        resultContainer.style.display = 'block';

        // Show Recent Reports again
        const recentContainer = document.getElementById('recentReports');
        if (recentContainer) {
          const section = recentContainer.closest('.section') || recentContainer.parentElement;
          if (section) section.style.display = 'block';
        }

        // Scroll to result so user notices it
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Show Resolution/After Images if completed
        if (report.status === 'completed' && report.afterImages) {
          const resSection = document.getElementById('resolutionSection');
          const resImages = document.getElementById('resolutionImages');
          const resNote = document.getElementById('resolutionNote');

          if (resSection && resImages) {
            resSection.style.display = 'block';
            // Find completion note from timeline
            const completeLog = report.timeline.find(t => t.status === 'completed');
            if (completeLog && resNote) {
              resNote.textContent = `📝 บันทึกเจ้าหน้าที่: ${completeLog.message}`;
            }

            resImages.innerHTML = report.afterImages.map(src =>
              `<img src="${src}" class="image-preview-item" style="width:100%; height:150px; object-fit:cover; border-radius:8px;" onclick="window.open('${src}')">`
            ).join('');
          }
        }
      }
    } else {
      // Not Found -> Redirect to Error Page
      window.location.href = 'track_error.html';
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาด: ' + err.message);
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = 'ค้นหา';
    }
  }
}

function renderReportDetails(report) {
  const statusMap = {
    pending: { label: 'รอดำเนินการ', class: 'badge-pending' },
    progress: { label: 'กำลังดำเนินการ', class: 'badge-progress' },
    completed: { label: 'เสร็จสิ้น', class: 'badge-completed' }
  };

  const categoryMap = {
    road: { name: 'ถนน/ทางเท้า', icon: '🛣️', color: 'blue' },
    flood: { name: 'น้ำท่วม/ระบายน้ำ', icon: '💧', color: 'blue' },
    electric: { name: 'ไฟฟ้า/แสงสว่าง', icon: '💡', color: 'gold' },
    trash: { name: 'ขยะ/สิ่งแวดล้อม', icon: '🗑️', color: 'green' },
    safety: { name: 'ความปลอดภัย', icon: '🛡️', color: 'red' },
    other: { name: 'อื่นๆ', icon: '📋', color: 'blue' }
  };

  const status = statusMap[report.status] || statusMap.pending;
  const category = categoryMap[report.category] || categoryMap.other;

  return `
    <div class="card">
      <div class="card-body">
        <div class="report-header">
          <div class="report-category-icon card-icon ${category.color}">
            ${category.icon}
          </div>
          <div class="report-header-info">
            <h3>${category.name}</h3>
            <p class="report-id-display">หมายเลข: <strong>${report.id}</strong></p>
          </div>
          <span class="badge ${status.class}">${status.label}</span>
        </div>
        
        <div class="report-details" style="background: var(--gray-50); padding: var(--space-4); border-radius: var(--radius-lg); margin: var(--space-4) 0;">
          <h4 style="margin-bottom: var(--space-4); color: var(--gray-700);">📄 ข้อมูลการแจ้ง</h4>
          
          <div class="detail-item">
            <label>รายละเอียดปัญหา:</label>
            <p>${report.description}</p>
          </div>
          
          <div class="detail-item">
            <label>สถานที่:</label>
            <p>${report.subdistrict || '-'}, ${report.district || '-'} (${report.location})</p>
          </div>
          
          <div class="detail-item">
            <label>วันที่แจ้ง:</label>
            <p>${formatDate(report.createdAt)}</p>
          </div>
          
          ${report.images && report.images.length > 0 ? `
            <div class="detail-item">
              <label>รูปภาพประกอบ:</label>
              <div class="image-preview" style="margin-top: 8px;">
                ${report.images.map(img => `
                  <div class="image-preview-item" style="width: 100px; height: 100px;">
                    <img src="${img}" alt="รูปภาพประกอบ" onclick="window.open('${img}')" style="cursor: pointer;">
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="detail-item">
             <label>ผู้แจ้ง:</label>
             <p>${report.name} (โทร: ${report.phone})</p>
          </div>
        </div>
        
        <h4 class="mt-8 mb-4">สถานะการดำเนินการ</h4>
        <div class="timeline">
          ${(report.timeline || []).map((t, index) => `
            <div class="timeline-item ${index === 0 ? 'active' : ''}">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <p class="timeline-status" style="font-weight: bold; color: var(--primary-600);">${getStatusLabel(t.status)}</p>
                <p class="timeline-message">${t.message}</p>
                <p class="timeline-date" style="font-size: 0.8em; color: var(--gray-400);">${formatDate(t.timestamp)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Load recent reports for track page
function loadRecentReports() {
  const container = document.getElementById('recentReports');
  if (!container) return;

  const recentReports = AppState.reports.slice(0, 5);

  if (recentReports.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 2rem; color: var(--gray-500);">
        <p>ยังไม่มีเรื่องร้องเรียน</p>
      </div>
    `;
    return;
  }

  const categoryMap = {
    road: { name: 'ถนน/ทางเท้า', icon: '🛣️', color: 'blue' },
    flood: { name: 'น้ำท่วม/ระบายน้ำ', icon: '💧', color: 'blue' },
    electric: { name: 'ไฟฟ้า/แสงสว่าง', icon: '💡', color: 'gold' },
    trash: { name: 'ขยะ/สิ่งแวดล้อม', icon: '🗑️', color: 'green' },
    safety: { name: 'ความปลอดภัย', icon: '🛡️', color: 'red' },
    other: { name: 'อื่นๆ', icon: '📋', color: 'blue' }
  };

  const statusMap = {
    pending: { label: 'รอดำเนินการ', class: 'badge-pending' },
    progress: { label: 'กำลังดำเนินการ', class: 'badge-progress' },
    completed: { label: 'เสร็จสิ้น', class: 'badge-completed' }
  };

  container.innerHTML = recentReports.map(report => {
    const category = categoryMap[report.category] || categoryMap.other;
    const status = statusMap[report.status] || statusMap.pending;

    return `
      <div class="report-item" onclick="window.location.href='track.html?id=${report.id}'">
        <div class="report-category-icon card-icon ${category.color}">
          ${category.icon}
        </div>
        <div class="report-info">
          <p class="report-title">${report.description.substring(0, 50)}${report.description.length > 50 ? '...' : ''}</p>
          <div class="report-meta">
            <span>${report.id}</span>
            <span>${formatDate(report.createdAt)}</span>
          </div>
        </div>
        <div class="report-status">
          <span class="badge ${status.class}">${status.label}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ===================================
// Stats Counter Animation
// ===================================
function initStatsAnimation() {
  const stats = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const value = parseInt(target.dataset.value) || 0;
        animateCounter(target, value);
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString('th-TH');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString('th-TH');
    }
  }, 30);
}

// ===================================
// Initialize App
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initReportForm();
  initTrackPage();
  initStatsAnimation();
  loadRecentReports();

  // Add smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

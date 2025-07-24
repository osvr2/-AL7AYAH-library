// تكوين GitHub - يجب استبدال هذه القيم بمعلوماتك الخاصة
const GITHUB_USER = 'your_github_username'; // استبدل باسم مستخدم GitHub الخاص بك
const REPO = 'your_repository_name'; // استبدل باسم المستودع الخاص بك
const DATA_FILE = 'data/books.json'; // تأكد من صحة مسار الملف

// عناصر DOM
const booksContainer = document.getElementById('booksList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryBtns = document.querySelectorAll('.category-btn');

// دالة محسنة لجلب البيانات مع تحسين معالجة الأخطاء
async function fetchBooks() {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/main/${DATA_FILE}?t=${Date.now()}`, 
      { cache: 'no-store' } // لمنع التخزين المؤقت
    );
    
    if (!response.ok) {
      throw new Error(`خطأ في جلب البيانات: ${response.status}`);
    }
    
    const books = await response.json();
    
    // التحقق من صحة هيكل البيانات
    if (!Array.isArray(books)) {
      throw new Error('هيكل البيانات غير صالح، يجب أن يكون مصفوفة');
    }
    
    return books;
    
  } catch (error) {
    console.error('حدث خطأ:', error);
    showErrorToUser('تعذر تحميل الكتب، يرجى المحاولة لاحقاً');
    return [];
  }
}

// دالة عرض الكتب مع تحسينات الأداء
function renderBooks(books) {
  if (!books || books.length === 0) {
    booksContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <p>لا توجد كتب متاحة للعرض</p>
      </div>
    `;
    return;
  }

  // إنشاء عناصر DOM بشكل أكثر كفاءة
  const fragment = document.createDocumentFragment();
  
  books.forEach(book => {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.innerHTML = `
      <div class="book-cover">${book.cover || '📚'}</div>
      <div class="book-info">
        <h3>${book.title || 'بدون عنوان'}</h3>
        <p>${book.author || 'مؤلف غير معروف'}</p>
        <span class="book-category">${book.category || 'غير مصنف'}</span>
      </div>
    `;
    fragment.appendChild(bookCard);
  });
  
  booksContainer.innerHTML = '';
  booksContainer.appendChild(fragment);
}

// دالة تصفية محسنة مع دعم البحث غير الحساس لحالة الأحرف
function filterBooks(books, searchTerm, category) {
  if (!books || !Array.isArray(books)) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return books.filter(book => {
    try {
      const matchesSearch = 
        (book.title && book.title.toLowerCase().includes(lowerSearchTerm)) ||
        (book.author && book.author.toLowerCase().includes(lowerSearchTerm)) ||
        (book.number && book.number.toString().includes(searchTerm));
        
      const matchesCategory = 
        category === 'all' || 
        (book.category && book.category.toLowerCase() === category.toLowerCase());
        
      return matchesSearch && matchesCategory;
    } catch (e) {
      console.error('Error filtering book:', book, e);
      return false;
    }
  });
}

// دالة لعرض الأخطاء للمستخدم
function showErrorToUser(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    <span>${message}</span>
  `;
  
  // إضافة الرسالة في مكان مناسب بالواجهة
  const header = document.querySelector('header');
  if (header) {
    header.insertAdjacentElement('afterend', errorDiv);
  }
  
  // إزالة الرسالة بعد 5 ثواني
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// تهيئة الصفحة مع تحسينات
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // عرض حالة التحميل
    booksContainer.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>جاري تحميل الكتب...</p>
      </div>
    `;
    
    const books = await fetchBooks();
    
    // عرض الكتب بعد التحميل
    renderBooks(books);
    
    // إعداد مستمعي الأحداث
    setupEventListeners(books);
    
  } catch (error) {
    console.error('حدث خطأ في التهيئة:', error);
    showErrorToUser('حدث خطأ في تحميل الصفحة');
  }
});

// دالة منفصلة لإعداد مستمعي الأحداث
function setupEventListeners(books) {
  // البحث عند الضغط على زر البحث
  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const filtered = filterBooks(books, searchTerm, activeCategory);
    renderBooks(filtered);
  });
  
  // البحث عند الضغط على Enter
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
  
  // تصفية حسب التصنيف
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      categoryBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      searchBtn.click();
    });
  });
}
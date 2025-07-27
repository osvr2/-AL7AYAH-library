const GITHUB_USER = 'osvr2';
const REPO = '-AL7AYA-library';
const DATA_FILE = 'data/books.json';
const TOKEN = process.env.GITHUB_TOKEN;

const bookForm = document.getElementById('book-form');
const booksList = document.getElementById('booksList');
const submitBtn = document.getElementById('submit-btn');
let editingBookId = null;

// جلب الكتب
async function fetchBooks() {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${DATA_FILE}`, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch books');

    const data = await response.json();
    return JSON.parse(atob(data.content));
  } catch (error) {
    console.error('Error fetching books:', error);
    showAlert('حدث خطأ في جلب البيانات', 'error');
    return [];
  }
}

// حفظ الكتب
async function saveBooks(books) {
  try {
    const fileInfo = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${DATA_FILE}`, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const { sha } = await fileInfo.json();

    const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${DATA_FILE}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update books data',
        content: btoa(JSON.stringify(books, null, 2)),
        sha: sha
      })
    });

    if (!response.ok) throw new Error('Failed to save books');

    showAlert('تم حفظ التغييرات بنجاح', 'success');
    return true;
  } catch (error) {
    console.error('Error saving books:', error);
    showAlert('حدث خطأ في حفظ البيانات', 'error');
    return false;
  }
}

// عرض الكتب
function renderAdminBooks(books) {
  booksList.innerHTML = books.map(book => `
    <div class="book-item">
      <div>
        <h4>${book.title}</h4>
        <small>${book.author} - ${book.category}</small>
      </div>
      <div class="book-actions">
        <button class="edit-btn" data-id="${book.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-btn" data-id="${book.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editBook(btn.dataset.id, books));
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteBook(btn.dataset.id, books));
  });
}

// تحرير كتاب
function editBook(id, books) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  document.getElementById('title').value = book.title;
  document.getElementById('author').value = book.author;
  document.getElementById('bookCode').value = book.bookCode;
  document.getElementById('copies').value = book.copies;
  document.getElementById('category').value = book.category;

  editingBookId = id;
  submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث';
  submitBtn.scrollIntoView({ behavior: 'smooth' });
}

// حذف كتاب
async function deleteBook(id, books) {
  if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;

  const updatedBooks = books.filter(book => book.id !== id);
  const success = await saveBooks(updatedBooks);

  if (success) {
    const books = await fetchBooks();
    renderAdminBooks(books);
  }
}

// التنبيه
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${type}`;
  alertDiv.innerHTML = `${message} <button class="close-alert">&times;</button>`;
  document.body.prepend(alertDiv);

  alertDiv.querySelector('.close-alert').addEventListener('click', () => {
    alertDiv.remove();
  });

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// نقطة البداية
document.addEventListener('DOMContentLoaded', async () => {
  const books = await fetchBooks();
  renderAdminBooks(books);

  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const book = {
      id: editingBookId || Date.now().toString(),
      title: document.getElementById('title').value,
      author: document.getElementById('author').value,
      bookCode: document.getElementById('bookCode').value,
      copies: document.getElementById('copies').value,
      category: document.getElementById('category').value,
      cover: '📘'
    };

    const currentBooks = await fetchBooks();
    let updatedBooks;

    if (editingBookId) {
      updatedBooks = currentBooks.map(b => b.id === editingBookId ? book : b);
    } else {
      updatedBooks = [...currentBooks, book];
    }

    const success = await saveBooks(updatedBooks);
    console.log('Save Success:', success);

    if (success) {
      bookForm.reset();
      editingBookId = null;
      submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';

      const books = await fetchBooks();
      renderAdminBooks(books);
    }
  });
});

const API_URL = '/api/books';

// State
let books = [];
let genres = [];
let allTags = [];
let currentTags = [];
let previewTags = [];
let editingBookId = null;
let deleteBookId = null;
let html5QrCode = null;
let isScanning = false;

// DOM Elements
const booksGrid = document.getElementById('booksGrid');
const emptyState = document.getElementById('emptyState');
const bookStats = document.getElementById('bookStats');
const bookModal = document.getElementById('bookModal');
const deleteModal = document.getElementById('deleteModal');
const bookForm = document.getElementById('bookForm');
const modalTitle = document.getElementById('modalTitle');
const tagsContainer = document.getElementById('tagsContainer');
const tagsInput = document.getElementById('tagsInput');
const imagePreview = document.getElementById('imagePreview');
const genreFilter = document.getElementById('genreFilter');
const tagFilter = document.getElementById('tagFilter');
const genreList = document.getElementById('genreList');
const deleteBookTitle = document.getElementById('deleteBookTitle');
const filtersPanel = document.getElementById('filtersPanel');
const filterToggleBtn = document.getElementById('filterToggleBtn');
const scanModal = document.getElementById('scanModal');
const previewModal = document.getElementById('previewModal');
const scanStatus = document.getElementById('scanStatus');
const previewForm = document.getElementById('previewForm');
const previewTagsContainer = document.getElementById('previewTagsContainer');
const previewTagsInput = document.getElementById('previewTagsInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  loadFilters();
  setupEventListeners();
});

function setupEventListeners() {
  // Filter toggle
  filterToggleBtn.addEventListener('click', toggleFilters);

  // Add book button
  document.getElementById('addBookBtn').addEventListener('click', () => openModal());

  // Modal controls
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  bookModal.querySelector('.modal__overlay').addEventListener('click', closeModal);

  // Delete modal controls
  document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
  deleteModal.querySelector('.modal__overlay').addEventListener('click', closeDeleteModal);

  // Form submit
  bookForm.addEventListener('submit', handleSubmit);

  // Tags input
  tagsInput.addEventListener('keydown', handleTagInput);

  // Image preview
  document.getElementById('coverImage').addEventListener('change', handleImageChange);

  // Filters
  document.getElementById('searchInput').addEventListener('input', debounce(loadBooks, 300));
  genreFilter.addEventListener('change', loadBooks);
  document.getElementById('statusFilter').addEventListener('change', loadBooks);
  document.getElementById('signedFilter').addEventListener('change', loadBooks);
  tagFilter.addEventListener('change', loadBooks);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

  // Scan ISBN button
  document.getElementById('scanIsbnBtn').addEventListener('click', openScanModal);

  // Scan modal controls
  document.getElementById('closeScanModal').addEventListener('click', closeScanModal);
  scanModal.querySelector('.modal__overlay').addEventListener('click', closeScanModal);

  // Preview modal controls
  document.getElementById('closePreviewModal').addEventListener('click', closePreviewModal);
  document.getElementById('cancelPreviewBtn').addEventListener('click', closePreviewModal);
  previewModal.querySelector('.modal__overlay').addEventListener('click', closePreviewModal);
  previewForm.addEventListener('submit', handlePreviewSubmit);
  previewTagsInput.addEventListener('keydown', handlePreviewTagInput);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDeleteModal();
      closeScanModal();
      closePreviewModal();
    }
  });
}

// API Functions
async function loadBooks() {
  const params = new URLSearchParams();

  const search = document.getElementById('searchInput').value;
  const genre = genreFilter.value;
  const status = document.getElementById('statusFilter').value;
  const signed = document.getElementById('signedFilter').value;
  const tag = tagFilter.value;

  if (search) params.append('search', search);
  if (genre) params.append('genre', genre);
  if (status) params.append('read_status', status);
  if (signed) params.append('is_signed', signed);
  if (tag) params.append('tag', tag);

  try {
    const response = await fetch(`${API_URL}?${params}`);
    books = await response.json();
    renderBooks();
  } catch (error) {
    console.error('Error loading books:', error);
  }
}

async function loadFilters() {
  try {
    const [genresRes, tagsRes] = await Promise.all([
      fetch(`${API_URL}/meta/genres`),
      fetch(`${API_URL}/meta/tags`)
    ]);

    genres = await genresRes.json();
    allTags = await tagsRes.json();

    updateGenreFilter();
    updateTagFilter();
  } catch (error) {
    console.error('Error loading filters:', error);
  }
}

async function saveBook(formData) {
  const url = editingBookId ? `${API_URL}/${editingBookId}` : API_URL;
  const method = editingBookId ? 'PUT' : 'POST';

  const response = await fetch(url, { method, body: formData });

  if (!response.ok) {
    throw new Error('Failed to save book');
  }

  return response.json();
}

async function deleteBook(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error('Failed to delete book');
  }
}

// Render Functions
function renderBooks() {
  if (books.length === 0) {
    booksGrid.innerHTML = '';
    emptyState.classList.add('visible');
    bookStats.textContent = '';
    return;
  }

  emptyState.classList.remove('visible');
  bookStats.textContent = `${books.length} book${books.length !== 1 ? 's' : ''} in collection`;

  booksGrid.innerHTML = books.map((book, index) => `
    <article class="book-card" style="animation-delay: ${index * 0.05}s" data-id="${book.id}">
      <div class="book-card__cover">
        ${book.cover_image
      ? `<img src="${book.cover_image}" alt="${escapeHtml(book.title)}" loading="lazy">`
      : `<span class="book-card__cover-placeholder">📖</span>`
    }
        ${book.is_signed ? '<span class="book-card__signed">Signed</span>' : ''}
      </div>
      <div class="book-card__body">
        <h3 class="book-card__title">${escapeHtml(book.title)}</h3>
        <p class="book-card__author">${escapeHtml(book.author)}</p>
        <div class="book-card__meta">
          ${book.genre ? `<span class="book-card__genre">${escapeHtml(book.genre)}</span>` : ''}
          <span class="book-card__status book-card__status--${book.read_status}">${formatStatus(book.read_status)}</span>
        </div>
        ${book.tags.length > 0 ? `
          <div class="book-card__tags">
            ${book.tags.slice(0, 3).map(tag => `<span class="book-card__tag">${escapeHtml(tag)}</span>`).join('')}
            ${book.tags.length > 3 ? `<span class="book-card__tag">+${book.tags.length - 3}</span>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="book-card__actions">
        <button class="btn btn--secondary" onclick="event.stopPropagation(); openModal(${book.id})">Edit</button>
        <button class="btn btn--danger" onclick="event.stopPropagation(); openDeleteModal(${book.id}, '${escapeHtml(book.title).replace(/'/g, "\\'")}')">Delete</button>
      </div>
    </article>
  `).join('');
}

function updateGenreFilter() {
  genreFilter.innerHTML = '<option value="">All Genres</option>' +
    genres.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');

  genreList.innerHTML = genres.map(g => `<option value="${escapeHtml(g)}">`).join('');
}

function updateTagFilter() {
  tagFilter.innerHTML = '<option value="">All Tags</option>' +
    allTags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function renderTags() {
  tagsContainer.innerHTML = currentTags.map(tag => `
    <span class="tag">
      ${escapeHtml(tag)}
      <span class="tag__remove" onclick="removeTag('${escapeHtml(tag)}')">&times;</span>
    </span>
  `).join('');
}

// Modal Functions
function openModal(bookId = null) {
  editingBookId = bookId;
  modalTitle.textContent = bookId ? 'Edit Book' : 'Add Book';
  bookForm.reset();
  currentTags = [];
  imagePreview.innerHTML = '';

  if (bookId) {
    const book = books.find(b => b.id === bookId);
    if (book) {
      document.getElementById('bookId').value = book.id;
      document.getElementById('title').value = book.title;
      document.getElementById('author').value = book.author;
      document.getElementById('genre').value = book.genre || '';
      document.getElementById('readStatus').value = book.read_status;
      document.getElementById('isSigned').checked = book.is_signed;
      currentTags = [...book.tags];

      if (book.cover_image) {
        imagePreview.innerHTML = `<img src="${book.cover_image}" alt="Current cover">`;
      }
    }
  }

  renderTags();
  bookModal.classList.add('open');
  document.getElementById('title').focus();
}

function closeModal() {
  bookModal.classList.remove('open');
  editingBookId = null;
  currentTags = [];
}

function openDeleteModal(id, title) {
  deleteBookId = id;
  deleteBookTitle.textContent = title;
  deleteModal.classList.add('open');
}

function closeDeleteModal() {
  deleteModal.classList.remove('open');
  deleteBookId = null;
}

// Form Handlers
async function handleSubmit(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('author', document.getElementById('author').value);
  formData.append('genre', document.getElementById('genre').value);
  formData.append('read_status', document.getElementById('readStatus').value);
  formData.append('is_signed', document.getElementById('isSigned').checked);
  formData.append('tags', JSON.stringify(currentTags));

  const coverInput = document.getElementById('coverImage');
  if (coverInput.files[0]) {
    formData.append('cover_image', coverInput.files[0]);
  }

  try {
    await saveBook(formData);
    closeModal();
    loadBooks();
    loadFilters();
  } catch (error) {
    console.error('Error saving book:', error);
    alert('Failed to save book. Please try again.');
  }
}

async function confirmDelete() {
  if (!deleteBookId) return;

  try {
    await deleteBook(deleteBookId);
    closeDeleteModal();
    loadBooks();
    loadFilters();
  } catch (error) {
    console.error('Error deleting book:', error);
    alert('Failed to delete book. Please try again.');
  }
}

function handleTagInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const tag = tagsInput.value.trim();

    if (tag && !currentTags.includes(tag)) {
      currentTags.push(tag);
      renderTags();
    }

    tagsInput.value = '';
  }
}

function removeTag(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderTags();
}

function handleImageChange(e) {
  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = '';
  }
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  genreFilter.value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('signedFilter').value = '';
  tagFilter.value = '';
  loadBooks();
}

function toggleFilters() {
  filtersPanel.classList.toggle('open');
  filterToggleBtn.classList.toggle('active');
}

// Utility Functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatStatus(status) {
  const labels = {
    unread: 'Unread',
    reading: 'Reading',
    read: 'Read'
  };
  return labels[status] || status;
}

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Scan Modal Functions
function openScanModal() {
  scanModal.classList.add('open');
  scanStatus.textContent = '';
  scanStatus.className = 'scan__status';
  startScanner();
}

function closeScanModal() {
  stopScanner();
  scanModal.classList.remove('open');
}

async function startScanner() {
  if (isScanning) return;

  try {
    html5QrCode = new Html5Qrcode('scanReader');
    isScanning = true;

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      },
      onScanSuccess,
      () => { } // Ignore scan failures
    );
  } catch (error) {
    console.error('Scanner error:', error);
    scanStatus.textContent = 'Camera access denied or not available';
    scanStatus.className = 'scan__status scan__status--error';
    isScanning = false;
  }
}

async function stopScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    isScanning = false;
  }
}

async function onScanSuccess(decodedText) {
  // Stop scanner immediately
  await stopScanner();

  scanStatus.textContent = `Found ISBN: ${decodedText}. Looking up...`;
  scanStatus.className = 'scan__status scan__status--loading';

  try {
    const response = await fetch(`/api/isbn/${decodedText}`);

    if (!response.ok) {
      throw new Error('Book not found');
    }

    const bookData = await response.json();

    scanStatus.textContent = 'Book found!';
    scanStatus.className = 'scan__status scan__status--success';

    // Close scan modal and open preview
    setTimeout(() => {
      closeScanModal();
      openPreviewModal(bookData);
    }, 500);
  } catch (error) {
    console.error('ISBN lookup error:', error);
    scanStatus.textContent = 'Book not found. Try again or add manually.';
    scanStatus.className = 'scan__status scan__status--error';

    // Restart scanner after delay
    setTimeout(() => {
      if (scanModal.classList.contains('open')) {
        startScanner();
      }
    }, 2000);
  }
}

// Preview Modal Functions
function openPreviewModal(bookData) {
  previewTags = [];
  previewForm.reset();

  document.getElementById('previewIsbn').value = bookData.isbn || '';
  document.getElementById('previewCoverPath').value = bookData.cover_image || '';
  document.getElementById('previewTitle').value = bookData.title || '';
  document.getElementById('previewAuthor').value = bookData.author || '';
  document.getElementById('previewGenre').value = bookData.genre || '';

  // Handle cover image
  const coverImg = document.getElementById('previewCover');
  const coverPlaceholder = document.getElementById('previewCoverPlaceholder');

  if (bookData.cover_image) {
    coverImg.src = bookData.cover_image;
    coverImg.classList.add('visible');
  } else {
    coverImg.classList.remove('visible');
    coverImg.src = '';
  }

  renderPreviewTags();
  previewModal.classList.add('open');
  document.getElementById('previewTitle').focus();
}

function closePreviewModal() {
  previewModal.classList.remove('open');
  previewTags = [];
}

function renderPreviewTags() {
  previewTagsContainer.innerHTML = previewTags.map(tag => `
    <span class="tag">
      ${escapeHtml(tag)}
      <span class="tag__remove" onclick="removePreviewTag('${escapeHtml(tag)}')">&times;</span>
    </span>
  `).join('');
}

function handlePreviewTagInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const tag = previewTagsInput.value.trim();

    if (tag && !previewTags.includes(tag)) {
      previewTags.push(tag);
      renderPreviewTags();
    }

    previewTagsInput.value = '';
  }
}

function removePreviewTag(tag) {
  previewTags = previewTags.filter(t => t !== tag);
  renderPreviewTags();
}

async function handlePreviewSubmit(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('title', document.getElementById('previewTitle').value);
  formData.append('author', document.getElementById('previewAuthor').value);
  formData.append('genre', document.getElementById('previewGenre').value);
  formData.append('read_status', document.getElementById('previewReadStatus').value);
  formData.append('is_signed', document.getElementById('previewIsSigned').checked);
  formData.append('tags', JSON.stringify(previewTags));

  // Use the cover path from ISBN lookup (already saved on server)
  const coverPath = document.getElementById('previewCoverPath').value;
  if (coverPath) {
    formData.append('cover_image', coverPath);
  }

  try {
    await saveBookFromPreview(formData);
    closePreviewModal();
    loadBooks();
    loadFilters();
  } catch (error) {
    console.error('Error saving book:', error);
    alert('Failed to save book. Please try again.');
  }
}

async function saveBookFromPreview(formData) {
  // Convert FormData to JSON for this endpoint since we're not uploading a file
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  // The cover is already saved, we just need to pass the path
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      author: data.author,
      genre: data.genre || null,
      read_status: data.read_status,
      is_signed: data.is_signed === 'true',
      tags: data.tags,
      cover_image: data.cover_image || null
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save book');
  }

  return response.json();
}

// Make functions available globally for inline handlers
window.openModal = openModal;
window.openDeleteModal = openDeleteModal;
window.removeTag = removeTag;
window.removePreviewTag = removePreviewTag;


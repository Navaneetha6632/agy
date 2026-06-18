// State Management
let notesData = [];
let selectedNote = null;
let selectedDate = '';
let selectedLink = '';
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const notesFeed = document.getElementById('notes-feed');
const btnRefresh = document.getElementById('btn-refresh');
const spinnerIcon = document.getElementById('spinner-icon');
const btnTheme = document.getElementById('btn-theme');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const filterChips = document.getElementById('filter-chips');
const composerSidebar = document.getElementById('composer-sidebar');
const btnCloseComposer = document.getElementById('btn-close-composer');
const tweetTextarea = document.getElementById('tweet-textarea');
const twitterPreviewText = document.getElementById('twitter-preview-text');
const charCountText = document.getElementById('char-count');
const progressCircle = document.querySelector('.progress-ring__circle');
const btnTweet = document.getElementById('btn-tweet');
const btnCopy = document.getElementById('btn-copy');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// Progress Circle Constants
const CIRCLE_RADIUS = 8;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// Initialize Progress Circle
if (progressCircle) {
    progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
}

// Create Backdrop overlay for mobile sidebar
const backdrop = document.createElement('div');
backdrop.className = 'composer-backdrop';
document.body.appendChild(backdrop);

// Page Load Setup
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleaseNotes();
    setupEventListeners();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Switched to ${newTheme} mode`, 'sun');
}

// Event Listeners
function setupEventListeners() {
    // Theme Toggle
    btnTheme.addEventListener('click', toggleTheme);

    // Refresh Release Notes
    btnRefresh.addEventListener('click', fetchReleaseNotes);

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        searchClear.style.display = searchQuery.length > 0 ? 'flex' : 'none';
        renderFeed();
    });

    // Clear Search
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        searchInput.focus();
        renderFeed();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // '/' focuses search
        if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== tweetTextarea) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        // ESC clears search or closes panels
        if (e.key === 'Escape') {
            if (document.activeElement === searchInput) {
                searchInput.blur();
            } else if (composerSidebar.classList.contains('open')) {
                closeComposer();
            }
        }
    });

    // Filter Chips
    filterChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        // Toggle active chip style
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        currentFilter = chip.getAttribute('data-type');
        renderFeed();
    });

    // Close Sidebar (Mobile)
    btnCloseComposer.addEventListener('click', closeComposer);
    backdrop.addEventListener('click', closeComposer);

    // Textarea Editing events
    tweetTextarea.addEventListener('input', () => {
        updateTweetState();
    });

    // Twitter Web Intent
    btnTweet.addEventListener('click', shareOnTwitter);

    // Copy to Clipboard
    btnCopy.addEventListener('click', copyToClipboard);

    // Tweet helper tools
    document.getElementById('tool-auto').addEventListener('click', autoFormatTweet);
    document.getElementById('tool-tags').addEventListener('click', addHashtags);
    document.getElementById('tool-link').addEventListener('click', addSourceLink);
    document.getElementById('tool-shorten').addEventListener('click', shortenTweetText);
}

// Fetch Release Notes from API
async function fetchReleaseNotes() {
    btnRefresh.disabled = true;
    spinnerIcon.classList.add('spinning');
    
    // Show Skeletons
    notesFeed.innerHTML = `
        <div class="skeleton-entry">
            <div class="skeleton-title"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
        <div class="skeleton-entry">
            <div class="skeleton-title"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();

        if (data.status === 'success') {
            notesData = data.notes;
            renderFeed();
            showToast('Release notes loaded successfully', 'check-circle');
        } else {
            renderError(data.message || 'Failed to fetch release notes.');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        renderError('Connection error: Unable to contact the local Flask server.');
    } finally {
        btnRefresh.disabled = false;
        spinnerIcon.classList.remove('spinning');
        lucide.createIcons();
    }
}

// Render Error Screen in Feed
function renderError(message) {
    notesFeed.innerHTML = `
        <div class="error-state">
            <i data-lucide="alert-octagon"></i>
            <h3>Unable to Load Release Notes</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="fetchReleaseNotes()">
                <i data-lucide="refresh-cw"></i> Retry
            </button>
        </div>
    `;
}

// Render filtered/searched list of notes
function renderFeed() {
    notesFeed.innerHTML = '';
    
    let renderedCount = 0;

    notesData.forEach(entry => {
        // Filter updates inside the entry
        const filteredUpdates = entry.updates.filter(update => {
            const matchesType = currentFilter === 'all' || update.type === currentFilter;
            const matchesSearch = searchQuery === '' || 
                                  update.text.toLowerCase().includes(searchQuery) ||
                                  update.type.toLowerCase().includes(searchQuery) ||
                                  entry.date.toLowerCase().includes(searchQuery);
            return matchesType && matchesSearch;
        });

        if (filteredUpdates.length === 0) return;

        renderedCount += filteredUpdates.length;

        // Group Container
        const dayGroup = document.createElement('div');
        dayGroup.className = 'day-group';

        // Header for Date Group
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <div class="day-date">${entry.date}</div>
            <div class="day-line"></div>
        `;
        dayGroup.appendChild(dayHeader);

        // List container
        const listContainer = document.createElement('div');
        listContainer.className = 'day-notes-list';

        // Render matched update cards
        filteredUpdates.forEach(update => {
            const card = document.createElement('div');
            // Class name based on type
            const typeClass = `type-${update.type.toLowerCase()}`;
            const isSelected = selectedNote && selectedNote.id === update.id && selectedDate === entry.date;
            
            card.className = `update-card ${typeClass} ${isSelected ? 'selected' : ''}`;
            card.dataset.id = update.id;
            card.dataset.date = entry.date;
            
            card.innerHTML = `
                <div class="card-meta">
                    <span class="badge badge-${update.type.toLowerCase()}">
                        ${getBadgeIcon(update.type)} ${update.type}
                    </span>
                    ${entry.link ? `
                        <a href="${entry.link}" target="_blank" class="card-link" title="Open official notes link">
                            <span>Open Notes</span> <i data-lucide="external-link"></i>
                        </a>
                    ` : ''}
                </div>
                <div class="card-content">
                    ${update.html}
                </div>
                <button class="btn-select-indicator">
                    <i data-lucide="${isSelected ? 'check-circle-2' : 'twitter'}"></i>
                    <span>${isSelected ? 'Selected' : 'Select for Tweet'}</span>
                </button>
            `;

            // Card click behavior
            card.addEventListener('click', (e) => {
                // Ignore clicks on links
                if (e.target.closest('.card-link') || e.target.closest('a')) return;
                selectUpdate(update, entry.date, entry.link);
            });

            listContainer.appendChild(card);
        });

        dayGroup.appendChild(listContainer);
        notesFeed.appendChild(dayGroup);
    });

    if (renderedCount === 0) {
        renderEmptyState();
    }

    lucide.createIcons();
}

// Map types to beautiful Lucide badge icons
function getBadgeIcon(type) {
    switch(type) {
        case 'Feature': return '<i data-lucide="plus-circle" style="width:12px;height:12px;"></i>';
        case 'Announcement': return '<i data-lucide="megaphone" style="width:12px;height:12px;"></i>';
        case 'Breaking': return '<i data-lucide="alert-triangle" style="width:12px;height:12px;"></i>';
        case 'Change': return '<i data-lucide="git-commit" style="width:12px;height:12px;"></i>';
        case 'Issue': return '<i data-lucide="bug" style="width:12px;height:12px;"></i>';
        default: return '<i data-lucide="info" style="width:12px;height:12px;"></i>';
    }
}

// Render Empty Screen
function renderEmptyState() {
    notesFeed.innerHTML = `
        <div class="empty-state">
            <i data-lucide="folder-search"></i>
            <h3>No Updates Match Your Criteria</h3>
            <p>Try clearing your search terms or selecting a different update type filter chip.</p>
            <button class="btn btn-secondary" id="btn-clear-filters">
                Reset Filters
            </button>
        </div>
    `;
    
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        currentFilter = 'all';
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.chip[data-type="all"]').classList.add('active');
        renderFeed();
    });
}

// Select an Update Card
function selectUpdate(update, date, link) {
    // If clicking already selected card, deselect it
    if (selectedNote && selectedNote.id === update.id && selectedDate === date) {
        selectedNote = null;
        selectedDate = '';
        selectedLink = '';
        
        document.querySelectorAll('.update-card').forEach(card => card.classList.remove('selected'));
        tweetTextarea.value = '';
        updateTweetState();
        closeComposer();
        return;
    }

    selectedNote = update;
    selectedDate = date;
    selectedLink = link;

    // Toggle active state classes in UI
    document.querySelectorAll('.update-card').forEach(card => {
        const isCurrent = card.dataset.id === update.id && card.dataset.date === date;
        card.classList.toggle('selected', isCurrent);
        
        const indicatorBtn = card.querySelector('.btn-select-indicator');
        if (indicatorBtn) {
            indicatorBtn.innerHTML = isCurrent 
                ? '<i data-lucide="check-circle-2"></i> Selected' 
                : '<i data-lucide="twitter"></i> Select for Tweet';
        }
    });

    // Auto draft text
    autoFormatTweet();
    openComposer();
    
    showToast(`Selected update from ${date}`, 'twitter');
    lucide.createIcons();
}

// Open / Close Composer Panel on mobile
function openComposer() {
    composerSidebar.classList.add('open');
    backdrop.classList.add('active');
}

function closeComposer() {
    composerSidebar.classList.remove('open');
    backdrop.classList.remove('active');
}

// Tweet state & previews & character calculations
function updateTweetState() {
    const text = tweetTextarea.value;
    
    // Update live visual mockup card
    if (text.trim() === '') {
        twitterPreviewText.innerText = "Select a release note card to start drafting your Tweet.";
        twitterPreviewText.style.opacity = 0.5;
    } else {
        twitterPreviewText.innerText = text;
        twitterPreviewText.style.opacity = 1;
    }

    // Characters count
    const charCount = text.length;
    const remaining = 280 - charCount;
    charCountText.innerText = remaining;
    
    // Circle progress indicator calculations
    const percent = Math.min(100, (charCount / 280) * 100);
    const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
    
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = offset;
        
        // Colors warning threshold
        if (remaining < 0) {
            progressCircle.style.stroke = '#f4212e'; // Red
            charCountText.style.color = '#f4212e';
        } else if (remaining <= 20) {
            progressCircle.style.stroke = '#ffd400'; // Yellow/Orange
            charCountText.style.color = '#ffd400';
        } else {
            progressCircle.style.stroke = '#1da1f2'; // Twitter Blue
            charCountText.style.color = 'var(--text-muted)';
        }
    }

    // Disable tweet button if empty or exceeds X limits
    if (text.trim() === '' || remaining < 0) {
        btnTweet.disabled = true;
        btnTweet.style.opacity = 0.5;
        btnTweet.style.cursor = 'not-allowed';
    } else {
        btnTweet.disabled = false;
        btnTweet.style.opacity = 1;
        btnTweet.style.cursor = 'pointer';
    }
}

// Tweet Helpers
function autoFormatTweet() {
    if (!selectedNote) {
        showToast('Please select a release note update first', 'alert-circle');
        return;
    }

    const maxTextLen = 170; // safe limit to fit within 280 characters with metadata
    let cleanText = selectedNote.text;
    
    if (cleanText.length > maxTextLen) {
        cleanText = cleanText.substring(0, maxTextLen - 3) + '...';
    }

    // Draft tweet structure
    tweetTextarea.value = `BigQuery Update (${selectedNote.type} - ${selectedDate}):\n\n${cleanText}\n\n#GoogleCloud #BigQuery`;
    
    updateTweetState();
}

function addHashtags() {
    const defaultTags = '\n\n#GoogleCloud #BigQuery #DataAnalytics';
    if (!tweetTextarea.value.includes('#BigQuery')) {
        tweetTextarea.value = tweetTextarea.value.trim() + defaultTags;
        updateTweetState();
        showToast('Added hashtags', 'hash');
    } else {
        showToast('Hashtags already present', 'info');
    }
}

function addSourceLink() {
    if (!selectedLink) {
        showToast('No source link available for this update', 'alert-circle');
        return;
    }
    
    if (!tweetTextarea.value.includes(selectedLink)) {
        tweetTextarea.value = tweetTextarea.value.trim() + `\n\nSource: ${selectedLink}`;
        updateTweetState();
        showToast('Added source URL', 'link');
    } else {
        showToast('Source link already present', 'info');
    }
}

function shortenTweetText() {
    let text = tweetTextarea.value;
    if (text.length <= 280) {
        showToast('Tweet is already within 280 character limit', 'info');
        return;
    }

    // Split text by tags/link
    const lines = text.split('\n');
    let contentMain = '';
    let attachments = [];

    // Separate main content from tags and links (which are usually at the bottom)
    lines.forEach(line => {
        if (line.includes('#') || line.toLowerCase().includes('source:') || line.startsWith('http')) {
            attachments.push(line);
        } else {
            contentMain += (contentMain ? '\n' : '') + line;
        }
    });

    const attachmentsStr = attachments.join('\n');
    const safetyLimit = 280 - (attachmentsStr ? attachmentsStr.length + 2 : 0);
    
    if (contentMain.length > safetyLimit) {
        contentMain = contentMain.substring(0, safetyLimit - 3) + '...';
    }

    tweetTextarea.value = attachmentsStr 
        ? `${contentMain}\n\n${attachmentsStr}` 
        : contentMain;

    updateTweetState();
    showToast('Shortened draft to fit X limits', 'scissors');
}

// Share on Twitter (Web intent)
function shareOnTwitter() {
    const text = tweetTextarea.value.trim();
    if (text === '') return;
    
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
}

// Copy to Clipboard
function copyToClipboard() {
    const text = tweetTextarea.value.trim();
    if (text === '') {
        showToast('Nothing to copy', 'alert-circle');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied draft to clipboard!', 'check-circle');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy to clipboard', 'x-circle');
    });
}

// Toast Notifications Helper
let toastTimeout;
function showToast(message, iconName = 'info') {
    clearTimeout(toastTimeout);
    
    toastMessage.innerText = message;
    toastIcon.setAttribute('data-lucide', iconName);
    lucide.createIcons(); // render the new icon
    
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

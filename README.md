# BigQuery Release Notes Explorer & Tweet Composer

A sleek, responsive, and modern web application built using **Python Flask**, **Vanilla HTML5**, **CSS3**, and **JavaScript** that fetches, parses, and displays Google Cloud BigQuery release notes. It also allows you to draft, format, and share updates on Twitter/X with a single click.

---

## 🚀 Key Features

* **Real-time RSS/Atom Fetching**: Automatically pulls live updates from the official Google Cloud BigQuery Release Notes feed.
* **Granular Updates Separation**: Uses backend regex parsing to separate single feed entries (which often list multiple features, issues, or announcements) into individual, interactive cards.
* **Interactive Tweet Composer**:
  * **X (Twitter) Visual Preview**: Features a live preview card that mirrors an actual X post format (avatar, handle, metrics, and actions).
  * **Live Character Count Progress**: Standard progress bar ring that warns you when approaching the 280-character limit (Blue $\rightarrow$ Orange $\rightarrow$ Red).
  * **Utility Text Editors**: Buttons to auto-format text into a tweet, append default Google Cloud hashtags, inject source notes links, or automatically shorten long text.
* **Instant Client-side Filter & Search**:
  * Filter updates by type: `Features`, `Announcements`, `Changes`, `Breaking`, or `Issues`.
  * Instantly query dates, headers, or body text with fuzzy search (press `/` to focus search bar).
* **Double Theme Support**: Sleek, glowing glassmorphic dark theme (default) and a clean, high-contrast light theme.
* **Responsive Layout**: Adapts gracefully to all viewports. The composer panel collapses into a smooth, slide-in overlay drawer on mobile and tablet screens.

---

## 🛠️ Technology Stack

* **Backend**: Python, Flask, `xml.etree.ElementTree` (XML parsing)
* **Frontend**: HTML5, Vanilla CSS3 (custom CSS variables & keyframe animations), Vanilla JS
* **Design & Icons**: Google Fonts (Outfit & Inter), Lucide Icons

---

## 📦 Installation & Setup

### Prerequisites
* Python 3.8 or higher
* Git

### Step-by-Step Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Navaneetha6632/agy.git
   cd agy
   ```

2. **Set up a Virtual Environment (Recommended)**
   ```bash
   python -m venv .venv
   # On Windows (Command Prompt/PowerShell):
   .venv\Scripts\Activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install Flask
   ```

4. **Run the Application**
   ```bash
   python app.py
   ```
   Open your browser and navigate to `http://127.0.0.1:5000`.

---

## 📁 Project Structure

```text
bigquery-release-notes-app/
│
├── app.py                 # Flask server & XML parser
├── README.md              # Project documentation
├── .gitignore             # Git exclusions
│
├── templates/
│   └── index.html         # Main dashboard markup
│
└── static/
    ├── css/
    │   └── style.css      # Theme variables, layouts, and skeleton loaders
    └── js/
        └── main.js        # Search, filters, tweet composer, clipboard controls
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

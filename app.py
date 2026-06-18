import os
import re
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_html_content(html_content):
    """Parses HTML release note content into sub-updates by matching <h3> tags."""
    if not html_content:
        return []
    
    # Split content by <h3>Header</h3>.
    # The split result alternates: [before_first, header1, body1, header2, body2, ...]
    parts = re.split(r'<h3>(.*?)</h3>', html_content)
    
    if len(parts) < 3:
        # If there's no <h3>, treat the entire content as one general update.
        plain_text = re.sub(r'<[^>]+>', '', html_content).strip()
        plain_text = re.sub(r'\s+', ' ', plain_text)
        return [{
            'id': 'general',
            'type': 'General',
            'html': html_content,
            'text': plain_text
        }]
    
    updates = []
    # parts[0] is text before first h3, typically empty or whitespace
    counter = 0
    for i in range(1, len(parts), 2):
        if i + 1 < len(parts):
            header = parts[i].strip()
            body = parts[i+1].strip()
            
            # Extract plain text for tweet generation (stripping HTML tags)
            plain_text = re.sub(r'<[^>]+>', '', body).strip()
            plain_text = re.sub(r'\s+', ' ', plain_text)
            
            updates.append({
                'id': f'{header.lower()}-{counter}',
                'type': header,
                'html': body,
                'text': plain_text
            })
            counter += 1
            
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        # Fetch the RSS/Atom feed from Google Cloud docs
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
            
        # Parse XML
        root = ET.fromstring(xml_data)
        
        # Atom namespaces
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        notes = []
        for entry in root.findall('atom:entry', namespace):
            title_el = entry.find('atom:title', namespace)
            id_el = entry.find('atom:id', namespace)
            updated_el = entry.find('atom:updated', namespace)
            
            # Find the link with rel="alternate"
            link = ""
            for l in entry.findall('atom:link', namespace):
                if l.attrib.get('rel') == 'alternate':
                    link = l.attrib.get('href', '')
                    break
            if not link:
                link_el = entry.find('atom:link', namespace)
                if link_el is not None:
                    link = link_el.attrib.get('href', '')
            
            content_el = entry.find('atom:content', namespace)
            
            title = title_el.text if title_el is not None else ""
            entry_id = id_el.text if id_el is not None else ""
            updated = updated_el.text if updated_el is not None else ""
            content_html = content_el.text if content_el is not None else ""
            
            updates = parse_html_content(content_html)
            
            notes.append({
                'date': title,
                'id': entry_id,
                'updated': updated,
                'link': link,
                'updates': updates
            })
            
        return jsonify({
            'status': 'success',
            'notes': notes
        })
        
    except urllib.error.URLError as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch release notes: {str(e.reason)}'
        }), 502
    except ET.ParseError as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to parse release notes XML: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'An unexpected error occurred: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

import sqlite3
import os
from flask import Flask, render_template, request, g, jsonify
from datetime import datetime

# Create Flask application
app = Flask(__name__)
app.config['DATABASE'] = os.path.join(app.instance_path, 'notes.db')

# Ensure the instance folder exists
os.makedirs(app.instance_path, exist_ok=True)

# Database connection helper functions
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# Initialize database schema
def init_db():
    db = get_db()
    with app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))

# Command to initialize the database
@app.cli.command('init-db')
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    print('Initialized the database.')

# Register close_db function with the application
app.teardown_appcontext(close_db)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/notes', methods=['GET'])
def get_notes():
    db = get_db()
    notes = db.execute('SELECT * FROM notes ORDER BY created DESC').fetchall()
    result = []
    for note in notes:
        result.append({
            'id': note['id'],
            'content': note['content'],
            'comment': note['comment'],
            'created': note['created']
        })
    return jsonify(result)

@app.route('/notes', methods=['POST'])
def add_note():
    content = request.json.get('content')
    comment = request.json.get('comment')
    
    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    db = get_db()
    db.execute(
        'INSERT INTO notes (content, comment, created) VALUES (?, ?, ?)',
        (content, comment, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    db.commit()
    
    return jsonify({'success': True}), 201

@app.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    secret_key = request.json.get('secret_key')
    
    if not secret_key or secret_key != "delete":
        return jsonify({'error': 'Invalid secret key'}), 403
    
    db = get_db()
    db.execute('DELETE FROM notes WHERE id = ?', (note_id,))
    db.commit()
    
    return jsonify({'success': True}), 200

# Run the application
if __name__ == '__main__':
    app.run(debug=True)

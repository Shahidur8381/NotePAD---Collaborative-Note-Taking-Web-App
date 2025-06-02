document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const notesList = document.getElementById('notes-list');
    const noteContent = document.getElementById('note-content');
    const noteComment = document.getElementById('note-comment');
    const addNoteBtn = document.getElementById('add-note-btn');

    // Load all notes when page loads
    loadNotes();

    // Add event listener to the add note button
    addNoteBtn.addEventListener('click', addNote);

    // Function to load all notes
    function loadNotes() {
        fetch('/notes')
            .then(response => response.json())
            .then(notes => {
                notesList.innerHTML = '';
                
                if (notes.length === 0) {
                    notesList.innerHTML = '<p class="no-notes">No notes yet. Add your first note!</p>';
                    return;
                }
                
                notes.forEach(note => {
                    const noteElement = document.createElement('div');
                    noteElement.className = 'note';
                    noteElement.innerHTML = `
                        <p class="note-content">${escapeHtml(note.content)}</p>
                        ${note.comment ? `<p class="note-comment">${escapeHtml(note.comment)}</p>` : ''}
                        <p class="note-date">${formatDate(note.created)}</p>
                    `;
                    notesList.appendChild(noteElement);
                });
            })
            .catch(error => {
                console.error('Error loading notes:', error);
                notesList.innerHTML = '<p class="error">Error loading notes. Please try again later.</p>';
            });
    }

    // Function to add a new note
    function addNote() {
        const content = noteContent.value.trim();
        const comment = noteComment.value.trim();
        
        if (!content) {
            alert('Note content cannot be empty!');
            return;
        }
        
        fetch('/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content,
                comment: comment
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear form fields
                noteContent.value = '';
                noteComment.value = '';
                
                // Reload notes to show the new one
                loadNotes();
            } else {
                alert('Error: ' + (data.error || 'Failed to add note'));
            }
        })
        .catch(error => {
            console.error('Error adding note:', error);
            alert('Failed to add note. Please try again.');
        });
    }

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
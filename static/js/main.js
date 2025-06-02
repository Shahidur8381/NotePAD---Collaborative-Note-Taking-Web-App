document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const notesList = document.getElementById('notes-list');
    const noteContent = document.getElementById('note-content');
    const noteComment = document.getElementById('note-comment');
    const addNoteBtn = document.getElementById('add-note-btn');
    const deleteModal = document.getElementById('delete-modal');
    const secretKeyInput = document.getElementById('secret-key');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const closeModalBtn = document.querySelector('.close');
    
    // Variable to store the ID of the note to be deleted
    let noteToDeleteId = null;

    // Load all notes when page loads
    loadNotes();

    // Add event listener to the add note button
    addNoteBtn.addEventListener('click', addNote);
    
    // Modal event listeners
    cancelDeleteBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === deleteModal) {
            closeModal();
        }
    });

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
                        <button class="delete-btn" data-id="${note.id}">Delete</button>
                    `;
                    notesList.appendChild(noteElement);
                    
                    // Add event listener to the delete button
                    const deleteBtn = noteElement.querySelector('.delete-btn');
                    deleteBtn.addEventListener('click', function() {
                        openDeleteModal(note.id);
                    });
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
    
    // Function to open the delete modal
    function openDeleteModal(noteId) {
        noteToDeleteId = noteId;
        secretKeyInput.value = '';
        deleteModal.style.display = 'block';
    }
    
    // Function to close the delete modal
    function closeModal() {
        deleteModal.style.display = 'none';
        noteToDeleteId = null;
    }
    
    // Function to confirm and execute note deletion
    function confirmDelete() {
        const secretKey = secretKeyInput.value.trim();
        
        if (!secretKey) {
            alert('Please enter the secret key');
            return;
        }
        
        fetch(`/notes/${noteToDeleteId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret_key: secretKey
            })
        })
        .then(response => {
            if (response.status === 403) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Invalid secret key');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                closeModal();
                loadNotes();
            } else {
                alert('Error: ' + (data.error || 'Failed to delete note'));
            }
        })
        .catch(error => {
            console.error('Error deleting note:', error);
            alert(error.message || 'Failed to delete note. Please try again.');
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

const API_URL = 'http://192.168.249.133:30500/api/notes';

async function loadNotes() {
  const res = await fetch(API_URL);
  const notes = await res.json();
  const list = document.getElementById('notesList');
  list.innerHTML = '';
  notes.forEach(note => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${note.text}</span><span class="delete-btn" onclick="deleteNote('${note._id}')">✕</span>`;
    list.appendChild(li);
  });
}

async function addNote() {
  const input = document.getElementById('noteInput');
  if (!input.value.trim()) return;
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.value })
  });
  input.value = '';
  loadNotes();
}

async function deleteNote(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  loadNotes();
}

loadNotes();

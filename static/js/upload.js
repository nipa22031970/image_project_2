const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const resultBox = document.getElementById('resultBox');
const resultLink = document.getElementById('resultLink');
const copyBtn = document.getElementById('copyBtn');
const imagesList = document.getElementById('imagesList');

// === КЛІК ПО РАМЦІ === 
dropArea.addEventListener('click', () => fileInput.click());

// === DRAG & DROP ===
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    dropArea.addEventListener(event, e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(event => {
    dropArea.addEventListener(event, () => dropArea.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(event => {
    dropArea.addEventListener(event, () => dropArea.classList.remove('dragover'), false);
});

dropArea.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length) handleFiles(files);
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFiles(fileInput.files);
});

function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        alert('Файл занадто великий! Максимум 5 МБ.');
        return;
    }
    uploadFile(file);
}

// === ЗАВАНТАЖЕННЯ ===
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.ok) {
            resultLink.value = location.origin + data.url;
            resultBox.style.display = 'flex';
            loadImages(); // Оновлюємо список
        } else {
            alert('Помилка: ' + (data.detail || 'Невідома'));
        }
    } catch (err) {
        alert('Помилка мережі');
    }
}

// === КОПІЮВАННЯ ===
copyBtn.addEventListener('click', () => {
    resultLink.select();
    navigator.clipboard.writeText(resultLink.value);
    copyBtn.textContent = 'СКОПІЙОВАНО!';
    setTimeout(() => copyBtn.textContent = 'КОПІЮВАТИ', 2000);
});

// === СПИСОК ЗОБРАЖЕНЬ ===
async function loadImages() {
    try {
        const res = await fetch('/upload');
        const files = await res.json();

        if (files.length === 0) {
            imagesList.innerHTML = '<p style="color:#666;">Немає зображень</p>';
            return;
        }

        let html = `
        <table>
            <tr style="background:#f8f9fa;">
                <th>Назва</th>
                <th>Посилання</th>
                <th>Дія</th>
            </tr>
        `;

        files.forEach(f => {
            html += `
                <tr>
                    <td>${f.filename}</td>
                    <td><a href="${f.url}" target="_blank" style="color:#667eea;">Відкрити</a></td>
                    <td><button onclick="deleteImage('${f.filename}')">Видалити</button></td>
                </tr>
            `;
        });

        html += `</table>`;
        imagesList.innerHTML = html;
    } catch (err) {
        imagesList.innerHTML = '<p style="color:red;">Помилка</p>';
    }
}

async function deleteImage(filename) {
    if (!confirm(`Видалити ${filename}?`)) return;
    try {
        const res = await fetch(`/upload/${filename}`, { method: 'DELETE' });
        if (res.ok) loadImages();
    } catch (err) {
        alert('Помилка видалення');
    }
}

// Завантажуємо список при старті
loadImages();
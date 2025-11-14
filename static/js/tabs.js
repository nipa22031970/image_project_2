// === ВКЛАДКИ ===
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Знімаємо active з усіх
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Ховаємо весь контент
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

        // Показуємо потрібний
        const target = document.getElementById(tab.dataset.tab + '-tab');
        if (target) {
            target.classList.remove('hidden');
        }

        // Якщо відкрили "Зображення" — завантажуємо список
        if (tab.dataset.tab === 'images') {
            loadImages();
        }
    });
});

// === ЗАВАНТАЖЕННЯ СПИСКУ ЗОБРАЖЕНЬ ===
async function loadImages() {
    const container = document.getElementById('imagesList');
    if (!container) return;

    try {
        const response = await fetch('/upload');
        const files = await response.json();

        if (files.length === 0) {
            container.innerHTML = '<p style="color:#666; text-align:center;">Немає зображень</p>';
            return;
        }

        let html = `
        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <thead>
                <tr style="background:#f8f9fa;">
                    <th style="padding:12px; text-align:left;">Назва</th>
                    <th style="padding:12px; text-align:left;">Посилання</th>
                    <th style="padding:12px; text-align:left;">Дія</th>
                </tr>
            </thead>
            <tbody>
        `;

        files.forEach(f => {
            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px;">${f.filename}</td>
                    <td style="padding:12px;">
                        <a href="${f.url}" target="_blank" style="color:#667eea; text-decoration:none;">Відкрити</a>
                    </td>
                    <td style="padding:12px;">
                        <button onclick="deleteImage('${f.filename}')" 
                                style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">
                            Видалити
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = '<p style="color:red;">Помилка завантаження списку</p>';
    }
}

// === ВИДАЛЕННЯ ===
async function deleteImage(filename) {
    if (!confirm(`Видалити ${filename}?`)) return;

    try {
        const res = await fetch(`/upload/${filename}`, { method: 'DELETE' });
        if (res.ok) {
            loadImages();
        } else {
            alert('Не вдалося видалити');
        }
    } catch (err) {
        alert('Помилка: ' + err.message);
    }
}
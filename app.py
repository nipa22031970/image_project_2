import os
import uuid
import logging
from flask import Flask, request, jsonify, send_from_directory, abort
from werkzeug.utils import secure_filename
from flask_cors import CORS

# === ІНІЦІАЛІЗАЦІЯ ===
app = Flask(__name__)
CORS(app)  # Дозволяє запити з фронтенду

# === НАЛАШТУВАННЯ ПО ТЗ ===
UPLOAD_FOLDER = '/images'
LOG_FILE = '/logs/app.log'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 МБ

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Створюємо папки
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

# === ЛОГУВАННЯ ПО ТЗ ===
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def log_action(action, message):
    logging.info(f"{action}: {message}")

# === ПЕРЕВІРКА ФОРМАТУ ===
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# === МАРШРУТИ ===

@app.route('/')
def index():
    """Головна сторінка"""
    return '''
    <!DOCTYPE html>
    <html lang="uk">
    <head>
        <meta charset="UTF-8">
        <title>Сервер зображень</title>
    </head>
    <body>
        <h1>Сервер зображень працює!</h1>
        <p><a href="/static/index.html">Головна сторінка</a></p>
        <p><a href="/static/upload.html">Завантажити зображення</a></p>
    </body>
    </html>
    '''

@app.route('/upload', methods=['POST'])
def upload_file():
    """Завантаження зображення"""
    if 'file' not in request.files:
        log_action("Помилка", "файл не надіслано")
        return jsonify({"detail": "Файл не надіслано"}), 400

    file = request.files['file']
    if file.filename == '':
        log_action("Помилка", "ім'я файлу порожнє")
        return jsonify({"detail": "Ім'я файлу порожнє"}), 400

    if file and allowed_file(file.filename):
        # Унікальне ім'я
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        file.save(filepath)
        url = f"/images/{filename}"
        
        log_action("Успіх", f"зображення {filename} завантажено")
        return jsonify({"filename": filename, "url": url}), 200
    else:
        log_action("Помилка", f"недопустимий формат або розмір ({file.filename})")
        return jsonify({"detail": "Формат (.jpg, .png, .gif) або розмір >5 МБ"}), 400

@app.route('/upload', methods=['GET'])
def list_files():
    """Список зображень"""
    files = []
    try:
        for f in os.listdir(UPLOAD_FOLDER):
            if os.path.isfile(os.path.join(UPLOAD_FOLDER, f)):
                files.append({"filename": f, "url": f"/images/{f}"})
    except Exception as e:
        print(f"Помилка читання папки: {e}")
    return jsonify(files)

@app.route('/upload/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Видалення зображення"""
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        log_action("Успіх", f"зображення {filename} видалено")
        return '', 204
    else:
        log_action("Помилка", f"файл {filename} не знайдено")
        return jsonify({"detail": "Файл не знайдено"}), 404

@app.route('/static/<path:filename>')
def static_files(filename):
    """Статичні файли (HTML, CSS, JS)"""
    return send_from_directory('static', filename)

# === ЗАПУСК ===
if __name__ == '__main__':
    print("Сервер запущено на http://0.0.0.0:8000")
    app.run(host='0.0.0.0', port=8000, debug=False)
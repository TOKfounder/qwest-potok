const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ВАЖНО: токен Telegram-бота нельзя хранить в коде.
// На Render добавьте переменные окружения:
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_MESSAGE_THREAD_ID.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MESSAGE_THREAD_ID = process.env.TELEGRAM_MESSAGE_THREAD_ID;

const APPLICATIONS_FILE = path.join(__dirname, 'bookings.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

function ensureApplicationsFile() {
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify([], null, 2));
  }
}

function readApplications() {
  ensureApplicationsFile();
  const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (error) {
    console.error('Ошибка чтения JSON:', error);
    return [];
  }
}

function writeApplications(applications) {
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowMoscow() {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}

async function sendToTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('Telegram не настроен: добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в переменные окружения');
  }

  const body = {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML'
  };

  if (MESSAGE_THREAD_ID) {
    body.message_thread_id = Number(MESSAGE_THREAD_ID);
  }

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!data.ok) {
    console.error('Telegram API error:', data);
    throw new Error(data.description || 'Telegram API вернул ошибку');
  }

  return data;
}

app.post('/api/applications', async (req, res) => {
  try {
    const { fullName, age, phone, telegram, faculty } = req.body;

    if (![fullName, age, phone, telegram, faculty].every(requiredString)) {
      return res.status(400).json({
        status: 'error',
        message: 'Заполните ФИО, возраст, телефон, Telegram и факультет'
      });
    }

    const ageNumber = Number(String(age).trim());
    if (!Number.isInteger(ageNumber) || ageNumber < 14 || ageNumber > 99) {
      return res.status(400).json({
        status: 'error',
        message: 'Запись с 14 лет'
      });
    }

    const application = {
      id: Date.now().toString(),
      createdAt: nowMoscow(),
      status: 'application_sent',
      application: {
        fullName: fullName.trim(),
        age: age.trim(),
        phone: phone.trim(),
        telegram: telegram.trim(),
        faculty: faculty.trim()
      },
      survey: null,
      surveySubmittedAt: null
    };

    const applications = readApplications();
    applications.push(application);
    writeApplications(applications);

    const message = `
<b>🔥 НОВАЯ ЗАЯВКА В ПОТОК</b>

<b>ID:</b> ${escapeHtml(application.id)}
<b>ФИО:</b> ${escapeHtml(application.application.fullName)}
<b>Возраст:</b> ${escapeHtml(application.application.age)}
<b>Телефон:</b> ${escapeHtml(application.application.phone)}
<b>Telegram:</b> ${escapeHtml(application.application.telegram)}
<b>Факультет:</b> ${escapeHtml(application.application.faculty)}
<b>Дата:</b> ${escapeHtml(application.createdAt)}

<i>Опросник пока не пройден. Ждем второй шаг.</i>
    `.trim();

    await sendToTelegram(message);

    res.json({
      status: 'ok',
      message: 'Заявка отправлена',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Внутренняя ошибка сервера'
    });
  }
});

app.post('/api/survey', async (req, res) => {
  try {
    const { applicationId, answers } = req.body;

    if (!requiredString(applicationId) || !answers) {
      return res.status(400).json({
        status: 'error',
        message: 'Не найдены ID заявки или ответы опросника'
      });
    }

    const requiredAnswers = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
    const hasAllAnswers = requiredAnswers.every((key) => requiredString(answers[key]));

    if (!hasAllAnswers) {
      return res.status(400).json({
        status: 'error',
        message: 'Ответьте на все 5 вопросов'
      });
    }

    const applications = readApplications();
    const index = applications.findIndex((item) => item.id === applicationId.trim());

    if (index === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Заявка не найдена. Отправьте первый шаг еще раз'
      });
    }

    const survey = {
      q1: answers.q1.trim(),
      q2: answers.q2.trim(),
      q3: answers.q3.trim(),
      q4: answers.q4.trim(),
      q5: answers.q5.trim(),
      q6: answers.q6.trim()
    };

    applications[index].survey = survey;
    applications[index].surveySubmittedAt = nowMoscow();
    applications[index].status = 'survey_completed';
    writeApplications(applications);

    const item = applications[index];
    const message = `
<b>🧱 ОПРОСНИК ПО ЗАЯВКЕ В ПОТОК</b>

<b>ID:</b> ${escapeHtml(item.id)}
<b>ФИО:</b> ${escapeHtml(item.application.fullName)}
<b>Телефон:</b> ${escapeHtml(item.application.phone)}
<b>Telegram:</b> ${escapeHtml(item.application.telegram)}
<b>Факультет:</b> ${escapeHtml(item.application.faculty)}
<b>Дата опроса:</b> ${escapeHtml(item.surveySubmittedAt)}

<b>1. Зачем ты хочешь попасть в Поток?</b>
${escapeHtml(survey.q1)}

<b>2. Чему ты хочешь научиться?</b>
${escapeHtml(survey.q2)}

<b>3. Что тебя мотивирует тренироваться и не бросать?</b>
${escapeHtml(survey.q3)}

<b>4. Есть ли у тебя опыт в паркуре, спорте или движении?</b>
${escapeHtml(survey.q4)}

<b>5. Готов ли ты поддерживать проект донатом/взносом? Если да — в каком формате?</b>
${escapeHtml(survey.q5)}

<b>6. Почему именно Поток? Что привело тебя к нам, а не в другое место?</b>
${escapeHtml(survey.q6)}
    `.trim();

    await sendToTelegram(message);

    res.json({
      status: 'ok',
      message: 'Опросник отправлен'
    });
  } catch (error) {
    console.error('Ошибка при отправке опросника:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Внутренняя ошибка сервера'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'potok-backend' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  ensureApplicationsFile();
  console.log(`Сервер запущен на порту ${PORT}`);
});

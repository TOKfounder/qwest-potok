
        // Плавная прокрутка для навигации
        document.querySelectorAll('.nav-links a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Скрытие/появление навигации при прокрутке
        let lastScrollY = window.scrollY;
        const nav = document.getElementById('mainNav');

        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
                // Прокрутка вниз
                nav.classList.add('hidden');
            } else {
                // Прокрутка вверх
                nav.classList.remove('hidden');
            }
            lastScrollY = window.scrollY;
        });

        // Данные для разных возрастных групп
        const trainingData = {
            '7-9': {
                title: 'Программа для 7-9 лет',
                description: `Специально разработанная программа для младших школьников, направленная на развитие логического мышления, teamwork и творческих способностей.
                • Продолжительность: 60 минут
                • Уровень сложности: начальный
                • Развитие социальных навыков
                • Безопасные условия
                • Игровой формат обучения`,
                image:  '<img src="assets/img/training1.jpg" alt="Тренировка для 7-9 лет" style="width:100%; height:100%; object-fit:cover; border-radius:15px;">'
            },
            '10-12': {
                title: 'Программа для 10-12 лет',
                description: `Программа для школьников средних классов с элементами стратегического мышления и решения сложных задач.
                • Продолжительность: 75 минут
                • Уровень сложности: средний
                • Развитие логики и аналитики
                • Командные задания
                • Элементы соревнований`,
                image: '<img src="assets/img/training2.jpg" alt="Фото тренировки для 10-12 лет" style="width:100%; height:100%; object-fit:cover; border-radius:15px;">'
            },
            '12-14': {
                title: 'Программа для 12-14 лет',
                description: `Интенсивная программа для подростков с акцентом на развитие лидерских качеств и стратегического мышления.
                • Продолжительность: 90 минут
                • Уровень сложности: продвинутый
                • Лидерские тренинги
                • Сложные логические задачи
                • Проектная работа`,
                image: '<img src="assets/img/training3.jpg" alt="Фото тренировки для 12-14 лет" style="width:100%; height:100%; object-fit:cover; border-radius:15px;">'
            },
            '14+': {
                title: 'Программа для 14+ лет',
                description: `Профессиональная программа для старшеклассников и взрослых с элементами тимбилдинга и сложными квестами.
                • Продолжительность: 120 минут
                • Уровень сложности: экспертный
                • Сложные сценарии
                • Профессиональный коучинг
                • Корпоративные программы`,
                image: '<img src="assets/img/training4.jpg" alt="Фото тренировки для 14+ лет" style="width:100%; height:100%; object-fit:cover; border-radius:15px;">'
            }
        };

        // Инициализация при загрузке страницы - показываем данные для 7-9 лет
        document.addEventListener('DOMContentLoaded', function() {
            const initialData = trainingData['7-9'];
            document.getElementById('trainingDescription').innerHTML = `
                <h3>${initialData.title}</h3>
                <p>${initialData.description.replace(/\n/g, '</p><p>• ').replace('<p>• ', '<p>• ')}</p>
            `;
            document.getElementById('trainingImage').innerHTML = initialData.image;
        });

        // Переключение возрастных групп
        document.querySelectorAll('.age-group').forEach(group => {
            group.addEventListener('click', function() {
                document.querySelectorAll('.age-group').forEach(g => g.classList.remove('active'));
                this.classList.add('active');
                
                const age = this.getAttribute('data-age');
                const data = trainingData[age];
                
                document.getElementById('trainingDescription').innerHTML = `
                    <h3>${data.title}</h3>
                    <p>${data.description.replace(/\n/g, '</p><p>• ').replace('<p>• ', '<p>• ')}</p>
                `;
                document.getElementById('trainingImage').innerHTML = data.image;
            });
        });

        // Обработка кнопки "Записаться" в шапке - плавный скролл к форме
        document.getElementById('headerBookButton').addEventListener('click', function() {
            document.getElementById('contacts').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });

        // Обработка отправки формы
        document.getElementById('bookingForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Собираем данные формы
            const formData = {
                name: document.getElementById('name').value,
                age: document.getElementById('age').value,
                phone: document.getElementById('phone').value,
                comment: document.getElementById('comment').value,
                date: new Date().toLocaleString('ru-RU')
            };

            // Показываем индикатор загрузки
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Отправка...';
            submitButton.disabled = true;

            // Скрываем предыдущие сообщения
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';

            // Отправляем данные на сервер
            fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Показываем сообщение об успехе
                document.getElementById('successMessage').style.display = 'block';
                
                // Очищаем форму
                document.getElementById('bookingForm').reset();
                
                // Возвращаем кнопку в исходное состояние
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                // Прокручиваем к сообщению об успехе
                document.getElementById('successMessage').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Показываем сообщение об ошибке
                document.getElementById('errorMessage').style.display = 'block';
                
                // Возвращаем кнопку в исходное состояние
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                // Прокручиваем к сообщению об ошибке
                document.getElementById('errorMessage').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
        });

        // Обработка остальных кнопок "Записаться" (если они есть)
        document.querySelectorAll('.cta-button:not(#headerBookButton):not([type="submit"])').forEach(button => {
            button.addEventListener('click', function() {
                document.getElementById('contacts').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
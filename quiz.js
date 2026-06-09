// Модуль тестирования с УНИКАЛЬНЫМИ вариантами для каждого вопроса
class QuizModule {
    constructor(dataSource, progressStorage) {
        this.dataSource = dataSource;
        this.progressStorage = progressStorage;
        this.questions = [];
        this.currentIndex = 0;
        this.userAnswered = false;
    }
    
    init() {
        this.questionElement = document.getElementById('quizQuestion');
        this.optionsContainer = document.getElementById('quizOptions');
        this.explanationContainer = document.getElementById('quizExplanation');
        this.counterElement = document.getElementById('quizCounter');
        
        document.getElementById('nextQuizBtn').addEventListener('click', () => this.next());
        document.getElementById('resetQuizBtn').addEventListener('click', () => this.shuffle());
        
        this.buildQuestions();
        this.shuffle();
    }
    
    // Генерация УНИКАЛЬНЫХ дистракторов для каждого вопроса
    generateUniqueDistractors(questionText, correctAnswer, allQuestions, currentIndex) {
        // База правдоподобных неправильных ответов по темам (расширенная)
        const topicDistractors = {
            "DevTools": [
                "Selenium WebDriver — инструмент автоматизации браузера",
                "TestRail — система управления тестированием",
                "JMeter — инструмент для нагрузочного тестирования",
                "Allure — фреймворк для отчётов о тестировании"
            ],
            "клиент-сервер": [
                "Peer-to-Peer архитектура без центрального сервера",
                "Монолитное приложение на одном сервере",
                "Архитектура сервера приложений Java EE",
                "Файловая система распределённого хранения"
            ],
            "REST": [
                "Протокол SOAP с расширениями WS-*",
                "Технология удалённого вызова процедур gRPC",
                "Фреймворк Apache CXF для веб-сервисов",
                "Протокол AMQP для очередей сообщений"
            ],
            "микросервис": [
                "Монолит с модульной архитектурой",
                "Серверless архитектура AWS Lambda",
                "Контейнеризация с помощью Docker",
                "Оркестрация контейнеров Kubernetes"
            ],
            "API": [
                "Графический интерфейс пользователя (GUI)",
                "Интерфейс командной строки (CLI)",
                "Система управления базами данных (СУБД)",
                "Протокол удалённого рабочего стола (RDP)"
            ],
            "Postman": [
                "Swagger UI — документация и тестирование API",
                "Insomnia — REST и GraphQL клиент",
                "cURL — консольный инструмент для запросов",
                "Paw — нативный клиент для API на macOS"
            ],
            "регрессионное": [
                "Тестирование новой функциональности (Feature testing)",
                "Проверка безопасности приложения (Security testing)",
                "Оценка производительности (Performance testing)",
                "Тестирование удобства использования (Usability testing)"
            ],
            "смоук": [
                "Полное регрессионное тестирование всех модулей",
                "Нагрузочное тестирование с максимальным количеством пользователей",
                "Тестирование безопасности с подбором паролей",
                "UI-тестирование всех страниц приложения"
            ],
            "эквивалентное": [
                "Метод случайного выбора значений (Random testing)",
                "Техника анализа всех комбинаций (All-pairs testing)",
                "Проверка только позитивных сценариев",
                "Метод исключения дублирующихся тестов"
            ],
            "граничных": [
                "Анализ средних значений диапазона",
                "Проверка только валидных данных",
                "Тестирование случайных значений из допустимого диапазона",
                "Проверка только отрицательных сценариев"
            ],
            "SQL": [
                "NoSQL — MongoDB, Cassandra, Redis",
                "Язык программирования Python",
                "Фреймворк для веб-разработки Django",
                "Система контроля версий Git"
            ],
            "аутентификация": [
                "Проверка прав доступа к ресурсам системы",
                "Шифрование данных при передаче по сети",
                "Создание цифровой подписи документа",
                "Резервное копирование пользовательских данных"
            ],
            "авторизация": [
                "Подтверждение подлинности пользователя",
                "Восстановление забытого пароля",
                "Шифрование данных в хранилище",
                "Аудит действий пользователя в системе"
            ]
        };
        
        // Находим подходящие дистракторы
        let allDistractors = [];
        for (let [keyword, dists] of Object.entries(topicDistractors)) {
            if (questionText.toLowerCase().includes(keyword.toLowerCase())) {
                allDistractors = [...dists];
                break;
            }
        }
        
        // Универсальные дистракторы (если тема не найдена)
        const universalDistractors = [
            "Это понятие из области разработки, а не тестирования",
            "Термин относится к автоматизации, а не к ручному тестированию",
            "Определение из смежной области знаний (DevOps)",
            "Этот термин связан с управлением проектами (PM)",
            "Понятие из анализа требований (BA)",
            "Термин относится к администрированию систем",
            "Это определение из базы данных и SQL",
            "Термин из области информационной безопасности",
            "Понятие из веб-разработки и фронтенда",
            "Это относится к CI/CD и автоматизации сборки"
        ];
        
        if (allDistractors.length === 0) {
            allDistractors = [...universalDistractors];
        }
        
        // Перемешиваем и берём 3 уникальных
        let shuffled = shuffleArray([...allDistractors]);
        let uniqueDistractors = [];
        
        for (let d of shuffled) {
            if (d !== correctAnswer && !uniqueDistractors.includes(d) && uniqueDistractors.length < 3) {
                uniqueDistractors.push(d);
            }
        }
        
        // Если не хватает, добавляем из универсальных с подменой
        let fallbackIndex = 0;
        while (uniqueDistractors.length < 3) {
            let candidate = universalDistractors[fallbackIndex % universalDistractors.length];
            if (!uniqueDistractors.includes(candidate) && candidate !== correctAnswer) {
                uniqueDistractors.push(candidate);
            }
            fallbackIndex++;
        }
        
        return uniqueDistractors;
    }
    
    buildQuestions() {
        const db = this.dataSource();
        
        this.questions = db.map((card, idx) => {
            // Генерируем 3 уникальных дистрактора
            let distractors = this.generateUniqueDistractors(
                card.question, 
                card.answer, 
                db, 
                idx
            );
            
            let options = [card.answer, ...distractors];
            options = shuffleArray(options);
            const correctIndex = options.findIndex(opt => opt === card.answer);
            
            return {
                id: Math.random() + idx, // уникальный ID
                question: card.question,
                options: options,
                correctIndex: correctIndex,
                shortAnswer: card.answer,
                explanation: this.getDetailedExplanation(card.question, card.answer)
            };
        });
        
        this.addAllOfTheAboveQuestions();
    }
    
    addAllOfTheAboveQuestions() {
        const allAboveQuestions = [
            {
                question: "Что должен уметь ручной тестировщик?",
                correctAnswer: "Всё перечисленное верно",
                parts: ["Писать тест-кейсы и чек-листы", "Работать с баг-трекинговыми системами", "Тестировать API через Postman"],
                explanation: "Профессиональный тестировщик сочетает все эти навыки."
            },
            {
                question: "Что относится к обязанностям QA-инженера?",
                correctAnswer: "Все перечисленные варианты",
                parts: ["Анализ требований к продукту", "Написание тестовой документации", "Выполнение функционального тестирования"],
                explanation: "QA охватывает весь цикл: от анализа требований до выполнения тестов."
            },
            {
                question: "Какие инструменты используют тестировщики?",
                correctAnswer: "Всё перечисленное",
                parts: ["Postman для API", "Charles/Fiddler для проксирования", "DevTools для отладки"],
                explanation: "Современный тестировщик владеет разными инструментами."
            },
            {
                question: "Что относится к видам тестирования по времени выполнения?",
                correctAnswer: "Все перечисленные",
                parts: ["Регрессионное тестирование", "Смоук-тестирование", "Санитарное тестирование"],
                explanation: "Эти виды различаются по объёму: смоук — минимум, санитарное — быстрая проверка, регресс — полная перепроверка."
            },
            {
                question: "Что относится к техникам тест-дизайна?",
                correctAnswer: "Всё перечисленное",
                parts: ["Эквивалентное разделение", "Анализ граничных значений", "Попарное тестирование"],
                explanation: "Все эти техники помогают эффективно покрыть функционал."
            },
            {
                question: "Что входит в качественный баг-репорт?",
                correctAnswer: "Всё перечисленное верно",
                parts: ["Шаги воспроизведения и результат", "Окружение и версию приложения", "Серьёзность и приоритет"],
                explanation: "Хороший баг-репорт содержит все эти поля."
            },
            {
                question: "Что относится к HTTP-методам REST API?",
                correctAnswer: "Все перечисленные",
                parts: ["GET и POST", "PUT и DELETE", "PATCH и OPTIONS"],
                explanation: "REST API использует все эти методы для CRUD-операций."
            },
            {
                question: "Какие статус-коды относятся к ошибкам клиента (4xx)?",
                correctAnswer: "Все перечисленные",
                parts: ["400 Bad Request", "401 Unauthorized", "404 Not Found"],
                explanation: "4xx коды — ошибки на стороне клиента."
            },
            {
                question: "Что относится к основным принципам тестирования?",
                correctAnswer: "Всё перечисленное",
                parts: ["Исчерпывающее тестирование невозможно", "Дефекты кластеризуются", "Тестирование зависит от контекста"],
                explanation: "Это три из семи принципов тестирования по ISTQB."
            }
        ];
        
        allAboveQuestions.forEach((item, idx) => {
            // Генерируем дистракторы для вопроса типа "всё перечисленное"
            let partsCopy = [...item.parts];
            let distractors = [];
            
            // Создаём правдоподобные неправильные варианты
            const fakeParts = [
                ["Написание кода на Java", "Работа с Docker", "Настройка CI/CD"],
                ["Дизайн интерфейсов", "Вёрстка страниц", "SEO оптимизация"],
                ["Selenium IDE", "Appium", "Cypress"],
                ["Модульное тестирование", "Интеграционное тестирование", "Нагрузочное тестирование"]
            ];
            
            let fakeSet = fakeParts[idx % fakeParts.length];
            distractors = [...fakeSet];
            
            let options = [...item.parts, item.correctAnswer];
            options = shuffleArray([...options, ...distractors.slice(0, 2)]);
            
            const correctIndex = options.findIndex(opt => opt === item.correctAnswer);
            const partsList = item.parts.map(p => `✓ ${p}`).join('<br>');
            
            this.questions.push({
                id: Math.random() + idx + 1000,
                question: item.question,
                options: options,
                correctIndex: correctIndex,
                shortAnswer: item.correctAnswer,
                explanation: `${item.explanation}<br><br><strong>Правильные пункты:</strong><br>${partsList}`,
                isAllAbove: true
            });
        });
        
        // Перемешиваем общий массив
        this.questions = shuffleArray(this.questions);
    }
    
    getDetailedExplanation(question, answer) {
        const explanations = {
            "DevTools": "DevTools (F12) — встроенный инструмент браузера для отладки, анализа сети и проверки вёрстки. Не путайте с Selenium, TestRail или JMeter — это другие инструменты.",
            "пирамида тестирования": "Пирамида тестирования рекомендует много модульных тестов, меньше интеграционных и ещё меньше UI/E2E.",
            "7 принципов": "Семь принципов тестирования по ISTQB — основа профессионального подхода.",
            "аутентификация": "Аутентификация отвечает на вопрос 'кто ты?', авторизация — 'что тебе можно?', верификация — 'соответствует ли требованиям?'.",
            "симулятор эмулятор": "Симулятор имитирует поведение (мягко), эмулятор — аппаратуру (жёстко)."
        };
        
        for (let [key, exp] of Object.entries(explanations)) {
            if (question.toLowerCase().includes(key.toLowerCase())) {
                return exp;
            }
        }
        
        return `${answer} — правильный ответ. ${question.substring(0, 50)} — важная тема для собеседования.`;
    }
    
    shuffle() {
        this.questions = shuffleArray([...this.questions]);
        this.currentIndex = 0;
        this.loadCurrent();
    }
    
    loadCurrent() {
        if (!this.questions.length) return;
        const q = this.questions[this.currentIndex];
        this.questionElement.innerHTML = q.question;
        this.optionsContainer.innerHTML = '';
        
        this.userAnswered = false;
        this.explanationContainer.innerHTML = '';
        
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = `${String.fromCharCode(65 + idx)}. ${opt}`;
            btn.addEventListener('click', () => this.handleAnswer(idx));
            this.optionsContainer.appendChild(btn);
        });
        
        this.counterElement.innerText = `Вопрос ${this.currentIndex + 1} из ${this.questions.length}`;
        this.updateProgressUI();
    }
    
    handleAnswer(selectedIdx) {
        if (this.userAnswered) return;
        
        const currentQ = this.questions[this.currentIndex];
        const isCorrect = (selectedIdx === currentQ.correctIndex);
        this.userAnswered = true;
        
        let explanationHtml = '';
        if (isCorrect) {
            explanationHtml = `
                <div class="explanation-box">
                    <div class="result-badge correct">✅ Верно!</div>
                    <p>${currentQ.explanation}</p>
                </div>
            `;
            this.progressStorage.addCorrect();
        } else {
            const correctAnswerText = currentQ.options[currentQ.correctIndex];
            explanationHtml = `
                <div class="explanation-box">
                    <div class="result-badge wrong">❌ Неправильно</div>
                    <p><strong>Правильный ответ:</strong> ${correctAnswerText}</p>
                    <p>📘 <strong>Почему:</strong> ${currentQ.explanation}</p>
                </div>
            `;
            this.progressStorage.addWrong();
        }
        
        this.explanationContainer.innerHTML = explanationHtml;
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
        });
        
        this.updateProgressUI();
    }
    
    next() {
        if (!this.questions.length) return;
        this.currentIndex = (this.currentIndex + 1) % this.questions.length;
        this.loadCurrent();
    }
    
    updateProgressUI() {
        const stats = this.progressStorage.getStats();
        const totalElement = document.getElementById('correctStats');
        const fillElement = document.getElementById('progressFill');
        const percentElement = document.getElementById('percentLabel');
        
        if (totalElement) totalElement.innerHTML = `✅ ${stats.correct} / ${stats.total}`;
        if (fillElement) fillElement.style.width = `${stats.percent}%`;
        if (percentElement) percentElement.innerHTML = `📈 ${Math.round(stats.percent)}% правильных ответов`;
    }
}

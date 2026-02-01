// ============================================
// ФАЙЛ: app.js
// ГЛАВНЫЙ КОНТРОЛЛЕР ПРИЛОЖЕНИЯ
// ============================================

console.log('Zamdir System v0.1.0 загружается...');

// Основная функция инициализации
async function initApp() {
    console.log('Инициализация приложения...');
    
    const statusEl = document.getElementById('db-status');
    
    try {
        // 1. Проверяем загрузку библиотек
        console.log('Проверка библиотек:', {
            Dexie: typeof Dexie,
            Gantt: typeof Gantt
        });
        
        if (typeof Dexie === 'undefined') {
            throw new Error('Библиотека Dexie не загрузилась');
        }
        
        // 2. Открываем базу данных
        await db.open();
        console.log('База данных открыта');
        
        // 3. Инициализируем кастомный Гант
        const gantt = window.ganttManager.init();
        if (gantt) {
            console.log('Кастомный Гант создан');
            statusEl.innerHTML = '✅ Система готова (кастомный Гант)';
        } else {
            console.warn('Не удалось создать кастомный Гант');
            statusEl.innerHTML = '⚠️ Система готова (Гант не загружен)';
        }
        // 3.1. Загружаем все заявки из БД на Гант
        if (window.modalManager && window.modalManager.loadAllDealsToGantt) {
            await window.modalManager.loadAllDealsToGantt();
        }
        
        statusEl.style.color = '#4CAF50';
        
        // 4. Загружаем тестовые данные
        await loadDemoData();
        
        // 5. Настраиваем интерфейс
        setupNavigation();
        
        // 6. Инициализируем модальные окна
        if (window.modalManager) {
            window.modalManager.init();
        }
        
        // 7. Настраиваем кнопку "Новая заявка"
        const newDealBtn = document.getElementById('btn-new-deal');
        if (newDealBtn) {
            newDealBtn.addEventListener('click', function() {
                if (window.modalManager && window.modalManager.openDealModal) {
                    window.modalManager.openDealModal();
                } else {
                    alert('Модуль модальных окон не загружен');
                }
            });
        }
        
        // 8. Обновляем счетчики
        await updateCounters();
        
        console.log('Приложение успешно инициализировано');
        
    } catch (error) {
        console.error('Критическая ошибка инициализации:', error);
        statusEl.textContent = `❌ Ошибка: ${error.message}`;
        statusEl.style.color = '#ff3d00';
    }
}

// Загрузка демо-данных
async function loadDemoData() {
    try {
        // Проверяем, есть ли уже заявки
        const dealsCount = await db.deals.count();
        
        if (dealsCount === 0) {
            console.log('Создаем тестовые данные...');
            
            // Создаем тестовый шаблон
            const templateId = await db.templates.add({
                name: 'Базовый шаблон',
                description: 'Шаблон для демонстрации работы системы',
                createdAt: new Date()
            });
            
            // Создаем тестовую заявку
            const dealId = await db.deals.add({
                code: '26-00001',
                applicant: 'ООО "Тестовый заказчик"',
                templateId: templateId,
                createdAt: new Date(),
                isFrozen: false
            });
            
            console.log('Созданы тестовые данные: шаблон ID', templateId, 'и заявка ID', dealId);
        } else {
            console.log('Тестовые данные уже существуют:', dealsCount, 'заявок');
        }
        
    } catch (error) {
        console.error('Ошибка создания тестовых данных:', error);
    }
}

// Настройка навигации
function setupNavigation() {
    console.log('Настройка навигации...');
    
    // Переключение между вкладками
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewId = this.getAttribute('data-view');
            
            // Снимаем активный класс со всех кнопок и вью
            navButtons.forEach(btn => btn.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));
            
            // Добавляем активный класс текущим
            this.classList.add('active');
            document.getElementById(`view-${viewId}`).classList.add('active');
            
            console.log('Переключено на вкладку:', viewId);
        });
    });
    
    // Кнопка "Новый шаблон"
    const newTemplateBtn = document.getElementById('btn-new-template');
    if (newTemplateBtn) {
        newTemplateBtn.addEventListener('click', function() {
            console.log('Открытие редактора шаблонов');
            alert('Редактор шаблонов появится в следующей итерации');
            // TODO: Открыть редактор шаблонов
        });
    }
    
    // Переключатели периода для задач
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const period = this.getAttribute('data-period');
            console.log('Выбран период:', period);
            // TODO: Фильтровать задачи по периоду
        });
    });
    
    console.log('Навигация настроена');
}

// Обновление счетчиков
async function updateCounters() {
    try {
        const dealsCount = await db.deals.count();
        const tasksCount = await db.tasks.count();
        
        const dealsEl = document.getElementById('deals-count');
        const tasksEl = document.getElementById('tasks-count');
        
        if (dealsEl) dealsEl.textContent = dealsCount;
        if (tasksEl) tasksEl.textContent = tasksCount;
        
        // Анимация обновления
        if (dealsEl) {
            dealsEl.style.transform = 'scale(1.2)';
            setTimeout(() => dealsEl.style.transform = 'scale(1)', 300);
        }
        
        console.log('Счетчики обновлены:', { dealsCount, tasksCount });
        
        // Проверка в консоли
        console.log('Текущие заявки в БД:');
        const allDeals = await db.deals.toArray();
        allDeals.forEach(deal => {
            console.log(`- ${deal.code}: ${deal.applicant} (ID: ${deal.id})`);
        });
        
    } catch (error) {
        console.error('Ошибка обновления счетчиков:', error);
    }
}

// Запуск приложения после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, запускаем инициализацию...');
    initApp();
});

// Делаем функции доступными глобально для отладки
window.app = {
    init: initApp,
    loadDemoData: loadDemoData,
    updateCounters: updateCounters,
    db: db
};

console.log('Модуль app загружен');
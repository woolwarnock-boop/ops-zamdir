// ============================================
// ФАЙЛ: db.js
// БАЗА ДАННЫХ (IndexedDB через Dexie.js)
// ============================================

console.log('Загрузка базы данных...');

// Создаем базу данных
const db = new Dexie('ZamdirDB_v1');

// Определяем структуру таблиц (схему)
db.version(1).stores({
    deals: '++id, code, applicant, templateId, createdAt, isFrozen',
    templates: '++id, name, description, createdAt',
    tasks: '++id, dealId, templateTaskId, name, role, stage, startDate, endDate, realHours, progress, status, dependsOn, lag',
    templateTasks: '++id, templateId, name, role, stage, defaultDuration, realHours, dependsOn, lag',
    roles: '++id, name, color, capacity',
    stages: '++id, name, color, order'
});

// Наполняем начальными данными при первом запуске
db.on('populate', async function() {
    console.log('Первоначальное наполнение базы данных...');
    
    // Добавляем роли из ТЗ
    await db.roles.bulkAdd([
        { name: 'Директор', color: '#FF6B6B', capacity: 8 },
        { name: 'Заместитель директора', color: '#4ECDC4', capacity: 8 },
        { name: 'Снабженец', color: '#45B7D1', capacity: 8 },
        { name: 'Помощник', color: '#96CEB4', capacity: 8 },
        { name: 'Бригадир', color: '#FFEAA7', capacity: 8 },
        { name: 'Проектировщик', color: '#DDA0DD', capacity: 8 },
        { name: 'Сметчик', color: '#98D8C8', capacity: 8 },
        { name: 'Внешний контур', color: '#B2B2B2', capacity: 0 }
    ]);
    
    // Добавляем этапы
    await db.stages.bulkAdd([
        { name: 'Инициализация', color: '#4285F4', order: 1 },
        { name: 'Планирование', color: '#34A853', order: 2 },
        { name: 'Выполнение', color: '#FBBC05', order: 3 },
        { name: 'Контроль', color: '#EA4335', order: 4 },
        { name: 'Завершение', color: '#8A2BE2', order: 5 }
    ]);
    
    console.log('База данных наполнена начальными данными');
});

// Открываем базу данных
db.open()
    .then(function() {
        console.log('База данных успешно открыта');
    })
    .catch(function(error) {
        console.error('Ошибка открытия базы данных:', error);
    });

// Делаем базу доступной глобально
window.db = db;
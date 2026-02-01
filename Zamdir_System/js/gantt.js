// ============================================ 
// ФАЙЛ: gantt.js
// УЛЬТРАКОМПАКТНЫЙ КАСТОМНЫЙ ГАНТ
// ============================================

console.log('Загрузка ультракомпактного кастомного Ганта...');

// Глобальные переменные
let currentView = 'month30'; // month30, month60, quarter120
let currentStartDate = new Date();
let daysToShow = 30;
let cellWidth = 30;
let tooltip = null;

// Конфигурация видов
const VIEWS = {
    month30: {
        name: '30 дней',
        days: 30,
        minCellWidth: 24,
        showDayName: true,
        showMonthInCell: true,
        compact: false
    },
    month60: {
        name: '60 дней',
        days: 60,
        minCellWidth: 12,
        showDayName: false,
        showMonthInCell: false,
        compact: true
    },
    quarter120: {
        name: '120 дней',
        days: 120,
        minCellWidth: 6,
        showDayName: false,
        showMonthInCell: false,
        compact: true
    }
};

// Цвета этапов
const STAGE_COLORS = [
    '#6366F1', // Инициализация
    '#10B981', // Планирование  
    '#F59E0B', // Выполнение
    '#EF4444'  // Контроль
];

// Инициализация Ганта
function initCustomGantt() {
    console.log('Инициализация ультракомпактного Ганта...');
    
    const container = document.getElementById('gantt-chart');
    if (!container) {
        console.error('Контейнер для Ганта не найден');
        return false;
    }
    
    // Создаем тултип
    createTooltip();
    
    // Создаем структуру Ганта
    container.innerHTML = `
        <div class="custom-gantt">
            <div class="gantt-controls">
                <div class="view-controls">
                    <button class="view-btn active" data-view="month30" title="30 дней">30д</button>
                    <button class="view-btn" data-view="month60" title="60 дней">60д</button>
                    <button class="view-btn" data-view="quarter120" title="120 дней">120д</button>
                </div>
                <div class="date-controls">
                    <button class="btn btn-icon" id="gantt-prev" title="Предыдущий период">←</button>
                    <span class="date-range" id="date-range"></span>
                    <button class="btn btn-icon" id="gantt-next" title="Следующий период">→</button>
                    <button class="btn btn-icon" id="gantt-today" title="Сегодня">●</button>
                </div>
            </div>
            <div class="gantt-scroll-container">
                <div class="gantt-header"></div>
                <div class="gantt-body"></div>
            </div>
        </div>
    `;
    
    // Инициализируем
    calculateLayout();
    renderHeader();
    renderBody();
    setupControls();
    
    // Ресайз
    window.addEventListener('resize', debounce(handleResize, 100));
    
    console.log('Ультракомпактный Гант инициализирован');
    return true;
}

// РАСЧЕТ МАКЕТА
function calculateLayout() {
    const config = VIEWS[currentView];
    const container = document.querySelector('.gantt-container');
    
    if (!container) {
        cellWidth = config.minCellWidth;
        return;
    }
    
    const containerWidth = container.clientWidth;
    const firstColWidth = 180;
    const availableWidth = containerWidth - firstColWidth;
    
    // Рассчитываем ширину ячейки
    let calculatedWidth = Math.floor(availableWidth / config.days);
    cellWidth = Math.max(config.minCellWidth, calculatedWidth);
    
    // Гарантируем, что все поместится
    const totalWidth = firstColWidth + (cellWidth * config.days);
    if (totalWidth > containerWidth) {
        cellWidth = Math.max(config.minCellWidth, Math.floor((containerWidth - firstColWidth) / config.days));
    }
    
    console.log(`Layout: container=${containerWidth}px, cells=${config.days}, width=${cellWidth}px`);
}

// РЕНДЕР ЗАГОЛОВКА
function renderHeader() {
    const header = document.querySelector('.gantt-header');
    if (!header) return;
    
    const config = VIEWS[currentView];
    const days = getDaysArray(currentStartDate, config.days);
    
    let html = '<div class="header-row">';
    
    // Колонка сделки
    html += '<div class="header-cell deal-col">СДЕЛКА</div>';
    
    // Группировка по месяцам для компактных видов
    if (config.compact) {
        const months = groupByMonth(days);
        months.forEach(month => {
            const monthWidth = cellWidth * month.days;
            html += `
                <div class="header-cell" style="width: ${monthWidth}px; min-width: ${monthWidth}px;">
                    <div class="month-header">${month.name}</div>
                </div>
            `;
        });
        
        html += '</div><div class="header-row"><div class="header-cell deal-col">ЗАДАЧИ</div>';
        
        // Вторая строка с днями
        days.forEach(day => {
            html += createDayHeaderCell(day, config);
        });
    } else {
        // Одна строка для 30 дней
        days.forEach(day => {
            html += createDayHeaderCell(day, config);
        });
    }
    
    html += '</div>';
    header.innerHTML = html;
    
    // Обновляем диапазон дат
    updateDateRange();
}

// СОЗДАНИЕ ЯЧЕЙКИ ДНЯ В ЗАГОЛОВКЕ
function createDayHeaderCell(day, config) {
    const today = new Date();
    const isToday = day.toDateString() === today.toDateString();
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    
    const classes = ['header-cell'];
    if (isToday) classes.push('today');
    if (isWeekend) classes.push('weekend');
    
    let content = '';
    if (config.showDayName) {
        content = `
            <div class="day-label">
                <div class="day-name">${getShortDayName(day)}</div>
                <div class="day-number">${day.getDate()}</div>
            </div>
        `;
    } else {
        content = `<div class="day-number">${day.getDate()}</div>`;
    }
    
    if (config.showMonthInCell && day.getDate() === 1) {
        content = `<div class="month-header">${getShortMonthName(day)}</div>` + content;
    }
    
    return `
        <div class="${classes.join(' ')}" 
             style="width: ${cellWidth}px; min-width: ${cellWidth}px;"
             title="${formatDateFull(day)}">
            ${content}
        </div>
    `;
}

// РЕНДЕР ТЕЛА ГАНТА
function renderBody() {
    const body = document.querySelector('.gantt-body');
    if (!body) return;
    
    body.innerHTML = '<div class="loading">Загрузка...</div>';
    
    // Загружаем заявки
    setTimeout(() => loadDeals(body), 100);
}

// ЗАГРУЗКА ЗАЯВОК
async function loadDeals(body) {
    try {
        const deals = await db.deals.toArray();
        body.innerHTML = '';
        
        deals.forEach(deal => {
            createDealRow(body, deal);
        });
        
        console.log(`Загружено ${deals.length} заявок`);
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        body.innerHTML = '<div class="error">Ошибка загрузки данных</div>';
    }
}

// СОЗДАНИЕ СТРОКИ ЗАЯВКИ
function createDealRow(body, deal) {
    const config = VIEWS[currentView];
    const days = getDaysArray(currentStartDate, config.days);
    
    // Строка заявки
    const rowId = `deal-${deal.id}`;
    const rowHTML = `
        <div class="deal-row" id="${rowId}" data-deal-id="${deal.id}">
            <div class="deal-cell">
                <div class="deal-info">
                    <span class="deal-code">${deal.code}</span>
                    <span class="deal-applicant">${deal.applicant}</span>
                    <button class="expand-btn" onclick="toggleRoleRows('${rowId}')" title="Показать задачи">▸</button>
                </div>
            </div>
            ${days.map((day, i) => createDayCell(day, deal, i)).join('')}
        </div>
        <div id="${rowId}-roles" class="role-rows"></div>
    `;
    
    body.insertAdjacentHTML('beforeend', rowHTML);
    
    // Загружаем задачи для этой заявки
    loadRoleRows(deal.id, rowId);
}

// СОЗДАНИЕ ЯЧЕЙКИ ДНЯ
function createDayCell(day, deal, index) {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const classes = ['day-cell'];
    if (isWeekend) classes.push('weekend');
    
    // Демо-этапы
    let stage = '';
    const startOffset = Math.floor((deal.id || 0) % 5);
    if (index >= startOffset && index < startOffset + 4) {
        const stageIndex = Math.floor((index - startOffset) / 2) % 4;
        stage = `<div class="stage-segment" style="background: ${STAGE_COLORS[stageIndex]}" 
                onmouseover="showTooltip(event, 'Этап ${stageIndex + 1}')"
                onmouseout="hideTooltip()"></div>`;
    }
    
    return `
        <div class="${classes.join(' ')}" 
             style="width: ${cellWidth}px; min-width: ${cellWidth}px;">
            ${stage}
        </div>
    `;
}

// ЗАГРУЗКА СТРОК РОЛЕЙ
async function loadRoleRows(dealId, rowId) {
    const container = document.getElementById(`${rowId}-roles`);
    if (!container) return;
    
    // Получаем роли из БД
    const roles = await db.roles.toArray();
    const config = VIEWS[currentView];
    const days = getDaysArray(currentStartDate, config.days);
    
    let html = '';
    
    roles.forEach(role => {
        html += `<div class="role-row">
            <div class="role-cell">
                <div class="role-name">
                    <div class="role-color" style="background: ${role.color}"></div>
                    <span class="role-text">${role.name}</span>
                </div>
            </div>
            ${days.map(day => createRoleDayCell(day, role)).join('')}
        </div>`;
    });
    
    container.innerHTML = html;
}

// СОЗДАНИЕ ЯЧЕЙКИ ДНЯ ДЛЯ РОЛИ
function createRoleDayCell(day, role) {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const classes = ['day-cell'];
    if (isWeekend) classes.push('weekend');
    
    // Демо-задачи
    let task = '';
    const dayOfMonth = day.getDate();
    const roleId = role.name.charCodeAt(0) + role.name.charCodeAt(1);
    
    if (dayOfMonth % 7 === roleId % 7 || dayOfMonth % 5 === (roleId % 5)) {
        task = `<div class="task-block" style="background: ${role.color}"
               onmouseover="showTooltip(event, '${role.name}: Задача')"
               onmouseout="hideTooltip()"></div>`;
    }
    
    return `
        <div class="${classes.join(' ')}" 
             style="width: ${cellWidth}px; min-width: ${cellWidth}px;">
            ${task}
        </div>
    `;
}

// ПЕРЕКЛЮЧЕНИЕ СТРОК РОЛЕЙ
function toggleRoleRows(rowId) {
    const roles = document.getElementById(`${rowId}-roles`);
    const btn = document.querySelector(`#${rowId} .expand-btn`);
    
    if (!roles || !btn) return;
    
    if (roles.style.display === 'block') {
        roles.style.display = 'none';
        btn.textContent = '▸';
        btn.title = 'Показать задачи';
    } else {
        roles.style.display = 'block';
        btn.textContent = '▾';
        btn.title = 'Скрыть задачи';
    }
}

// НАСТРОЙКА УПРАВЛЕНИЯ
function setupControls() {
    // Кнопки видов
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (VIEWS[view]) {
                setView(view);
            }
        });
    });
    
    // Навигация
    document.getElementById('gantt-prev').addEventListener('click', navigatePrev);
    document.getElementById('gantt-next').addEventListener('click', navigateNext);
    document.getElementById('gantt-today').addEventListener('click', goToToday);
}

// УСТАНОВКА ВИДА
function setView(view) {
    if (currentView === view) return;
    
    currentView = view;
    daysToShow = VIEWS[view].days;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Перерисовываем
    calculateLayout();
    renderHeader();
    renderBody();
}

// НАВИГАЦИЯ
function navigatePrev() {
    currentStartDate.setDate(currentStartDate.getDate() - daysToShow);
    renderHeader();
    renderBody();
}

function navigateNext() {
    currentStartDate.setDate(currentStartDate.getDate() + daysToShow);
    renderHeader();
    renderBody();
}

function goToToday() {
    currentStartDate = new Date();
    renderHeader();
    renderBody();
}

// ОБНОВЛЕНИЕ ДИАПАЗОНА ДАТ
function updateDateRange() {
    const rangeEl = document.getElementById('date-range');
    if (!rangeEl) return;
    
    const start = new Date(currentStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + daysToShow - 1);
    
    rangeEl.textContent = `${formatDate(start)} — ${formatDate(end)}`;
}

// РЕСАЙЗ
function handleResize() {
    calculateLayout();
    renderHeader();
    // Перерисовываем тело с задержкой
    debounce(() => {
        const body = document.querySelector('.gantt-body');
        if (body) {
            const oldContent = body.innerHTML;
            body.innerHTML = '';
            setTimeout(() => body.innerHTML = oldContent, 10);
        }
    }, 50)();
}

// СОЗДАНИЕ ТУЛТИПА
function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip hidden';
    document.body.appendChild(tooltip);
}

// ПОКАЗАТЬ ТУЛТИП
function showTooltip(event, text) {
    if (!tooltip) return;
    
    tooltip.textContent = text;
    tooltip.classList.remove('hidden');
    
    const x = event.clientX + 10;
    const y = event.clientY - 30;
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

// СКРЫТЬ ТУЛТИП
function hideTooltip() {
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Получить массив дней
function getDaysArray(startDate, count) {
    const days = [];
    const date = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    
    return days;
}

// Группировка по месяцам
function groupByMonth(days) {
    if (days.length === 0) return [];
    
    const months = [];
    let currentMonth = {
        name: getShortMonthName(days[0]),
        start: 0,
        days: 1
    };
    
    for (let i = 1; i < days.length; i++) {
        const monthName = getShortMonthName(days[i]);
        
        if (monthName === currentMonth.name) {
            currentMonth.days++;
        } else {
            months.push({...currentMonth});
            currentMonth = {
                name: monthName,
                start: i,
                days: 1
            };
        }
    }
    
    months.push(currentMonth);
    return months;
}

// Короткое имя дня
function getShortDayName(date) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
}

// Короткое имя месяца
function getShortMonthName(date) {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return months[date.getMonth()];
}

// Форматирование даты
function formatDate(date) {
    return `${date.getDate()} ${getShortMonthName(date)}`;
}

function formatDateFull(date) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Дебаунс
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Экспортируем функции
window.ganttManager = {
    init: initCustomGantt,
    refresh: () => {
        calculateLayout();
        renderHeader();
        renderBody();
    },
    toggleRoleRows: toggleRoleRows,
    showTooltip: showTooltip,
    hideTooltip: hideTooltip
};

console.log('Модуль ультракомпактного кастомного Ганта загружен');
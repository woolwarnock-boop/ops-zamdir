// ============================================
// ФАЙЛ: modal.js
// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// ============================================

console.log('Загрузка модуля модальных окон...');

// Глобальная переменная для функции открытия модалки
let openDealModalFunction = null;

// Создание модального окна для заявки
function createDealModal() {
    console.log('Создание модального окна для заявки...');
    
    try {
        // Создаем HTML модального окна
        const modalHTML = `
            <div id="dealModal" class="modal-overlay" style="display: none;">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>➕ Новая заявка</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="form-group">
                            <label for="dealCode">Код заявки:</label>
                            <input type="text" id="dealCode" placeholder="26-XXXXX" class="form-input">
                            <div class="form-hint">Формат: год-номер (например: 26-00001)</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="dealApplicant">Заявитель:</label>
                            <input type="text" id="dealApplicant" placeholder="ФИО или название организации" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="dealTemplate">Шаблон:</label>
                            <select id="dealTemplate" class="form-select">
                                <option value="">-- Выберите шаблон --</option>
                                <option value="1">Базовый шаблон</option>
                                <option value="2">Полный цикл</option>
                                <option value="3">Экспресс-обработка</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="dealStartDate">Дата начала:</label>
                            <input type="date" id="dealStartDate" class="form-input" value="${getTodayDate()}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-cancel">Отмена</button>
                        <button class="btn btn-primary modal-confirm">Создать заявку</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модалку в body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Настраиваем обработчики событий
        setupModalHandlers();
        
        console.log('Модальное окно создано');
    } catch (error) {
        console.error('Ошибка создания модального окна:', error);
    }
}

// Получить сегодняшнюю дату в формате YYYY-MM-DD
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Настройка обработчиков модального окна
function setupModalHandlers() {
    try {
        const modal = document.getElementById('dealModal');
        if (!modal) {
            console.error('Модальное окно не найдено');
            return;
        }
        
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const confirmBtn = modal.querySelector('.modal-confirm');
        
        // Функция закрытия модалки
        function closeModal() {
            modal.style.display = 'none';
            modal.querySelectorAll('.form-input').forEach(input => input.value = '');
        }
        
        // Функция открытия модалки
        openDealModalFunction = function() {
            modal.style.display = 'flex';
            document.getElementById('dealCode').focus();
        };
        
        // Навешиваем обработчики
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        
        // Клик по оверлею (вне модалки)
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Создание заявки
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async function() {
                const code = document.getElementById('dealCode').value.trim();
                const applicant = document.getElementById('dealApplicant').value.trim();
                const templateId = document.getElementById('dealTemplate').value;
                const startDate = document.getElementById('dealStartDate').value;
                
                // Валидация
                if (!code) {
                    showNotification('Введите код заявки', 'error');
                    return;
                }
                
                if (!applicant) {
                    showNotification('Введите заявителя', 'error');
                    return;
                }
                
                if (!templateId) {
                    showNotification('Выберите шаблон', 'error');
                    return;
                }
                
                try {
                    // Создаем заявку в базе данных
                    const dealId = await db.deals.add({
                        code: code,
                        applicant: applicant,
                        templateId: parseInt(templateId),
                        startDate: startDate,
                        createdAt: new Date(),
                        isFrozen: false
                    });
                    
                    console.log('Заявка создана:', dealId);
                    
                    // Закрываем модалку
                    closeModal();
                    
                    // Показываем уведомление
                    showNotification(`Заявка "${code}" успешно создана!`, 'success');
                    
                    // Обновляем счетчики
                    if (window.app && window.app.updateCounters) {
                        await window.app.updateCounters();
                    }
                    
                    // Обновляем Гант (добавляем новую строку)
                    updateGanttWithNewDeal({
                        id: dealId,
                        code: code,
                        applicant: applicant,
                        templateId: templateId,
                        startDate: startDate
                    });
                    
                } catch (error) {
                    console.error('Ошибка создания заявки:', error);
                    showNotification('Ошибка при создании заявки: ' + error.message, 'error');
                }
            });
        }
        
        // Автогенерация кода заявки
        const codeInput = document.getElementById('dealCode');
        if (codeInput) {
            codeInput.addEventListener('focus', async function() {
                if (!this.value) {
                    try {
                        // Генерируем следующий код
                        const lastDeal = await db.deals.orderBy('id').last();
                        let nextNumber = 1;
                        
                        if (lastDeal && lastDeal.code) {
                            const match = lastDeal.code.match(/\d+/);
                            if (match) {
                                nextNumber = parseInt(match[0]) + 1;
                            }
                        }
                        
                        const year = new Date().getFullYear().toString().slice(-2);
                        this.value = `${year}-${String(nextNumber).padStart(5, '0')}`;
                    } catch (error) {
                        console.error('Ошибка генерации кода:', error);
                    }
                }
            });
        }
        
        console.log('Обработчики модального окна настроены');
    } catch (error) {
        console.error('Ошибка настройки обработчиков модального окна:', error);
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    try {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
        `;
        
        // Кнопка закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin: 0;
            line-height: 1;
        `;
        
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Автоматическое закрытие через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        document.body.appendChild(notification);
        
        // Добавляем анимации в CSS
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Ошибка показа уведомления:', error);
    }
}

// Обновить Гант новой заявкой
function updateGanttWithNewDeal(deal) {
    try {
        const ganttBody = document.querySelector('.gantt-body');
        if (!ganttBody) {
            console.error('Тело Ганта не найдено');
            return;
        }
        
        // Создаем HTML для новой заявки
        const newDealHTML = `
            <div class="deal-row" data-deal-id="${deal.id}">
                <div class="deal-cell">
                    <div class="deal-info">
                        <span class="deal-code">${deal.code}</span>
                        <span class="deal-applicant">${deal.applicant}</span>
                        <button class="expand-btn">▼</button>
                    </div>
                </div>
                <div class="day-cell">
                    <div class="stage-segment" style="background-color: #4285F4;" title="Инициализация"></div>
                </div>
                <div class="day-cell">
                    <div class="stage-segment" style="background-color: #4285F4;" title="Инициализация"></div>
                </div>
                <div class="day-cell">
                    <div class="stage-segment" style="background-color: #34A853;" title="Планирование"></div>
                </div>
                <div class="day-cell">
                    <div class="stage-segment" style="background-color: #34A853;" title="Планирование"></div>
                </div>
                <div class="day-cell"></div>
                <div class="day-cell"></div>
                <div class="day-cell"></div>
            </div>
        `;
        
        // Добавляем новую заявку в конец Ганта
        ganttBody.insertAdjacentHTML('beforeend', newDealHTML);
        
        // Настраиваем кнопку раскрытия для новой заявки
        const newDealRow = ganttBody.lastElementChild;
        const newExpandBtn = newDealRow.querySelector('.expand-btn');
        
        if (newExpandBtn) {
            // Создаем строки ролей для новой заявки
            const roleRowsHTML = `
                <div class="role-rows" style="display: none;">
                    <div class="role-row">
                        <div class="role-cell">
                            <span class="role-name">Снабженец</span>
                        </div>
                        <div class="day-cell"></div>
                        <div class="day-cell">
                            <div class="task-block" style="background-color: #45B7D1;" title="Закупка материалов (4ч)"></div>
                        </div>
                        <div class="day-cell">
                            <div class="task-block" style="background-color: #45B7D1;" title="Закупка материалов (4ч)"></div>
                        </div>
                        <div class="day-cell"></div>
                        <div class="day-cell"></div>
                        <div class="day-cell"></div>
                        <div class="day-cell"></div>
                    </div>
                </div>
            `;
            
            // Добавляем после строки заявки
            newDealRow.insertAdjacentHTML('afterend', roleRowsHTML);
            
            // Настраиваем обработчик
            const roleRows = newDealRow.nextElementSibling;
            newExpandBtn.addEventListener('click', function() {
                if (roleRows.style.display === 'none') {
                    roleRows.style.display = 'block';
                    this.textContent = '▲';
                } else {
                    roleRows.style.display = 'none';
                    this.textContent = '▼';
                }
            });
        }
        
        console.log('Гант обновлен с новой заявкой:', deal.code);
    } catch (error) {
        console.error('Ошибка обновления Ганта:', error);
    }
}

// Загрузить все заявки из БД и отобразить на Ганте
async function loadAllDealsToGantt() {
    try {
        console.log('Загрузка всех заявок на Гант...');
        
        const allDeals = await db.deals.toArray();
        console.log('Найдено заявок в БД:', allDeals.length);
        
        // Очищаем Гант (кроме заголовка)
        const ganttBody = document.querySelector('.gantt-body');
        if (!ganttBody) {
            console.error('Тело Ганта не найдено');
            return;
        }
        
        // Удаляем все строки заявок (оставляем только заголовок)
        const existingDealRows = ganttBody.querySelectorAll('.deal-row');
        existingDealRows.forEach(row => {
            const roleRows = row.nextElementSibling;
            if (roleRows && roleRows.classList.contains('role-rows')) {
                roleRows.remove();
            }
            row.remove();
        });
        
        // Добавляем каждую заявку на Гант
        for (const deal of allDeals) {
            updateGanttWithNewDeal(deal);
        }
        
        console.log('Все заявки загружены на Гант');
    } catch (error) {
        console.error('Ошибка загрузки заявок на Гант:', error);
    }
}

// Инициализация всех модальных окон
function initModals() {
    try {
        createDealModal();
        console.log('Модальные окна инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации модальных окон:', error);
    }
}

// Функция для открытия модального окна
function openDealModal() {
    if (openDealModalFunction) {
        openDealModalFunction();
    } else {
        console.error('Функция открытия модального окна не доступна');
        showNotification('Модальное окно не загружено', 'error');
    }
}

// Экспорт функций
window.modalManager = {
    init: initModals,
    openDealModal: openDealModal,
    loadAllDealsToGantt: loadAllDealsToGantt
};

console.log('Модуль модальных окон загружен');
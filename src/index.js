// DOM Elements
const elements = {
    habitsList: document.getElementById('habits-list'),
    addHabitBtn: document.getElementById('add-habit-btn'),
    addHabitModal: document.getElementById('add-habit-modal'),
    habitForm: document.getElementById('habit-form'),
    closeModalButtons: document.querySelectorAll('.close-modal'),
    views: document.querySelectorAll('.view'),
    navItems: document.querySelectorAll('nav li'),
    themeSwitch: document.getElementById('theme-switch'),
    calendarGrid: document.getElementById('calendar-grid'),
    currentMonthEl: document.getElementById('current-month'),
    prevMonthBtn: document.getElementById('prev-month'),
    nextMonthBtn: document.getElementById('next-month'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    addCategoryModal: document.getElementById('add-category-modal'),
    categoryForm: document.getElementById('category-form'),
    saveSettingsBtn: document.getElementById('save-settings'),
    reminderTime: document.getElementById('reminder-time'),
    statsChart: document.getElementById('stats-chart')
};

// State
let state = {
    habits: [],
    categories: ['health', 'productivity', 'learning', 'social', 'other'],
    currentView: 'list',
    currentDate: new Date(),
    theme: 'light',
    settings: {
        reminderTime: '09:00',
        reminderDays: [0, 1, 2, 3, 4, 5, 6]
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

// Event Listeners
elements.addHabitBtn.addEventListener('click', () => toggleModal(elements.addHabitModal));
elements.habitForm.addEventListener('submit', handleAddHabit);
elements.closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.addHabitModal.classList.remove('active');
        elements.addCategoryModal.classList.remove('active');

        // Reset the form and ensure it uses the default submit handler
        const newForm = elements.habitForm.cloneNode(true);
        elements.habitForm.replaceWith(newForm);
        elements.habitForm = newForm;
        elements.habitForm.addEventListener('submit', handleAddHabit);
    });
});

elements.navItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
});
elements.themeSwitch.addEventListener('change', toggleTheme);
elements.prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
elements.nextMonthBtn.addEventListener('click', () => navigateMonth(1));
elements.addCategoryBtn.addEventListener('click', () => toggleModal(elements.addCategoryModal));
elements.categoryForm.addEventListener('submit', handleAddCategory);
elements.saveSettingsBtn.addEventListener('click', saveSettings);

// Drag and drop setup
elements.habitsList.addEventListener('dragstart', handleDragStart);
elements.habitsList.addEventListener('dragover', handleDragOver);
elements.habitsList.addEventListener('drop', handleDrop);

// Initialize the app
function initApp() {
    loadSettings();
    loadHabits();
    generateCalendar();
    setupReminderNotifications();
    setupChart();
}

// API Functions
async function loadHabits() {
    try {
        
        state.habits = [
            {
                id: '1',
                name: 'Drink water',
                category: 'health',
                streak: 5,
                completed: true,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                id: '2',
                name: 'Exercise',
                category: 'health',
                streak: 3,
                completed: false,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                id: '3',
                name: 'Read 30 minutes',
                category: 'learning',
                streak: 7,
                completed: true,
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            }
        ];
        
        renderHabits();
        updateStats();
    } catch (error) {
        console.error('Error loading habits:', error);
        showNotification('Failed to load habits', 'error');
    }
}

async function fetchHabitsFromAPI() {
    const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/user`, {
        headers: {
            'x-api-user': API_CONFIG.USER_ID,
            'x-api-key': API_CONFIG.API_KEY,
            'x-client': API_CONFIG.CLIENT
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch habits');
    }
    
    return await response.json();
}

async function addHabitToAPI(habit) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/user`, {
        method: 'POST',
        headers: {
            'x-api-user': API_CONFIG.USER_ID,
            'x-api-key': API_CONFIG.API_KEY,
            'x-client': API_CONFIG.CLIENT,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(habit)
    });
    
    if (!response.ok) {
        throw new Error('Failed to add habit');
    }
    
    return await response.json();
}

// UI Functions
function renderHabits() {
    elements.habitsList.innerHTML = '';
    
    if (state.habits.length === 0) {
        elements.habitsList.innerHTML = '<p class="empty-state">No habits yet. Add your first habit to get started!</p>';
        return;
    }
    
    state.habits.forEach(habit => {
        const habitEl = document.createElement('div');
        habitEl.className = `habit ${habit.completed ? 'completed' : ''}`;
        habitEl.draggable = true;
        habitEl.dataset.id = habit.id;
        
        habitEl.innerHTML = `
            <div class="habit-main">
                <div class="habit-checkbox">
                    <input type="checkbox" id="habit-${habit.id}" ${habit.completed ? 'checked' : ''}>
                    <label for="habit-${habit.id}"></label>
                </div>
                <div class="habit-info">
                    <h3>${habit.name}</h3>
                    <div class="habit-meta">
                        <span class="category ${habit.category}">
                            <i class="${getCategoryIcon(habit.category)}"></i>
                            ${capitalizeFirstLetter(habit.category)}
                        </span>
                        <span class="streak">
                            <i class="fas fa-fire"></i> ${habit.streak} days
                        </span>
                    </div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="btn-icon edit-habit" data-id="${habit.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-habit" data-id="${habit.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        elements.habitsList.appendChild(habitEl);
        
        // Add event listeners to the new elements
        const checkbox = habitEl.querySelector(`#habit-${habit.id}`);
        checkbox.addEventListener('change', () => toggleHabitCompletion(habit.id));
        
        const editBtn = habitEl.querySelector('.edit-habit');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editHabit(habit.id);
        });
        
        const deleteBtn = habitEl.querySelector('.delete-habit');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHabit(habit.id);
        });
    });
}

function generateCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    elements.currentMonthEl.textContent = `${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    // Get first day of month and total days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Clear previous calendar
    elements.calendarGrid.innerHTML = '';
    
    // Add day headers
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        elements.calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        elements.calendarGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.dataset.date = dateStr;
        
        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-habits"></div>
        `;
        
        // Add habits for this day
        const habitsForDay = state.habits.filter(habit => {
            const habitDate = new Date(habit.createdAt).toISOString().split('T')[0];
            return habitDate === dateStr;
        });
        
        const habitsContainer = dayCell.querySelector('.day-habits');
        habitsForDay.forEach(habit => {
            const habitDot = document.createElement('div');
            habitDot.className = `habit-dot ${habit.category}`;
            habitDot.title = habit.name;
            habitsContainer.appendChild(habitDot);
        });
        
        elements.calendarGrid.appendChild(dayCell);
    }
}

function toggleModal(modal) {
    modal.classList.toggle('active');
}

function switchView(view) {
    // Update active nav item
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    
    // Show the selected view
    elements.views.forEach(v => {
        v.classList.toggle('hidden', v.id !== `${view}-view`);
    });
    
    state.currentView = view;
    
    // Special handling for certain views
    if (view === 'calendar') {
        generateCalendar();
    } else if (view === 'stats') {
        updateChart();
    }
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.body.className = `${state.theme}-theme`;
    saveSettings();
}

function navigateMonth(change) {
    state.currentDate = new Date(
        state.currentDate.getFullYear(),
        state.currentDate.getMonth() + change,
        1
    );
    generateCalendar();
}

// Habit CRUD Operations
function handleAddHabit(e) {
    e.preventDefault();
    
    const name = elements.habitForm.querySelector('#habit-name').value;
    const category = elements.habitForm.querySelector('#habit-category').value;
    const goal = elements.habitForm.querySelector('#habit-goal').value;
    const notes = elements.habitForm.querySelector('#habit-notes').value;
    
    const newHabit = {
        id: Date.now().toString(),
        name,
        category,
        goal,
        notes,
        streak: 0,
        completed: false,
        createdAt: new Date()
    };
    
    
    
    state.habits.push(newHabit);
    renderHabits();
    updateStats();
    
    // Reset form and close modal
    elements.habitForm.reset();
    toggleModal(elements.addHabitModal);
    
    showNotification('Habit added successfully!');
}

function toggleHabitCompletion(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    habit.completed = !habit.completed;
    
    if (habit.completed) {
        habit.streak++;
        showNotification(`Great job! ${habit.name} streak is now ${habit.streak} days.`);
    } else {
        habit.streak = Math.max(0, habit.streak - 1);
    }
    
    renderHabits();
    updateStats();
}

function editHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    // Populate the form with habit data
    elements.habitForm.querySelector('#habit-name').value = habit.name;
    elements.habitForm.querySelector('#habit-category').value = habit.category;
    elements.habitForm.querySelector('#habit-goal').value = habit.goal || '';
    elements.habitForm.querySelector('#habit-notes').value = habit.notes || '';
    
    // Change form to edit mode
    elements.habitForm.removeEventListener('submit', handleAddHabit);
    elements.habitForm.addEventListener('submit', (e) => handleUpdateHabit(e, habitId));
    
    toggleModal(elements.addHabitModal);
}

function handleUpdateHabit(e, habitId) {
    e.preventDefault();

    const habitIndex = state.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;

    const name = elements.habitForm.querySelector('#habit-name').value;
    const category = elements.habitForm.querySelector('#habit-category').value;
    const goal = elements.habitForm.querySelector('#habit-goal').value;
    const notes = elements.habitForm.querySelector('#habit-notes').value;

    state.habits[habitIndex] = {
        ...state.habits[habitIndex],
        name,
        category,
        goal,
        notes
    };

    renderHabits();
    updateStats();

    // Reset form and modal
    elements.habitForm.reset();
    toggleModal(elements.addHabitModal);

    // 🛠 Remove all submit event listeners and re-add default one
    const newForm = elements.habitForm.cloneNode(true);
    elements.habitForm.replaceWith(newForm);
    elements.habitForm = newForm; // reassign reference
    elements.habitForm.addEventListener('submit', handleAddHabit);

    showNotification('Habit updated successfully!');
}


function deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    
    
    state.habits = state.habits.filter(h => h.id !== habitId);
    renderHabits();
    updateStats();
    
    showNotification('Habit deleted successfully!');
}

// Category Functions
function handleAddCategory(e) {
    e.preventDefault();
    
    const name = elements.categoryForm.querySelector('#category-name').value;
    const icon = elements.categoryForm.querySelector('#category-icon').value;
    
    if (state.categories.includes(name.toLowerCase())) {
        showNotification('Category already exists', 'error');
        return;
    }
    
    state.categories.push(name.toLowerCase());
   
    // Reset form and close modal
    elements.categoryForm.reset();
    toggleModal(elements.addCategoryModal);
    
    showNotification('Category added successfully!');
}

function getCategoryIcon(category) {
    // Default icons for predefined categories
    const icons = {
        health: 'fas fa-heartbeat',
        productivity: 'fas fa-check-circle',
        learning: 'fas fa-book',
        social: 'fas fa-users',
        other: 'fas fa-ellipsis-h'
    };
    
    return icons[category] || 'fas fa-tag';
}

// Stats Functions
function updateStats() {
    if (state.habits.length === 0) {
        document.getElementById('completion-rate').textContent = '0%';
        document.getElementById('longest-streak').textContent = '0 days';
        document.getElementById('habits-count').textContent = '0';
        return;
    }
    
    // Calculate completion rate
    const completedCount = state.habits.filter(h => h.completed).length;
    const completionRate = Math.round((completedCount / state.habits.length) * 100);
    document.getElementById('completion-rate').textContent = `${completionRate}%`;
    
    // Find longest streak
    const longestStreak = state.habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
    document.getElementById('longest-streak').textContent = `${longestStreak} days`;
    
    // Count habits
    document.getElementById('habits-count').textContent = state.habits.length;
    
    // Update streak counter in sidebar
    const currentStreak = calculateCurrentStreak();
    document.querySelector('.streak-days').textContent = `${currentStreak} days`;
}

function calculateCurrentStreak() {
    if (state.habits.length === 0) return 0;
    
    // This is a simplified calculation - in a real app, you'd track streaks more accurately
    return state.habits.reduce((sum, habit) => sum + habit.streak, 0) / state.habits.length;
}

function setupChart() {
    // Chart will be updated when stats view is shown
    state.chart = new Chart(elements.statsChart, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Completion Rate',
                    data: [],
                    backgroundColor: '#4CAF50'
                },
                {
                    label: 'Streak',
                    data: [],
                    backgroundColor: '#FF9800'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateChart() {
    if (!state.chart) return;
    
    const habitNames = state.habits.map(h => h.name);
    const completionRates = state.habits.map(h => h.completed ? 100 : 0);
    const streaks = state.habits.map(h => h.streak);
    
    state.chart.data.labels = habitNames;
    state.chart.data.datasets[0].data = completionRates;
    state.chart.data.datasets[1].data = streaks;
    state.chart.update();
}

// Settings Functions
function loadSettings() {
    const savedSettings = localStorage.getItem('smartHabitSettings');
    if (savedSettings) {
        state.settings = JSON.parse(savedSettings);
        
        // Apply settings
        if (state.settings.reminderTime) {
            elements.reminderTime.value = state.settings.reminderTime;
        }
        
        if (state.settings.reminderDays) {
            document.querySelectorAll('.days-selector input').forEach(checkbox => {
                checkbox.checked = state.settings.reminderDays.includes(parseInt(checkbox.value));
            });
        }
        
        if (state.settings.theme) {
            state.theme = state.settings.theme;
            document.body.className = `${state.theme}-theme`;
            elements.themeSwitch.checked = state.theme === 'dark';
        }
    }
}

function saveSettings() {
    // Get reminder days
    const reminderDays = [];
    document.querySelectorAll('.days-selector input:checked').forEach(checkbox => {
        reminderDays.push(parseInt(checkbox.value));
    });
    
    state.settings = {
        reminderTime: elements.reminderTime.value,
        reminderDays,
        theme: state.theme
    };
    
    localStorage.setItem('smartHabitSettings', JSON.stringify(state.settings));
    showNotification('Settings saved successfully!');
    
    // Update reminders
    setupReminderNotifications();
}

function setupReminderNotifications() {
    // In a real app, you would use the Notification API or a service worker
    console.log('Reminders set for:', state.settings.reminderTime, 'on days:', state.settings.reminderDays);
}

// Drag and Drop Functions
function handleDragStart(e) {
    if (!e.target.classList.contains('habit')) return;
    
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    
    const draggingElement = document.querySelector('.habit.dragging');
    if (!draggingElement) return;
    
    const afterElement = getDragAfterElement(elements.habitsList, e.clientY);
    if (afterElement) {
        elements.habitsList.insertBefore(draggingElement, afterElement);
    } else {
        elements.habitsList.appendChild(draggingElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const habitId = e.dataTransfer.getData('text/plain');
    const habitEl = document.querySelector(`.habit[data-id="${habitId}"]`);
    if (!habitEl) return;
    
    habitEl.classList.remove('dragging');
    
    // In a real app, you would save the new order to your backend
    const habitIds = Array.from(document.querySelectorAll('.habit')).map(el => el.dataset.id);
    state.habits.sort((a, b) => habitIds.indexOf(a.id) - habitIds.indexOf(b.id));
    
    showNotification('Habits reordered!');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.habit:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Helper Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize with some demo data if empty
if (state.habits.length === 0) {
    loadHabits();
}
document.addEventListener('DOMContentLoaded', function () {
    // API Configuration
    const API_URL = 'http://localhost:3000/habits';

    // DOM Elements
    const habitForm = document.getElementById('habit-form');
    const habitInput = document.getElementById('habit-input');
    const habitCategory = document.getElementById('habit-category');
    const habitsList = document.getElementById('habits-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categoryFilter = document.getElementById('category-filter');
    const themeBtn = document.getElementById('theme-btn');
    const viewToggle = document.getElementById('view-toggle');
    const currentStreakEl = document.getElementById('current-streak');
    const completionRateEl = document.getElementById('completion-rate');
    const dailyProgressEl = document.getElementById('daily-progress');
    const reminderTime = document.getElementById('reminder-time');
    const setReminderBtn = document.getElementById('set-reminder');
    const calendarView = document.getElementById('calendar-view');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    // State
    let habits = [];
    let currentFilter = 'all';
    let currentCategoryFilter = 'all';
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let draggedItem = null;

    // Initialize
    fetchHabits();
    checkThemePreference();
    checkReminder();
    generateCalendar(currentMonth, currentYear);

    // Event Listeners
    habitForm.addEventListener('submit', addHabit);
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => filterHabits(btn.dataset.filter));
    });
    categoryFilter.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        renderHabits();
    });
    themeBtn.addEventListener('click', toggleTheme);
    viewToggle.addEventListener('click', toggleView);
    setReminderBtn.addEventListener('click', setReminder);
    prevMonthBtn.addEventListener('click', showPreviousMonth);
    nextMonthBtn.addEventListener('click', showNextMonth);

    // Drag and Drop Event Listeners
    habitsList.addEventListener('dragstart', handleDragStart);
    habitsList.addEventListener('dragover', handleDragOver);
    habitsList.addEventListener('dragleave', handleDragLeave);
    habitsList.addEventListener('drop', handleDrop);
    habitsList.addEventListener('dragend', handleDragEnd);

    // API Functions
    async function fetchHabits() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch habits');
            habits = await response.json();
            // Sort habits by order if it exists
            if (habits[0]?.order !== undefined) {
                habits.sort((a, b) => a.order - b.order);
            }
            renderHabits();
            updateStats();
        } catch (error) {
            console.error('Error fetching habits:', error);
            habitsList.innerHTML = `<p class="error">Error loading habits. Please try again.</p>`;
        }
    }

    async function addHabit(e) {
        e.preventDefault();
        const habitName = habitInput.value.trim();
        if (!habitName) return;

        const newHabit = {
            name: habitName,
            completed: false,
            streak: 0,
            lastCompleted: null,
            createdAt: new Date().toISOString(),
            category: habitCategory.value,
            order: habits.length // Set initial order
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newHabit)
            });

            if (!response.ok) throw new Error('Failed to add habit');
            const createdHabit = await response.json();
            habits.push(createdHabit);
            habitInput.value = '';
            renderHabits();
            updateStats();
        } catch (error) {
            console.error('Error adding habit:', error);
            alert('Failed to add habit. Please try again.');
        }
    }

    async function toggleHabitComplete(e) {
        const habitId = parseInt(e.target.dataset.id);
        const habitIndex = habits.findIndex(h => h.id === habitId);
        if (habitIndex === -1) return;

        const updatedHabit = { ...habits[habitIndex] };
        updatedHabit.completed = !updatedHabit.completed;

        const today = new Date().toDateString();
        if (updatedHabit.completed) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (!updatedHabit.lastCompleted ||
                new Date(updatedHabit.lastCompleted).toDateString() === yesterday.toDateString()) {
                updatedHabit.streak += 1;
            } else if (new Date(updatedHabit.lastCompleted).toDateString() !== today) {
                updatedHabit.streak = 1;
            }

            updatedHabit.lastCompleted = new Date().toISOString();
        }

        try {
            const response = await fetch(`${API_URL}/${habitId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedHabit)
            });

            if (!response.ok) throw new Error('Failed to update habit');
            habits[habitIndex] = updatedHabit;
            renderHabits();
            updateStats();
            generateCalendar(currentMonth, currentYear); // Update calendar view
        } catch (error) {
            console.error('Error updating habit:', error);
            e.target.checked = !e.target.checked;
        }
    }

    async function deleteHabit(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const habitId = button.dataset.id;
        if (!habitId) return;

        if (!confirm('Are you sure you want to delete this habit?')) return;

        try {
            const response = await fetch(`${API_URL}/${habitId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            habits = habits.filter(habit => habit.id !== habitId);
            renderHabits();
            updateStats();
            generateCalendar(currentMonth, currentYear); // Update calendar view
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete habit. Please check console for details.');
        }
    }

    // Drag and Drop Functions
    function handleDragStart(e) {
        if (e.target.classList.contains('habit-item')) {
            draggedItem = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = getDragAfterElement(habitsList, e.clientY);
        const currentItem = document.querySelector('.dragging');
        
        if (!currentItem) return;
        
        if (afterElement == null) {
            habitsList.appendChild(currentItem);
        } else {
            habitsList.insertBefore(currentItem, afterElement);
        }
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
    }

    function handleDragEnd(e) {
        if (e.target.classList.contains('habit-item')) {
            e.target.classList.remove('dragging');
            updateHabitOrder();
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.habit-item:not(.dragging)')];
        
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

    async function updateHabitOrder() {
        const items = habitsList.querySelectorAll('.habit-item');
        const newOrder = Array.from(items).map(item => parseInt(item.dataset.id));
        
        // Update local habits array order
        habits.sort((a, b) => {
            return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
        });
        
        // Update backend with new order
        try {
            const updatePromises = habits.map((habit, index) => {
                return fetch(`${API_URL}/${habit.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ order: index })
                });
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error updating habit order:', error);
        }
    }

    // UI Functions
    function renderHabits() {
        habitsList.innerHTML = '';

        let filteredHabits = habits;
        if (currentFilter === 'active') {
            filteredHabits = habits.filter(habit => !habit.completed);
        } else if (currentFilter === 'completed') {
            filteredHabits = habits.filter(habit => habit.completed);
        }

        if (currentCategoryFilter !== 'all') {
            filteredHabits = filteredHabits.filter(habit => habit.category === currentCategoryFilter);
        }

        if (filteredHabits.length === 0) {
            habitsList.innerHTML = '<p class="no-habits">No habits found. Add some!</p>';
            return;
        }

        filteredHabits.forEach(habit => {
            const habitEl = document.createElement('div');
            habitEl.className = `habit-item ${habit.completed ? 'habit-completed' : ''}`;
            habitEl.draggable = true;
            habitEl.dataset.id = habit.id;
            habitEl.innerHTML = `
                <div class="habit-info">
                    <input type="checkbox" class="habit-checkbox" ${habit.completed ? 'checked' : ''} data-id="${habit.id}">
                    <span class="habit-name">${habit.name}</span>
                    <span class="habit-category category-${habit.category}">${habit.category}</span>
                </div>
                <div class="habit-actions">
                    <span class="habit-streak">${habit.streak || 0} 🔥</span>
                    <button class="delete-btn" data-id="${habit.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            habitsList.appendChild(habitEl);
        });

        document.querySelectorAll('.habit-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', toggleHabitComplete);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteHabit);
        });
    }

    function filterHabits(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        renderHabits();
    }

    function updateStats() {
        if (habits.length === 0) {
            currentStreakEl.textContent = '0 days';
            completionRateEl.textContent = '0%';
            dailyProgressEl.textContent = '0/0';
            return;
        }

        const longestStreak = Math.max(...habits.map(habit => habit.streak || 0));
        currentStreakEl.textContent = `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`;

        const completedCount = habits.filter(habit => habit.completed).length;
        const completionRate = Math.round((completedCount / habits.length) * 100);
        completionRateEl.textContent = `${completionRate}%`;

        // Daily progress (habits completed today)
        const today = new Date().toDateString();
        const todayCompleted = habits.filter(habit => 
            habit.completed && habit.lastCompleted && new Date(habit.lastCompleted).toDateString() === today
        ).length;
        dailyProgressEl.textContent = `${todayCompleted}/${habits.length}`;
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);

        const icon = themeBtn.querySelector('i');
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }

    function toggleView() {
        const isCalendarView = calendarView.style.display === 'block';
        if (isCalendarView) {
            calendarView.style.display = 'none';
            habitsList.style.display = 'block';
            viewToggle.textContent = 'Calendar View';
        } else {
            calendarView.style.display = 'block';
            habitsList.style.display = 'none';
            viewToggle.textContent = 'List View';
            generateCalendar(currentMonth, currentYear);
        }
    }

    // Calendar Functions
    function showPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    }

    function showNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    }

    function generateCalendar(month, year) {
        calendarGrid.innerHTML = '';
        currentMonthEl.textContent = new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayCell.appendChild(dayHeader);
            
            // Add habits for this day
            const dateStr = new Date(year, month, day).toISOString().split('T')[0];
            const dayHabits = habits.filter(habit => 
                habit.completed && habit.lastCompleted && habit.lastCompleted.split('T')[0] === dateStr
            );
            
            dayHabits.forEach(habit => {
                const habitEl = document.createElement('div');
                habitEl.className = 'calendar-habit';
                habitEl.innerHTML = `
                    <span class="habit-name">${habit.name}</span>
                    <span class="habit-category category-${habit.category}">${habit.category}</span>
                `;
                dayCell.appendChild(habitEl);
            });
            
            calendarGrid.appendChild(dayCell);
        }
    }

    // Reminder Functions
    function setReminder() {
        const time = reminderTime.value;
        if (!time) {
            alert('Please select a time for your reminder');
            return;
        }

        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    localStorage.setItem('reminderTime', time);
                    alert(`Daily reminder set for ${time}`);
                    scheduleReminder(time);
                } else {
                    alert('Please enable notifications for reminders to work');
                }
            });
        } else {
            alert('Notifications not supported in your browser');
        }
    }

    function checkReminder() {
        const savedTime = localStorage.getItem('reminderTime');
        if (savedTime) {
            reminderTime.value = savedTime;
            scheduleReminder(savedTime);
        }
    }

    function scheduleReminder(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const reminderTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hours,
            minutes
        );

        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const timeout = reminderTime - now;
        
        setTimeout(() => {
            showReminderNotification();
            // Schedule the next day's reminder
            scheduleReminder(time);
        }, timeout);
    }

    function showReminderNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Smart Habit Reminder', {
                body: 'Time to check your daily habits!',
                icon: 'path/to/icon.png'
            });
        }
    }

    function checkThemePreference() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            const icon = themeBtn.querySelector('i');
            icon.className = 'fas fa-sun';
        }
    }
});
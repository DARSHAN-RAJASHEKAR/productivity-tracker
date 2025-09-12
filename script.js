// Data structure
let data = {
    today: [],
    fullweek: [],
    fullmonth: [],
    weekdays: [],
    habits: [],
    reminders: [],
    completions: {} // Track daily completions
};

// Current active tab and page
let currentTab = 'today';
let currentPage = 'home';

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    await removeExpiredTasks(); // Clean up expired tasks on load
    updateCurrentDate();
    updateTodaysTasks();
    updateStats();
    updateHabitsTracker();
    updateReminders();
    updateManagementView();
    
    // Show home page by default
    showPage('home');
    
    // Set up tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Initialize default tab
    switchTab('today');
    
    // Set up enter key handlers for inputs
    ['today', 'fullweek', 'fullmonth', 'weekdays', 'habits'].forEach(type => {
        const input = document.getElementById(`${type}-input`);
        const timeInput = document.getElementById(`${type}-time`);
        
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    if (type === 'habits') {
                        addHabit();
                    } else {
                        addTask(type);
                    }
                }
            });
        }
        
        if (timeInput) {
            timeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    if (type === 'habits') {
                        addHabit();
                    } else {
                        addTask(type);
                    }
                }
            });
        }
    });
    
    // Set up reminder input handlers
    const reminderText = document.getElementById('reminder-text');
    if (reminderText) {
        reminderText.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addReminder();
            }
        });
    }
    
    // Set up import file handler
    const importFile = document.getElementById('import-file');
    if (importFile) {
        importFile.addEventListener('change', handleFileImport);
    }
    
    // Check reminders every minute
    setInterval(checkReminders, 60000);
    checkReminders(); // Initial check
});

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dayOptions = { weekday: 'long' };
    
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('current-day').textContent = `Today is ${now.toLocaleDateString('en-US', dayOptions)}`;
}

// Page switching
function showPage(page) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="showPage('${page}')"]`).classList.add('active');
    
    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
    });
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    currentPage = page;
    
    if (page === 'management') {
        updateManagementView();
    }
}

// Date calculation utilities
function getEndOfDay() {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
}

function getEndOfCurrentWeek() {
    const date = new Date();
    const day = date.getDay();
    const daysUntilSunday = (7 - day) % 7;
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + daysUntilSunday);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
}

function getEndOfCurrentMonth() {
    const date = new Date();
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
}

function getEndOfCurrentWeekdays() {
    const date = new Date();
    const day = date.getDay();
    let daysUntilFriday;
    
    if (day === 0) { // Sunday
        daysUntilFriday = 5; // Next Friday
    } else if (day === 6) { // Saturday
        daysUntilFriday = 6; // Next Friday
    } else { // Monday to Friday
        daysUntilFriday = 5 - day; // Days until Friday
    }
    
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + daysUntilFriday);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
}

function getTaskExpiryDate(type) {
    switch(type) {
        case 'today':
            return getEndOfDay();
        case 'fullweek':
            return getEndOfCurrentWeek();
        case 'fullmonth':
            return getEndOfCurrentMonth();
        case 'weekdays':
            return getEndOfCurrentWeekdays();
        default:
            return null;
    }
}

// Check if task has expired
function isTaskExpired(task) {
    if (!task.expiresAt) return false;
    return new Date() > new Date(task.expiresAt);
}

// Remove expired tasks
async function removeExpiredTasks() {
    try {
        await api.deleteExpiredTasks();
        // Also filter local data
        ['today', 'fullweek', 'fullmonth', 'weekdays'].forEach(type => {
            if (data[type] && Array.isArray(data[type])) {
                data[type] = data[type].filter(task => !isTaskExpired(task));
            }
        });
    } catch (error) {
        console.error('Error removing expired tasks:', error);
    }
}

// Tab switching
function switchTab(tab) {
    console.log('switchTab called with:', tab);
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabButton = document.querySelector(`[data-tab="${tab}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    } else {
        console.error('Tab button not found for:', tab);
    }
    
    // Show/hide content
    document.querySelectorAll('.list-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const tabContent = document.getElementById(`${tab}-list`);
    if (tabContent) {
        tabContent.classList.remove('hidden');
    } else {
        console.error('Tab content not found for:', tab);
    }
    
    currentTab = tab;
    updateListDisplay(tab);
    updateManagementView();
}

// Add task to list
async function addTask(type) {
    console.log('addTask called with type:', type);
    const input = document.getElementById(`${type}-input`);
    console.log('Input element found:', input);
    const text = input ? input.value.trim() : '';
    console.log('Text value:', text);
    
    if (!text) {
        console.log('No text, returning');
        return;
    }
    
    // Check if daily tracking is enabled for this task type
    const dailyTrackingCheckbox = document.getElementById(`${type}-daily-tracking`);
    const isDailyTracking = dailyTrackingCheckbox ? dailyTrackingCheckbox.checked : false;
    
    // Get optional time
    const timeInput = document.getElementById(`${type}-time`);
    const time = timeInput ? timeInput.value : '';
    
    // Create display text with time if provided
    let displayText = text;
    if (time) {
        // Convert 24-hour to 12-hour format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        displayText = `${text} - ${displayHour}:${minutes} ${ampm}`;
    }
    
    const taskData = {
        text: displayText,
        original_text: text,
        time: time,
        type: type,
        completed: false,
        expires_at: getTaskExpiryDate(type)?.toISOString() || null,
        is_daily_tracking: isDailyTracking,
        daily_completions: {}
    };
    
    try {
        const result = await api.addTask(taskData);
        
        // Add to local data with returned ID
        const task = {
            id: result[0].id,
            text: displayText,
            originalText: text,
            time: time,
            completed: false,
            createdAt: result[0].created_at,
            expiresAt: taskData.expires_at,
            isDailyTracking: isDailyTracking,
            dailyCompletions: {}
        };
        
        data[type].push(task);
        input.value = '';
        
        // Reset daily tracking checkbox and time input
        if (dailyTrackingCheckbox) {
            dailyTrackingCheckbox.checked = false;
        }
        if (timeInput) {
            timeInput.value = '';
        }
        
        updateListDisplay(type);
        updateTodaysTasks();
        updateStats();
        if (currentPage === 'management') {
            updateManagementView();
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
    }
}

// Add habit
async function addHabit() {
    const input = document.getElementById('habits-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Get optional time
    const timeInput = document.getElementById('habits-time');
    const time = timeInput ? timeInput.value : '';
    
    // Create display text with time if provided
    let displayText = text;
    if (time) {
        // Convert 24-hour to 12-hour format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        displayText = `${text} - ${displayHour}:${minutes} ${ampm}`;
    }
    
    const habitData = {
        text: displayText,
        original_text: text,
        time: time,
        streak: 0,
        last_completed: null
    };
    
    try {
        const result = await api.addHabit(habitData);
        
        const habit = {
            id: result[0].id,
            text: displayText,
            originalText: text,
            time: time,
            streak: 0,
            lastCompleted: null,
            createdAt: result[0].created_at
        };
        
        data.habits.push(habit);
        input.value = '';
        
        // Reset time input
        if (timeInput) {
            timeInput.value = '';
        }
        
        updateListDisplay('habits');
        updateHabitsTracker();
        if (currentPage === 'management') {
            updateManagementView();
        }
    } catch (error) {
        console.error('Error adding habit:', error);
        alert('Failed to add habit. Please try again.');
    }
}

// Update list display in sidebar
function updateListDisplay(type) {
    const container = document.getElementById(`${type}-items`);
    if (!container) return;
    
    container.innerHTML = '';
    
    const items = data[type] || [];
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic; padding: 1rem;">No items yet</p>';
        return;
    }
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `list-item ${item.completed ? 'completed' : ''}`;
        
        if (type === 'habits') {
            div.innerHTML = `
                <input type="checkbox" ${item.streak > 0 && isCompletedToday(item) ? 'checked' : ''} 
                       onchange="toggleHabit(${item.id})">
                <span class="list-item-text">
                    ${item.text}
                    <small style="display: block; color: #64748b;">Streak: ${item.streak} days</small>
                </span>
                <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else {
            const today = new Date().toDateString();
            const isCompletedToday = item.isDailyTracking ? 
                (item.dailyCompletions && item.dailyCompletions[today]) : 
                item.completed;
            
            let completionInfo = '';
            if (item.isDailyTracking) {
                const completedDays = Object.values(item.dailyCompletions || {}).filter(Boolean).length;
                completionInfo = `<small style="display: block; color: #64748b;">Daily tracking - ${completedDays} days completed</small>`;
            }
            
            div.innerHTML = `
                <input type="checkbox" ${isCompletedToday ? 'checked' : ''} 
                       onchange="toggleTask('${type}', ${item.id})">
                <span class="list-item-text">
                    ${item.text}
                    ${completionInfo}
                </span>
                <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        container.appendChild(div);
    });
}

// Toggle task completion
async function toggleTask(type, id) {
    const item = data[type].find(task => task.id === id);
    if (item) {
        let updates = {};
        
        if (item.isDailyTracking) {
            // Handle daily tracking tasks
            const today = new Date().toDateString();
            if (!item.dailyCompletions) {
                item.dailyCompletions = {};
            }
            item.dailyCompletions[today] = !item.dailyCompletions[today];
            updates = {
                daily_completions: item.dailyCompletions
            };
        } else {
            // Handle regular tasks
            item.completed = !item.completed;
            updates = {
                completed: item.completed
            };
        }
        
        try {
            await api.updateTask(id, updates);
            
            updateListDisplay(type);
            updateTodaysTasks();
            updateStats();
            if (currentPage === 'management') {
                updateManagementView();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            // Revert local changes on error
            if (item.isDailyTracking) {
                const today = new Date().toDateString();
                item.dailyCompletions[today] = !item.dailyCompletions[today];
            } else {
                item.completed = !item.completed;
            }
        }
    }
}

// Toggle habit completion
async function toggleHabit(id) {
    const habit = data.habits.find(h => h.id === id);
    if (!habit) return;
    
    const today = new Date().toDateString();
    const wasCompletedToday = isCompletedToday(habit);
    
    let newStreak = habit.streak;
    let newLastCompleted = habit.lastCompleted;
    
    if (wasCompletedToday) {
        // Uncheck - decrease streak
        newStreak = Math.max(0, habit.streak - 1);
        newLastCompleted = newStreak > 0 ? 
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : null;
    } else {
        // Check - increase streak
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        const lastCompletedDate = habit.lastCompleted ? 
            new Date(habit.lastCompleted).toDateString() : null;
        
        if (!habit.lastCompleted || lastCompletedDate === yesterday) {
            newStreak += 1;
        } else {
            newStreak = 1; // Reset streak if not consecutive
        }
        
        newLastCompleted = new Date().toISOString();
    }
    
    try {
        await api.updateHabit(id, {
            streak: newStreak,
            last_completed: newLastCompleted
        });
        
        habit.streak = newStreak;
        habit.lastCompleted = newLastCompleted;
        
        updateListDisplay('habits');
        updateHabitsTracker();
        updateStats();
    } catch (error) {
        console.error('Error updating habit:', error);
    }
}

// Check if habit was completed today
function isCompletedToday(habit) {
    if (!habit.lastCompleted) return false;
    const today = new Date().toDateString();
    const lastCompletedDate = new Date(habit.lastCompleted).toDateString();
    return today === lastCompletedDate;
}

// Delete item
async function deleteItem(type, id) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            if (type === 'habits') {
                await api.deleteHabit(id);
            } else {
                await api.deleteTask(id);
            }
            
            data[type] = data[type].filter(item => item.id !== id);
            updateListDisplay(type);
            if (type !== 'habits') {
                updateTodaysTasks();
                updateStats();
            } else {
                updateHabitsTracker();
            }
            if (currentPage === 'management') {
                updateManagementView();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

// Update today's tasks in dashboard
function updateTodaysTasks() {
    const container = document.getElementById('today-tasks');
    if (!container) return;
    
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let todaysTasks = [];
    
    // Add today tasks (always show)
    data.today.forEach(task => {
        todaysTasks.push({ ...task, type: 'today' });
    });
    
    // Add full week tasks (always show during the week)
    data.fullweek.forEach(task => {
        todaysTasks.push({ ...task, type: 'fullweek' });
    });
    
    // Add full month tasks (always show during the month)
    data.fullmonth.forEach(task => {
        todaysTasks.push({ ...task, type: 'fullmonth' });
    });
    
    // Add weekdays tasks (only Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        data.weekdays.forEach(task => {
            todaysTasks.push({ ...task, type: 'weekdays' });
        });
    }
    
    if (todaysTasks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic; padding: 2rem;">No tasks for today</p>';
        return;
    }
    
    container.innerHTML = todaysTasks.map(task => {
        const today = new Date().toDateString();
        const isCompletedToday = task.isDailyTracking ? 
            (task.dailyCompletions && task.dailyCompletions[today]) : 
            task.completed;
        
        return `
            <div class="task-item ${isCompletedToday ? 'completed' : ''}">
                <input type="checkbox" ${isCompletedToday ? 'checked' : ''} 
                       onchange="toggleTask('${task.type}', ${task.id})">
                <span class="task-text">${task.text}</span>
                <span class="task-type ${task.type}">${task.type}${task.isDailyTracking ? ' (daily)' : ''}</span>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const now = new Date();
    const today = now.toDateString();
    
    // Calculate today's completed and total tasks
    let completedToday = 0;
    let totalToday = 0;
    const dayOfWeek = now.getDay();
    
    // Helper function to check if task is completed for today
    const isTaskCompletedToday = (task) => {
        if (task.isDailyTracking) {
            return task.dailyCompletions && task.dailyCompletions[today];
        }
        return task.completed;
    };
    
    // Count today tasks
    data.today.forEach(task => {
        totalToday++;
        if (isTaskCompletedToday(task)) completedToday++;
    });
    
    // Count full week tasks
    data.fullweek.forEach(task => {
        totalToday++;
        if (isTaskCompletedToday(task)) completedToday++;
    });
    
    // Count full month tasks
    data.fullmonth.forEach(task => {
        totalToday++;
        if (isTaskCompletedToday(task)) completedToday++;
    });
    
    // Count weekdays tasks (only Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        data.weekdays.forEach(task => {
            totalToday++;
            if (isTaskCompletedToday(task)) completedToday++;
        });
    }
    
    // Calculate current streak (consecutive days with all tasks completed)
    let streak = 0;
    const completionHistory = data.completions || {};
    let checkDate = new Date(now);
    
    while (true) {
        const dateStr = checkDate.toDateString();
        if (completionHistory[dateStr] === true) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Update completion for today if all tasks are done
    const todayCompleted = totalToday > 0 && completedToday === totalToday;
    if (data.completions[today] !== todayCompleted) {
        data.completions[today] = todayCompleted;
        // Save to Supabase
        api.setCompletion(today, todayCompleted).catch(error => {
            console.error('Error updating completion:', error);
        });
    }
    
    // Update display
    document.getElementById('completed-today').textContent = completedToday;
    document.getElementById('total-today').textContent = totalToday;
    document.getElementById('streak-count').textContent = streak;
}

// Update habits tracker in dashboard
function updateHabitsTracker() {
    const container = document.getElementById('habits-tracker');
    if (!container) return;
    
    if (data.habits.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic; padding: 2rem;">No habits tracked</p>';
        return;
    }
    
    container.innerHTML = data.habits.map(habit => `
        <div class="habit-item">
            <div class="habit-info">
                <div class="habit-name">${habit.text}</div>
                <div class="habit-streak">${habit.streak} day streak</div>
            </div>
            <input type="checkbox" class="habit-check" 
                   ${isCompletedToday(habit) ? 'checked' : ''} 
                   onchange="toggleHabit(${habit.id})">
        </div>
    `).join('');
}

// Add reminder
async function addReminder() {
    const textInput = document.getElementById('reminder-text');
    const timeInput = document.getElementById('reminder-time');
    
    const text = textInput.value.trim();
    const time = timeInput.value;
    
    if (!text || !time) {
        alert('Please enter both reminder text and time');
        return;
    }
    
    const reminderData = {
        text: text,
        time: new Date(time).toISOString(),
        completed: false,
        notified: false
    };
    
    try {
        const result = await api.addReminder(reminderData);
        
        const reminder = {
            id: result[0].id,
            text: text,
            time: reminderData.time,
            completed: false,
            notified: false
        };
        
        data.reminders.push(reminder);
        textInput.value = '';
        timeInput.value = '';
        
        updateReminders();
    } catch (error) {
        console.error('Error adding reminder:', error);
        alert('Failed to add reminder. Please try again.');
    }
}

// Update reminders display
function updateReminders() {
    const container = document.getElementById('reminders-list');
    if (!container) return;
    
    const activeReminders = data.reminders.filter(r => !r.completed);
    
    if (activeReminders.length === 0) {
        container.innerHTML = '<p class="no-reminders">No reminders set</p>';
        return;
    }
    
    // Sort by time
    activeReminders.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    const now = new Date();
    
    container.innerHTML = activeReminders.map(reminder => {
        const reminderTime = new Date(reminder.time);
        const isOverdue = reminderTime < now;
        
        return `
            <div class="reminder-item ${isOverdue ? 'overdue' : ''}">
                <div class="reminder-text">${reminder.text}</div>
                <div class="reminder-time">${reminderTime.toLocaleString()}</div>
                <button class="delete-btn" onclick="deleteReminder(${reminder.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Delete reminder
async function deleteReminder(id) {
    try {
        await api.deleteReminder(id);
        data.reminders = data.reminders.filter(r => r.id !== id);
        updateReminders();
    } catch (error) {
        console.error('Error deleting reminder:', error);
        alert('Failed to delete reminder. Please try again.');
    }
}

// Check for overdue reminders
function checkReminders() {
    const now = new Date();
    data.reminders.forEach(reminder => {
        const reminderTime = new Date(reminder.time);
        if (reminderTime <= now && !reminder.completed && !reminder.notified) {
            // Show notification (if browser supports it)
            if (Notification.permission === 'granted') {
                new Notification('Reminder', {
                    body: reminder.text,
                    icon: '/favicon.ico'
                });
            }
            reminder.notified = true;
        }
    });
}

// Clear completed tasks
function clearCompleted() {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        data.daily = data.daily.filter(task => !task.completed);
        data.weekly = data.weekly.filter(task => !task.completed);
        data.monthly = data.monthly.filter(task => !task.completed);
        
        updateListDisplay(currentTab);
        updateTodaysTasks();
        updateStats();
        if (currentPage === 'management') {
            updateManagementView();
        }
    }
}

// Export data
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `productivity-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import data
function importData() {
    document.getElementById('import-file').click();
}

// Handle file import
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm('This will replace all current data. Are you sure?')) {
                data = importedData;
                updateListDisplay(currentTab);
                updateTodaysTasks();
                updateStats();
                updateHabitsTracker();
                updateReminders();
                if (currentPage === 'management') {
                    updateManagementView();
                }
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// No longer needed - data is saved directly to Supabase in each operation

// Load data from Supabase
async function loadData() {
    try {
        data = await api.loadAllData();
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // Fall back to localStorage if available
        const saved = localStorage.getItem('productivityData');
        if (saved) {
            try {
                const loadedData = JSON.parse(saved);
                data = {
                    today: loadedData.today || loadedData.daily || [],
                    fullweek: loadedData.fullweek || loadedData.weekly || [],
                    fullmonth: loadedData.fullmonth || loadedData.monthly || [],
                    weekdays: loadedData.weekdays || [],
                    habits: loadedData.habits || [],
                    reminders: loadedData.reminders || [],
                    completions: loadedData.completions || {}
                };
            } catch (parseError) {
                console.error('Error parsing localStorage data:', parseError);
                initializeEmptyData();
            }
        } else {
            initializeEmptyData();
        }
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    updateListDisplay(currentTab);
}

function initializeEmptyData() {
    data = {
        today: [],
        fullweek: [],
        fullmonth: [],
        weekdays: [],
        habits: [],
        reminders: [],
        completions: {}
    };
}

// Update management view with current tab info
function updateManagementView() {
    if (currentPage !== 'management') return;
    
    const tabNames = {
        today: 'Today Tasks',
        fullweek: 'Full Week Tasks',
        fullmonth: 'Full Month Tasks',
        weekdays: 'Weekdays Tasks',
        habits: 'Habits'
    };
    
    const tabDescriptions = {
        today: 'Tasks that expire at end of day',
        fullweek: 'Tasks that run until end of current week',
        fullmonth: 'Tasks that run until end of current month',
        weekdays: 'Tasks that run Monday through Friday only',
        habits: 'Track and build positive habits'
    };
    
    const tips = {
        today: [
            'Today tasks expire at the end of the day to maintain focus.',
            'Keep today tasks simple and achievable.',
            'Perfect for urgent or daily routine items.'
        ],
        fullweek: [
            'Full week tasks run until Sunday of the current week.',
            'Great for weekly goals and objectives.',
            'Tasks created mid-week still expire on Sunday.',
            'Use "Daily tracking" to complete the same task each day of the week.'
        ],
        fullmonth: [
            'Full month tasks run until the end of the current month.',
            'Perfect for monthly projects and larger goals.',
            'Tasks created mid-month still expire at month end.',
            'Enable "Daily tracking" to track daily progress throughout the month.'
        ],
        weekdays: [
            'Weekdays tasks run Monday through Friday only.',
            'Perfect for work-related or business day tasks.',
            'Tasks created mid-week run until Friday.',
            'Use "Daily tracking" for tasks you need to complete every workday.'
        ],
        habits: [
            'Start with small, easy habits to build consistency.',
            'Track habits daily to maintain accountability.',
            'Celebrate streaks to reinforce positive behaviors.'
        ]
    };
    
    // Update header
    document.getElementById('management-title').textContent = tabNames[currentTab];
    document.getElementById('management-subtitle').textContent = tabDescriptions[currentTab];
    
    // Update overview cards
    const currentList = data[currentTab] || [];
    const completed = currentList.filter(item => {
        if (currentTab === 'habits') {
            return isCompletedToday(item);
        } else {
            return item.completed;
        }
    }).length;
    const pending = currentList.length - completed;
    
    document.getElementById('current-list-count').textContent = currentList.length;
    document.getElementById('current-list-label').textContent = tabNames[currentTab];
    document.getElementById('current-list-completed').textContent = completed;
    document.getElementById('current-list-pending').textContent = pending;
    
    // Update tips
    const tipsContent = document.getElementById('management-tips-content');
    tipsContent.innerHTML = tips[currentTab].map(tip => 
        `<p><i class="fas fa-lightbulb"></i> ${tip}</p>`
    ).join('');
}
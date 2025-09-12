// Supabase API Layer for Productivity Tracker

class ProductivityAPI {
    constructor() {
        this.baseURL = API_BASE;
        this.headers = SUPABASE_HEADERS;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Tasks API
    async getTasks() {
        return await this.request('/tasks?select=*&order=created_at.desc');
    }

    async addTask(task) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        });
    }

    async updateTask(id, updates) {
        return await this.request(`/tasks?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    async deleteTask(id) {
        return await this.request(`/tasks?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    async deleteExpiredTasks() {
        const now = new Date().toISOString();
        return await this.request(`/tasks?expires_at=lt.${now}`, {
            method: 'DELETE'
        });
    }

    // Habits API
    async getHabits() {
        return await this.request('/habits?select=*&order=created_at.desc');
    }

    async addHabit(habit) {
        return await this.request('/habits', {
            method: 'POST',
            body: JSON.stringify(habit)
        });
    }

    async updateHabit(id, updates) {
        return await this.request(`/habits?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    async deleteHabit(id) {
        return await this.request(`/habits?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    // Reminders API
    async getReminders() {
        return await this.request('/reminders?completed=eq.false&order=time.asc');
    }

    async addReminder(reminder) {
        return await this.request('/reminders', {
            method: 'POST',
            body: JSON.stringify(reminder)
        });
    }

    async deleteReminder(id) {
        return await this.request(`/reminders?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    // Completions API
    async getCompletions() {
        return await this.request('/completions?select=*');
    }

    async setCompletion(date, completed) {
        // Use upsert to insert or update
        return await this.request('/completions', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ date, completed })
        });
    }

    // Load all data at once
    async loadAllData() {
        try {
            const [tasks, habits, reminders, completions] = await Promise.all([
                this.getTasks(),
                this.getHabits(),
                this.getReminders(),
                this.getCompletions()
            ]);

            // Organize tasks by type
            const data = {
                today: [],
                fullweek: [],
                fullmonth: [],
                weekdays: [],
                habits: [],
                reminders: [],
                completions: {}
            };

            // Group tasks by type
            tasks.forEach(task => {
                if (data[task.type]) {
                    data[task.type].push({
                        id: task.id,
                        text: task.text,
                        originalText: task.original_text,
                        time: task.time,
                        completed: task.completed,
                        createdAt: task.created_at,
                        expiresAt: task.expires_at,
                        isDailyTracking: task.is_daily_tracking,
                        dailyCompletions: task.daily_completions || {}
                    });
                }
            });

            // Format habits
            data.habits = habits.map(habit => ({
                id: habit.id,
                text: habit.text,
                originalText: habit.original_text,
                time: habit.time,
                streak: habit.streak || 0,
                lastCompleted: habit.last_completed,
                createdAt: habit.created_at
            }));

            // Format reminders
            data.reminders = reminders.map(reminder => ({
                id: reminder.id,
                text: reminder.text,
                time: reminder.time,
                completed: reminder.completed,
                notified: reminder.notified || false
            }));

            // Format completions
            completions.forEach(comp => {
                data.completions[comp.date] = comp.completed;
            });

            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
}

// Create global API instance
const api = new ProductivityAPI();
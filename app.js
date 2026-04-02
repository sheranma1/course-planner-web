// app.js
let courses = JSON.parse(localStorage.getItem('courses')) || [];
let currentEditingId = null;

const grid = document.getElementById('calendar-grid');
const addBtn = document.getElementById('add-course-btn');
const modal = document.getElementById('course-modal');
const closeModal = document.getElementById('close-modal');
const courseForm = document.getElementById('course-form');
const deleteBtn = document.getElementById('delete-course-btn');
const modalTitle = document.getElementById('modal-title');

const COLORS = [
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#f43f5e', // Rose
    '#84cc16', // Lime
    '#06b6d4', // Cyan
];

function initGrid() {
    grid.innerHTML = '';
    // 8:00 to 22:00 (15 slots)
    for (let h = 8; h <= 22; h++) {
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${h.toString().padStart(2, '0')}:00`;
        grid.appendChild(timeLabel);

        for (let d = 0; d < 7; d++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            grid.appendChild(cell);
        }
    }
    renderCourses();
    updateStats();
}

function renderCourses() {
    // Clear only course cards
    document.querySelectorAll('.course-card').forEach(c => c.remove());

    courses.forEach((course, index) => {
        const card = document.createElement('div');
        card.className = 'course-card';
        const color = course.color || COLORS[index % COLORS.length];
        card.style.backgroundColor = color;
        
        // Day column calculation (Mon=1, Tue=2, ..., Sun=0)
        // Grid columns: 1 (Time), 2 (Mon), 3 (Tue), 4 (Wed), 5 (Thu), 6 (Fri), 7 (Sat), 8 (Sun)
        let dayVal = parseInt(course.day);
        let dayCol = dayVal === 0 ? 8 : dayVal + 1;

        const [startH, startM] = course.startTime.split(':').map(Number);
        const [endH, endM] = course.endTime.split(':').map(Number);

        // 60px per hour = 1px per min
        const startOffset = (startH - 8) * 60 + startM;
        const duration = (endH - startH) * 60 + (endM - startM);

        if (startOffset < 0 || startOffset > 15 * 60) return; // Outside range

        card.style.gridColumn = `${dayCol} / span 1`;
        card.style.top = `${startOffset}px`;
        card.style.height = `${duration}px`;

        card.innerHTML = `
            <div class="course-title" title="${course.name}">${course.name}</div>
            <div class="course-info">
                <i data-lucide="user" style="width:12px;height:12px"></i>
                ${course.teacher || 'No Instructor'}
            </div>
            <div class="course-info">
                <i data-lucide="clock" style="width:12px;height:12px"></i>
                ${course.startTime} - ${course.endTime}
            </div>
            ${course.syllabusLink ? `
                <a href="${course.syllabusLink}" target="_blank" class="course-info link" onclick="event.stopPropagation()">
                    <i data-lucide="link" style="width:12px;height:12px"></i> Syllabus
                </a>` : ''}
        `;

        card.onclick = () => openEditModal(course.id);
        grid.appendChild(card);
    });
    
    if (window.lucide) lucide.createIcons();
}

function updateStats() {
    document.getElementById('course-count').textContent = courses.length;
    const totalCredits = courses.reduce((sum, c) => sum + parseFloat(c.credits || 0), 0);
    document.getElementById('credit-count').textContent = totalCredits;
}

function saveAndRender() {
    localStorage.setItem('courses', JSON.stringify(courses));
    renderCourses();
    updateStats();
}

// Modal functions
function openEditModal(id) {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    currentEditingId = id;
    modalTitle.textContent = 'Edit Course';
    deleteBtn.classList.remove('hidden');
    
    document.getElementById('course-name').value = course.name;
    document.getElementById('teacher').value = course.teacher;
    document.getElementById('credits').value = course.credits;
    document.getElementById('day').value = course.day;
    document.getElementById('start-time').value = course.startTime;
    document.getElementById('end-time').value = course.endTime;
    document.getElementById('course-color').value = course.color || "#8b5cf6";
    document.getElementById('syllabus-link').value = course.syllabusLink;
    document.getElementById('notes').value = course.notes;

    modal.classList.remove('hidden');
}

addBtn.onclick = () => {
    currentEditingId = null;
    modalTitle.textContent = 'Add Course';
    courseForm.reset();
    deleteBtn.classList.add('hidden');
    modal.classList.remove('hidden');
    
    // Default times
    document.getElementById('start-time').value = "09:00";
    document.getElementById('end-time').value = "12:00";
    document.getElementById('credits').value = 3;
    document.getElementById('day').value = "1";
    document.getElementById('course-color').value = "#8b5cf6";
};

closeModal.onclick = () => modal.classList.add('hidden');
window.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

courseForm.onsubmit = (e) => {
    e.preventDefault();
    
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    if (startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }

    const courseData = {
        id: currentEditingId || Date.now(),
        name: document.getElementById('course-name').value,
        teacher: document.getElementById('teacher').value,
        credits: document.getElementById('credits').value,
        day: document.getElementById('day').value,
        startTime,
        endTime,
        color: document.getElementById('course-color').value,
        syllabusLink: document.getElementById('syllabus-link').value,
        notes: document.getElementById('notes').value,
    };

    if (currentEditingId) {
        courses = courses.map(c => c.id === currentEditingId ? courseData : c);
    } else {
        courses.push(courseData);
    }

    saveAndRender();
    modal.classList.add('hidden');
};

deleteBtn.onclick = () => {
    if (confirm('Are you sure you want to delete this course?')) {
        courses = courses.filter(c => c.id !== currentEditingId);
        saveAndRender();
        modal.classList.add('hidden');
    }
};

// Export/Import
document.getElementById('export-btn').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(courses));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "course_schedule.json");
    downloadAnchor.click();
};

document.getElementById('import-btn').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    courses = imported;
                    saveAndRender();
                } else {
                    alert('Invalid course data format');
                }
            } catch (err) {
                alert('Failed to parse JSON');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Initialize with a sample course if empty
if (courses.length === 0) {
    courses.push({
        id: Date.now(),
        name: "Welcome Course",
        teacher: "Sample Instructor",
        credits: 3,
        day: "1",
        startTime: "10:00",
        endTime: "12:00",
        syllabusLink: "https://google.com",
        notes: "This is a sample course. Click to edit or delete."
    });
    localStorage.setItem('courses', JSON.stringify(courses));
}

window.onload = initGrid;

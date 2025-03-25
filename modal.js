window.currentDateData = {
    _date: {
        year: '2025',
        month: null,
        day: null
    },

    get month() {
        return this._date.month
    },

    set month(value) {
        if (this._date.month !== value) {
            this._date.month = value;
            this._notifyChangeDate('month', value);
        }
    },

    get day() {
        return this._date.day
    },

    set day(value) {
        if (this._date.day !== value) {
            this._date.day = value;
            this._notifyChangeDate('day', value);
        }
    },

    _notifyChangeDate(property, value) {
        const event = new CustomEvent('dateChanged', {
            detail: {
                property, 
                value
            }
        })

        window.dispatchEvent(event)
    },

    currentDate() {
        return new Date(
            this._date.year,
            this._date.month - 1, // Месяцы в Date начинаются с 0
            this._date.day,
            window.currentTimeData.hours,
            window.currentTimeData.minutes
        )
    }
}

window.currentTimeData = {
    _time: {
        hours: null,
        minutes: null
    },

    get hours() {
        return this._time.hours 
    },

    set hours(value) {
        if (this._time.hours !== value) { // Проверяем, изменилось ли значение
            this._time.hours = value;
            this._notifyChangeTime('hours', value);
        }
    },

    get minutes() {
        return this._time.minutes
    },

    set minutes(value) {
        if (this._time.minutes !== value) { // Проверяем, изменилось ли значение
            this._time.minutes = value;
            this._notifyChangeTime('minutes', value);
        }
    },

    _notifyChangeTime(property, value) {
        const event = new CustomEvent('timeChanged', {
            detail: { property, value }
        });
        window.dispatchEvent(event);
    }
}

window.initTime = new Date(2025, 2, 14, 14, 0); 
window.late = 55.7558;
window.lon = 37.6137;

document.getElementById('open-modal').addEventListener('click', function () {
    document.getElementById('modal').classList.remove('hidden');
});

document.getElementById('close-modal').addEventListener('click', function () {
    document.getElementById('modal').classList.add('hidden');
});

// Заполняем месяцы и дни
const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const monthSelect = document.getElementById("month");
const daySelect = document.getElementById("day");

months.forEach((month, index) => {
    let option = document.createElement("option");
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
});

function updateDays() {
    daySelect.innerHTML = "";
    const daysInMonth = new Date(2025, monthSelect.value, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
}

// monthSelect.addEventListener("change", );
updateDays();

// Обновление отображения времени
const timeSlider = document.getElementById("time");
const timeDisplay = document.getElementById("time-display");

startValues()

timeSlider.addEventListener("input", changeSliderValues);
changeSliderValues();

monthSelect.addEventListener('change', function(event) {
    updateDays()
    // console.log(monthSelect.selectedIndex)
    window.currentDateData.month = monthSelect.selectedIndex + 1;

    const date = window.currentDateData.currentDate()

    updateSlider(date)
})

daySelect.addEventListener('change', function(event) {
    window.currentDateData.day = daySelect.selectedIndex + 1;

    const date = window.currentDateData.currentDate()

    updateSlider(date)
})

function updateSlider(date) {
    const late = window.late
    const lon = window.lon

    const times = SunCalc.getTimes(date, late, lon)
    console.log(date)
    const min = times.sunrise.getHours() + times.sunrise.getMinutes() / 60;
    const max = times.sunset.getHours() + times.sunset.getMinutes() / 60;
    timeSlider.min = min;
    timeSlider.max = max;
}


function startValues() {
    const date = window.initTime;

    updateSlider(date);

    timeSlider.value = date.getHours() + date.getMinutes() / 60;
    monthSelect.value = date.getMonth() + 1;
    updateDays()

    daySelect.value = date.getDate()
}

function changeSliderValues() {
    let hours = Math.floor(timeSlider.value);
    // console.log(timeSlider.value)
    let minutes = Math.floor((timeSlider.value - hours) * 60);
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    timeDisplay.textContent = currentTime;
    // console.log(currentTime)

    // Изменяем значение
    window.currentTimeData.hours = hours;
    window.currentTimeData.minutes = minutes;
}







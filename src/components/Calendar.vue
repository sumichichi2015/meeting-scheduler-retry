<template>
  <div class="calendar-wrapper">
    <div class="calendars-container">
      <div v-for="offset in 2" :key="offset" class="calendar">
        <div class="calendar-header">
          <button @click="changeMonth(-1)" v-if="offset === 0">&lt;</button>
          <h3>{{ getMonthTitle(offset) }}</h3>
          <button @click="changeMonth(1)" v-if="offset === 1">&gt;</button>
        </div>
        <div class="calendar-grid">
          <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
          <div
            v-for="date in getDatesForMonth(offset)"
            :key="date.date"
            class="date"
            :class="{
              'other-month': !date.currentMonth,
              'selected': isSelected(date.date),
              'today': isToday(date.date)
            }"
            @click="toggleDate(date)"
          >
            {{ new Date(date.date).getDate() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['dates-selected']);

const currentMonth = ref(new Date());
const selectedDates = ref([]);
const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

const getMonthTitle = (offset) => {
  const date = new Date(currentMonth.value);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

const getDatesForMonth = (offset) => {
  const date = new Date(currentMonth.value);
  date.setMonth(date.getMonth() + offset);
  
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // 月の最初の日を取得
  date.setDate(1);
  const firstDay = date.getDay();
  
  // 月の最後の日を取得
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  // 前月の日数を取得
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  
  const dates = [];
  
  // 前月の日付を追加
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    dates.push({
      date: d.toISOString().split('T')[0],
      currentMonth: false
    });
  }
  
  // 現在の月の日付を追加
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(year, month, i);
    dates.push({
      date: d.toISOString().split('T')[0],
      currentMonth: true
    });
  }
  
  // 次月の日付を追加
  const remainingDays = 42 - dates.length; // 6週間分のグリッドを確保
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i);
    dates.push({
      date: d.toISOString().split('T')[0],
      currentMonth: false
    });
  }
  
  return dates;
};

const changeMonth = (delta) => {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() + delta);
  currentMonth.value = newDate;
};

const toggleDate = (dateObj) => {
  if (!dateObj.currentMonth) return;
  
  const index = selectedDates.value.indexOf(dateObj.date);
  if (index === -1) {
    selectedDates.value.push(dateObj.date);
  } else {
    selectedDates.value.splice(index, 1);
  }
  selectedDates.value.sort();
  emit('dates-selected', selectedDates.value);
};

const isSelected = (date) => {
  return selectedDates.value.includes(date);
};

const isToday = (date) => {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
};
</script>

<style scoped>
.calendar-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.calendars-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.calendar {
  width: 100%;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.calendar-header button {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  padding: 5px 10px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.weekday {
  text-align: center;
  font-weight: bold;
  padding: 5px;
  background-color: #f5f5f5;
}

.date {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.2s;
}

.date:hover:not(.other-month) {
  background-color: #e3f2fd;
}

.other-month {
  color: #ccc;
  cursor: default;
}

.selected {
  background-color: #2196f3;
  color: white;
}

.today {
  border: 2px solid #2196f3;
}

@media (max-width: 768px) {
  .calendars-container {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="calendar">
    <!-- カレンダーのグリッド -->
    <div class="calendar-grid"
      @mousedown="startDragSelect"
      @mousemove="updateDragSelect"
      @mouseup="endDragSelect"
      @mouseleave="endDragSelect"
    >
      <!-- 曜日の行 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-sm font-medium p-2"
          :class="day === '日' ? 'text-red-500' : day === '土' ? 'text-blue-500' : 'text-gray-700'"
        >
          {{ day }}
        </div>
      </div>

      <!-- 日付のグリッド -->
      <div class="grid grid-cols-7 gap-1">
        <template v-for="week in calendar" :key="week[0].date">
          <div
            v-for="day in week"
            :key="day.date"
            class="relative aspect-square"
          >
            <button
              v-if="day.currentMonth"
              @click="toggleDate(day)"
              @mouseenter="handleDragOver(day)"
              class="w-full h-full flex items-center justify-center text-sm focus:outline-none relative"
              :class="[
                isSelected(day.date)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-gray-100',
                day.isToday ? 'font-bold' : '',
                day.dayOfWeek === 0 ? 'text-red-500' : day.dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700',
                isDragging && isInDragRange(day) ? 'bg-indigo-50' : ''
              ]"
            >
              {{ day.dayOfMonth }}
              <div
                v-if="isSelected(day.date)"
                class="absolute inset-0 border-2 border-indigo-500 pointer-events-none"
              ></div>
            </button>
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-sm text-gray-400"
            >
              {{ day.dayOfMonth }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  monthOffset: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:modelValue']);

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
const currentDate = new Date();

// カレンダーのデータを生成
const calendar = computed(() => {
  const date = new Date();
  date.setMonth(date.getMonth() + props.monthOffset);
  date.setDate(1);

  const month = date.getMonth();
  const year = date.getFullYear();

  // 月の最初の日の曜日を取得（0: 日曜日, 6: 土曜日）
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // 月の最終日を取得
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // 前月の最終日を取得
  const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

  const weeks = [];
  let currentWeek = [];
  let currentDay = 1;
  let currentDayOfPrevMonth = lastDayOfPrevMonth - firstDayOfMonth + 1;

  // 前月の日付を埋める
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push({
      date: new Date(year, month - 1, currentDayOfPrevMonth).toISOString().split('T')[0],
      dayOfMonth: currentDayOfPrevMonth,
      currentMonth: false,
      dayOfWeek: i,
      isToday: false
    });
    currentDayOfPrevMonth++;
  }

  // 現在の月の日付を埋める
  while (currentDay <= lastDayOfMonth) {
    const dayOfWeek = (firstDayOfMonth + currentDay - 1) % 7;
    const date = new Date(year, month, currentDay);
    const dateStr = date.toISOString().split('T')[0];

    currentWeek.push({
      date: dateStr,
      dayOfMonth: currentDay,
      currentMonth: true,
      dayOfWeek,
      isToday: dateStr === currentDate.toISOString().split('T')[0]
    });

    if (dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDay++;
  }

  // 次月の日付を埋める
  let nextMonthDay = 1;
  while (currentWeek.length < 7) {
    const dayOfWeek = (firstDayOfMonth + currentDay - 1) % 7;
    currentWeek.push({
      date: new Date(year, month + 1, nextMonthDay).toISOString().split('T')[0],
      dayOfMonth: nextMonthDay,
      currentMonth: false,
      dayOfWeek,
      isToday: false
    });
    nextMonthDay++;
    currentDay++;
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 6週分になるまで次月の日付を追加
  while (weeks.length < 6) {
    const newWeek = [];
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = i;
      newWeek.push({
        date: new Date(year, month + 1, nextMonthDay).toISOString().split('T')[0],
        dayOfMonth: nextMonthDay,
        currentMonth: false,
        dayOfWeek,
        isToday: false
      });
      nextMonthDay++;
    }
    weeks.push(newWeek);
  }

  return weeks;
});

// 日付が選択されているかどうかを判定
const isSelected = (date) => {
  return date in props.modelValue;
};

// 日付の選択/解除
const toggleDate = (dateObj) => {
  if (!dateObj.currentMonth) return;

  const newSelectedDates = { ...props.modelValue };
  if (dateObj.date in newSelectedDates) {
    delete newSelectedDates[dateObj.date];
  } else {
    newSelectedDates[dateObj.date] = true;
  }

  emit('update:modelValue', newSelectedDates);
};

// ドラッグ選択の状態管理
const isDragging = ref(false);
const dragStartDate = ref(null);
const dragEndDate = ref(null);

// ドラッグ選択開始
const startDragSelect = (event) => {
  // 左クリックのみ
  if (event.button !== 0) return;
  isDragging.value = true;
};

// ドラッグ中の日付更新
const handleDragOver = (day) => {
  if (!isDragging.value || !day.currentMonth) return;
  
  if (!dragStartDate.value) {
    dragStartDate.value = day.date;
  }
  dragEndDate.value = day.date;
  
  // ドラッグ範囲内の日付を選択
  const dates = getDatesInRange(dragStartDate.value, dragEndDate.value);
  const newSelectedDates = { ...props.modelValue };
  
  dates.forEach(date => {
    newSelectedDates[date] = true;
  });
  
  emit('update:modelValue', newSelectedDates);
};

// ドラッグ選択終了
const endDragSelect = () => {
  isDragging.value = false;
  dragStartDate.value = null;
  dragEndDate.value = null;
};

// 日付が選択範囲内かどうかを判定
const isInDragRange = (day) => {
  if (!isDragging.value || !dragStartDate.value || !dragEndDate.value) return false;
  
  const date = new Date(day.date);
  const start = new Date(dragStartDate.value);
  const end = new Date(dragEndDate.value);
  
  return date >= start && date <= end;
};

// 指定された範囲内の日付を取得
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 開始日と終了日を正しい順序に並べ替え
  const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start];
  
  for (let date = new Date(rangeStart); date <= rangeEnd; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};
</script>

<style scoped>
.calendar {
  @apply w-full;
}

.calendar-grid {
  @apply border border-gray-200 rounded-lg bg-white p-4;
}
</style>

<template>
  <div class="calendar">
    <div class="flex items-center justify-between mb-4">
      <button
        @click="previousMonth"
        class="p-2 hover:bg-gray-100 rounded-full"
      >
        ←
      </button>
      <h3 class="text-lg font-semibold">
        {{ currentYear }}年{{ currentMonth + 1 }}月
      </h3>
      <button
        @click="nextMonth"
        class="p-2 hover:bg-gray-100 rounded-full"
      >
        →
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <!-- 曜日のヘッダー -->
      <div
        v-for="day in ['日', '月', '火', '水', '木', '金', '土']"
        :key="day"
        class="text-center py-2 text-sm font-medium"
        :class="{ 'text-red-500': day === '日', 'text-blue-500': day === '土' }"
      >
        {{ day }}
      </div>

      <!-- 日付のグリッド -->
      <button
        v-for="{ date, isCurrentMonth, isSelected, isDisabled } in calendarDays"
        :key="date.toISOString()"
        @mousedown="startDragSelection(date)"
        @mouseover="updateDragSelection(date)"
        @mouseup="endDragSelection"
        :disabled="isDisabled"
        class="aspect-square flex items-center justify-center p-2 rounded-lg text-sm relative"
        :class="{
          'text-gray-400': !isCurrentMonth,
          'bg-indigo-100 text-indigo-700': isSelected,
          'hover:bg-gray-100': !isSelected && !isDisabled && isCurrentMonth,
          'cursor-not-allowed opacity-50': isDisabled,
          'text-red-500': date.getDay() === 0 && isCurrentMonth,
          'text-blue-500': date.getDay() === 6 && isCurrentMonth,
          'ring-2 ring-indigo-500 ring-offset-2': isDragging && isInDragRange(date)
        }"
      >
        {{ date.getDate() }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  maxSelections: {
    type: Number,
    default: 7
  }
});

const emit = defineEmits(['update:modelValue']);

const currentDate = ref(new Date());
const selectedDates = computed(() => Object.keys(props.modelValue).map(dateStr => new Date(dateStr)));

// ドラッグ選択の状態管理
const isDragging = ref(false);
const dragStartDate = ref(null);
const dragEndDate = ref(null);

// ドラッグ選択の開始
const startDragSelection = (date) => {
  if (isDateDisabled(date)) return;
  isDragging.value = true;
  dragStartDate.value = date;
  dragEndDate.value = date;
};

// ドラッグ中の選択更新
const updateDragSelection = (date) => {
  if (!isDragging.value || isDateDisabled(date)) return;
  dragEndDate.value = date;
};

// ドラッグ選択の終了
const endDragSelection = () => {
  if (!isDragging.value) return;
  
  // 選択範囲内の日付を取得
  const selectedRange = calendarDays.value
    .filter(({ date }) => isInDragRange(date) && !isDateDisabled(date))
    .map(({ date }) => date);
  
  // 選択状態を更新
  const newSelection = { ...props.modelValue };
  selectedRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    if (newSelection[dateStr]) {
      delete newSelection[dateStr];
    } else if (Object.keys(newSelection).length < props.maxSelections) {
      newSelection[dateStr] = true;
    }
  });
  
  emit('update:modelValue', newSelection);
  isDragging.value = false;
  dragStartDate.value = null;
  dragEndDate.value = null;
};

// 日付が選択範囲内かどうかを判定
const isInDragRange = (date) => {
  if (!isDragging.value || !dragStartDate.value || !dragEndDate.value) return false;
  
  const start = new Date(Math.min(dragStartDate.value, dragEndDate.value));
  const end = new Date(Math.max(dragStartDate.value, dragEndDate.value));
  
  return date >= start && date <= end;
};

// 現在の年と月
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// カレンダーの日付を生成
const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  
  // 前月の日付を追加
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(firstDay);
    date.setDate(date.getDate() - i - 1);
    days.push({
      date,
      isCurrentMonth: false,
      isSelected: isDateSelected(date),
      isDisabled: isDateDisabled(date)
    });
  }
  
  // 当月の日付を追加
  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    days.push({
      date: new Date(date),
      isCurrentMonth: true,
      isSelected: isDateSelected(date),
      isDisabled: isDateDisabled(date)
    });
  }
  
  // 翌月の日付を追加
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(lastDay);
    date.setDate(date.getDate() + i);
    days.push({
      date,
      isCurrentMonth: false,
      isSelected: isDateSelected(date),
      isDisabled: isDateDisabled(date)
    });
  }
  
  return days;
});

// 日付が選択されているかどうか
const isDateSelected = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  return !!props.modelValue[dateStr];
};

// 日付が無効かどうか
const isDateDisabled = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// 同じ日付かどうか
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// 前月へ移動
const previousMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
};

// 翌月へ移動
const nextMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;
};
</script>

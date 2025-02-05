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
    type: Array,
    default: () => []
  },
  maxSelections: {
    type: Number,
    default: 7
  }
});

const emit = defineEmits(['update:modelValue']);

const currentDate = ref(new Date());
const selectedDates = ref(props.modelValue.map(dateStr => new Date(dateStr)));

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

  // 選択された日付を更新
  selectedDates.value = selectedRange;
  
  // v-modelを更新
  emit('update:modelValue', selectedDates.value.map(date => 
    date.toISOString().split('T')[0]
  ));

  // ドラッグ状態をリセット
  isDragging.value = false;
  dragStartDate.value = null;
  dragEndDate.value = null;
};

// 日付が選択範囲内かどうかを判定
const isInDragRange = (date) => {
  if (!isDragging.value || !dragStartDate.value || !dragEndDate.value) return false;
  
  const start = new Date(Math.min(dragStartDate.value, dragEndDate.value));
  const end = new Date(Math.max(dragStartDate.value, dragEndDate.value));
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return date >= start && date <= end;
};

// 現在の年と月
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// カレンダーの日付を生成
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 先月の日数を取得
  const prevMonthDays = firstDay.getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // 来月の日数を取得
  const nextMonthDays = 6 - lastDay.getDay();
  
  const days = [];
  
  // 先月の日付を追加
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      date,
      isCurrentMonth: false,
      isSelected: isDateSelected(date),
      isDisabled: isDateDisabled(date)
    });
  }
  
  // 今月の日付を追加
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isSelected: isDateSelected(date),
      isDisabled: isDateDisabled(date)
    });
  }
  
  // 来月の日付を追加
  for (let i = 1; i <= nextMonthDays; i++) {
    const date = new Date(year, month + 1, i);
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
  return selectedDates.value.some(selectedDate => 
    isSameDay(selectedDate, date)
  );
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
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

// 翌月へ移動
const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};
</script>

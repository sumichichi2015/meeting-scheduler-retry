<template>
  <div class="calendar">
    <!-- カレンダーヘッダー -->
    <div class="flex justify-between items-center mb-4">
      <button
        @click="previousMonth"
        class="p-2 hover:bg-gray-100 rounded-full"
      >
        ←
      </button>
      <h3 class="text-lg font-semibold">
        {{ currentYear }}年 {{ currentMonth + 1 }}月
      </h3>
      <button
        @click="nextMonth"
        class="p-2 hover:bg-gray-100 rounded-full"
      >
        →
      </button>
    </div>

    <!-- 曜日ヘッダー -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="day in ['日', '月', '火', '水', '木', '金', '土']"
        :key="day"
        class="text-center text-sm font-medium"
        :class="{ 'text-red-500': day === '日', 'text-blue-500': day === '土' }"
      >
        {{ day }}
      </div>
    </div>

    <!-- カレンダー本体 -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="{ date, isCurrentMonth, isSelectable, isSelected } in calendarDays"
        :key="date.toISOString()"
        class="aspect-square"
      >
        <button
          @click="toggleDate(date)"
          :disabled="!isSelectable"
          :class="[
            'w-full h-full flex items-center justify-center rounded-md text-sm',
            {
              'bg-gray-100 text-gray-400': !isCurrentMonth,
              'hover:bg-indigo-100': isSelectable && !isSelected,
              'bg-indigo-600 text-white': isSelected,
              'cursor-not-allowed': !isSelectable
            }
          ]"
        >
          {{ date.getDate() }}
        </button>
      </div>
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
    default: 14
  }
});

const emit = defineEmits(['update:modelValue']);

const currentDate = ref(new Date());
const selectedDates = ref(props.modelValue);

// 現在の年と月を計算
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// カレンダーの日付を生成
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 先月の日数を計算
  const prevMonthDays = firstDay.getDay();
  const prevMonth = new Date(year, month, 0);
  
  // カレンダーの日付を生成
  const days = [];
  
  // 先月の日付を追加
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i);
    days.push({
      date,
      isCurrentMonth: false,
      isSelectable: false,
      isSelected: isDateSelected(date)
    });
  }
  
  // 今月の日付を追加
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const isSelectable = isDateSelectable(date);
    days.push({
      date,
      isCurrentMonth: true,
      isSelectable,
      isSelected: isDateSelected(date)
    });
  }
  
  // 来月の日付を追加（6週間分になるまで）
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isSelectable: false,
      isSelected: isDateSelected(date)
    });
  }
  
  return days;
});

// 日付が選択可能かどうかを判定
const isDateSelectable = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// 日付が選択されているかどうかを判定
const isDateSelected = (date) => {
  return selectedDates.value.some(selectedDate => 
    isSameDay(new Date(selectedDate), date)
  );
};

// 同じ日付かどうかを判定
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// 日付の選択/解除
const toggleDate = (date) => {
  const index = selectedDates.value.findIndex(selectedDate => 
    isSameDay(new Date(selectedDate), date)
  );
  
  if (index === -1) {
    if (selectedDates.value.length < props.maxSelections) {
      selectedDates.value = [...selectedDates.value, date];
    }
  } else {
    selectedDates.value = selectedDates.value.filter((_, i) => i !== index);
  }
  
  emit('update:modelValue', selectedDates.value);
};

// 前月へ移動
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

// 次月へ移動
const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};
</script>

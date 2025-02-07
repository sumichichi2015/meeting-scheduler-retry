<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-8">会議日時調整ツール</h1>

    <!-- 会議名と時間帯設定 -->
    <div class="mb-8 space-y-4">
      <div class="flex items-center gap-4">
        <label class="block text-sm font-medium text-gray-700 w-24">会議名</label>
        <input
          type="text"
          v-model="meetingStore.currentMeeting.title"
          class="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="会議名を入力"
        />
      </div>
      
      <div class="flex items-center gap-4">
        <label class="block text-sm font-medium text-gray-700 w-24">時間帯</label>
        <div class="flex items-center gap-2">
          <select
            v-model="defaultTimeRange.start"
            class="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="time in generateTimeOptions()" :key="time" :value="time">
              {{ time }}
            </option>
          </select>
          <span class="text-gray-500">〜</span>
          <select
            v-model="defaultTimeRange.end"
            class="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="time in generateTimeOptions()" :key="time" :value="time">
              {{ time }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- カレンダー -->
    <div class="mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="monthOffset in [0, 1]" :key="monthOffset" class="calendar-container">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium">{{ getMonthTitle(monthOffset) }}</h3>
            <button
              v-if="monthOffset === 1"
              @click="nextMonth"
              class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              &gt;
            </button>
          </div>
          <Calendar 
            v-model="selectedDates"
            :month-offset="monthOffset"
            @change-month="handleMonthChange(monthOffset, $event)"
          />
        </div>
      </div>
    </div>

    <!-- 選択された日時の一覧 -->
    <div v-if="Object.keys(selectedDates).length > 0" class="mb-8">
      <h3 class="text-lg font-medium mb-4">選択された日時</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div 
          v-for="date in Object.keys(selectedDates).sort()" 
          :key="date" 
          class="bg-white p-4 rounded-lg shadow-sm"
        >
          <div class="font-medium mb-2">{{ formatDate(date) }}</div>
          <div class="space-y-1">
            <button
              v-for="timeSlot in generateTimeSlots(date)"
              :key="`${date}-${timeSlot.start}-${timeSlot.end}`"
              @click="toggleTimeSlot(date, timeSlot)"
              :class="[
                'w-full py-2 px-3 rounded text-sm transition-colors duration-150 text-left',
                isTimeSlotSelected(date, timeSlot)
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              ]"
            >
              {{ timeSlot.start }} 〜 {{ timeSlot.end }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- コメント入力 -->
    <div class="mb-8">
      <label class="block text-sm font-medium text-gray-700 mb-2">コメント</label>
      <textarea
        v-model="meetingStore.currentMeeting.description"
        rows="4"
        class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="会議に関する補足情報を入力してください"
      ></textarea>
    </div>

    <!-- URL発行ボタン -->
    <div class="flex justify-center">
      <button
        @click="createMeeting"
        class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        URLを発行して開く
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMeetingStore } from '../stores/meeting';
import Calendar from './Calendar.vue';

const meetingStore = useMeetingStore();
const selectedDates = ref({});
const defaultTimeRange = ref({
  start: '09:00',
  end: '17:00'
});

// 30分間隔の時間オプションを生成（9:00から21:00まで）
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute of ['00', '30']) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute}`);
    }
  }
  return times;
};

const getMonthTitle = (offset) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日(${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
};

const nextMonth = () => {
  // カレンダーの月を進める処理
};

const createMeeting = async () => {
  // 会議URLを生成して開く処理
};

// 30分間隔の時間スロットを生成
const generateTimeSlots = (date) => {
  const slots = [];
  const range = timeRanges.value[date] || defaultTimeRange.value;
  
  // 開始時間と終了時間を分単位に変換
  const getMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const startMinutes = getMinutes(range.start);
  const endMinutes = getMinutes(range.end);
  
  // 30分間隔でスロットを生成
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const start = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    const end = `${Math.floor((minutes + 30) / 60).toString().padStart(2, '0')}:${((minutes + 30) % 60).toString().padStart(2, '0')}`;
    
    slots.push({ start, end });
  }
  
  return slots;
};

// 時間スロットが選択されているかチェック
const isTimeSlotSelected = (date, timeSlot) => {
  const dateSlots = meetingStore.currentMeeting.dates[date]?.selectedTimeSlots || {};
  return dateSlots[`${timeSlot.start}-${timeSlot.end}`] || false;
};

// 時間スロットの選択/解除
const toggleTimeSlot = (date, timeSlot) => {
  if (!meetingStore.currentMeeting.dates[date]) {
    meetingStore.currentMeeting.dates[date] = {
      selectedTimeSlots: {}
    };
  }
  
  const slotKey = `${timeSlot.start}-${timeSlot.end}`;
  const dateSlots = meetingStore.currentMeeting.dates[date].selectedTimeSlots;
  
  if (dateSlots[slotKey]) {
    delete dateSlots[slotKey];
  } else {
    dateSlots[slotKey] = true;
  }
};

// 時間範囲の状態管理
const timeRanges = ref({});

// 月の変更を処理するメソッド
const handleMonthChange = (calendarIndex, delta) => {
  // 必要に応じて月の変更に関する追加のロジックを実装
  console.log(`Calendar ${calendarIndex} changed by ${delta} months`);
};
</script>

<style scoped>
.calendar-container {
  @apply bg-white p-4 rounded-lg shadow-sm;
}
</style>

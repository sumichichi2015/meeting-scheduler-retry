<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h2 class="text-lg font-medium text-gray-900">新しい会議を作成</h2>
      
      <!-- 会議名入力 -->
      <div class="mt-5">
        <label for="meeting-name" class="block text-sm font-medium text-gray-700">会議名</label>
        <input
          type="text"
          id="meeting-name"
          v-model="meetingName"
          maxlength="100"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="プロジェクトキックオフ会議"
        />
      </div>

      <!-- 主催者名入力 -->
      <div class="mt-5">
        <label for="organizer-name" class="block text-sm font-medium text-gray-700">主催者名</label>
        <input
          type="text"
          id="organizer-name"
          v-model="organizerName"
          maxlength="50"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="山田太郎"
        />
      </div>

      <!-- カレンダー -->
      <div class="mt-5">
        <label class="block text-sm font-medium text-gray-700">候補日（最大14日）</label>
        <div class="mt-2">
          <Calendar v-model="selectedDates" :max-selections="14" />
        </div>
        <!-- 選択された日付の表示 -->
        <div v-if="selectedDates.length > 0" class="mt-2">
          <h4 class="text-sm font-medium text-gray-700">選択された日付:</h4>
          <ul class="mt-1 space-y-1">
            <li v-for="date in sortedSelectedDates" :key="date" class="text-sm text-gray-600">
              {{ formatDate(date) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 時間帯設定 -->
      <div class="mt-5">
        <label class="block text-sm font-medium text-gray-700">時間帯</label>
        <div class="mt-2 grid grid-cols-2 gap-4">
          <div>
            <select v-model="startTime" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
            </select>
          </div>
          <div>
            <select v-model="endTime" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 作成ボタン -->
      <div class="mt-5">
        <button
          type="button"
          @click="createMeeting"
          :disabled="!isValid"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          作成
        </button>
      </div>

      <!-- 会議URL表示 -->
      <div v-if="meetingUrl" class="mt-5">
        <div class="rounded-md bg-blue-50 p-4">
          <div class="flex">
            <div class="ml-3 flex-1 md:flex md:justify-between">
              <p class="text-sm text-blue-700">会議URLが生成されました</p>
            </div>
          </div>
          <div class="mt-2 flex items-center space-x-2">
            <input
              type="text"
              readonly
              :value="meetingUrl"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              @click="copyUrl"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              コピー
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMeetingStore } from '../stores/meeting';
import Calendar from './Calendar.vue';

const router = useRouter();
const meetingStore = useMeetingStore();

const meetingName = ref('');
const organizerName = ref('');
const selectedDates = ref([]);
const startTime = ref('9:00');
const endTime = ref('10:00');
const meetingUrl = ref('');

// バリデーション
const isValid = computed(() => {
  return meetingName.value.trim() &&
         organizerName.value.trim() &&
         selectedDates.value.length > 0;
});

// 選択された日付を日付順にソート
const sortedSelectedDates = computed(() => {
  return [...selectedDates.value].sort((a, b) => new Date(a) - new Date(b));
});

// 日付のフォーマット
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
};

// 30分刻みの時間オプションを生成
const timeOptions = computed(() => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of ['00', '30']) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute}`);
    }
  }
  return times;
});

const createMeeting = async () => {
  try {
    const meetingData = {
      name: meetingName.value,
      organizer: organizerName.value,
      dates: selectedDates.value,
      startTime: startTime.value,
      endTime: endTime.value
    };
    
    const meetingId = await meetingStore.createMeeting(meetingData);
    meetingUrl.value = `${window.location.origin}/meeting/${meetingId}`;
    router.push(`/meeting/${meetingId}`);
  } catch (error) {
    console.error('会議の作成に失敗しました:', error);
  }
};

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(meetingUrl.value);
    alert('URLをコピーしました');
  } catch (error) {
    console.error('URLのコピーに失敗しました:', error);
  }
};
</script>

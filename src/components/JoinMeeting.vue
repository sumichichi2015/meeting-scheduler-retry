<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <template v-if="meeting">
        <h2 class="text-lg font-medium text-gray-900">{{ meeting.name }}</h2>
        <p class="mt-1 text-sm text-gray-500">主催者: {{ meeting.organizer }}</p>
        <p class="mt-1 text-sm text-gray-500">
          時間帯: {{ meeting.startTime }} - {{ meeting.endTime }}
        </p>

        <!-- 参加者名入力（未回答時のみ表示） -->
        <div v-if="!hasResponded" class="mt-5">
          <label for="participant-name" class="block text-sm font-medium text-gray-700">お名前</label>
          <input
            type="text"
            id="participant-name"
            v-model="participantName"
            maxlength="50"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="名前を入力してください"
          />
        </div>

        <!-- 候補日の出欠選択 -->
        <div class="mt-5">
          <h3 class="text-sm font-medium text-gray-700">候補日時</h3>
          <div class="mt-2 space-y-4">
            <div v-for="date in meeting.dates" :key="date" class="flex items-center space-x-4">
              <span class="w-48">{{ formatDate(date) }}</span>
              <div class="flex space-x-2">
                <button
                  v-for="status in ['○', '△', '×']"
                  :key="status"
                  @click="selectStatus(date, status)"
                  :class="[
                    'px-4 py-2 rounded-md text-sm font-medium',
                    getStatusButtonClass(status, getDateStatus(date))
                  ]"
                >
                  {{ status }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- コメント入力 -->
        <div class="mt-5">
          <label for="comment" class="block text-sm font-medium text-gray-700">コメント（任意）</label>
          <textarea
            id="comment"
            v-model="comment"
            rows="3"
            maxlength="200"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="希望や条件があればご記入ください"
          ></textarea>
          <p class="mt-1 text-sm text-gray-500">{{ comment.length }}/200文字</p>
        </div>

        <!-- 送信ボタン -->
        <div class="mt-5">
          <button
            type="button"
            @click="submitResponse"
            :disabled="!isValid"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {{ hasResponded ? '更新' : '送信' }}
          </button>
        </div>

        <!-- エラーメッセージ -->
        <div v-if="error" class="mt-4 p-4 bg-red-50 rounded-md">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <!-- 参加者一覧 -->
        <div class="mt-8">
          <h3 class="text-sm font-medium text-gray-700">参加者一覧</h3>
          <div class="mt-2">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参加者</th>
                    <th v-for="date in meeting.dates" :key="date" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ formatDateShort(date) }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="participant in meeting.participants" :key="participant.id">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {{ participant.name }}
                      <div class="text-xs text-gray-500">{{ formatTime(participant.joinedAt) }}</div>
                    </td>
                    <td v-for="date in meeting.dates" :key="date" class="px-4 py-3 text-center whitespace-nowrap text-sm">
                      <span :class="getStatusClass(participant.responses[date])">
                        {{ participant.responses[date] || '未回答' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p class="mt-2 text-gray-600">読み込み中...</p>
      </div>
      <div v-else class="text-center text-red-600 py-8">
        会議が見つかりません
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMeetingStore } from '../stores/meeting';

const route = useRoute();
const router = useRouter();
const meetingStore = useMeetingStore();

const loading = ref(true);
const error = ref(null);
const participantName = ref('');
const comment = ref('');
const responses = ref({});

const meeting = computed(() => meetingStore.getMeeting(route.params.id));

const hasResponded = computed(() => {
  return meeting.value?.participants.some(p => p.name === participantName.value);
});

const isValid = computed(() => {
  return participantName.value.trim() && 
         Object.keys(responses.value).length > 0;
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
};

const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
};

const formatTime = (datetime) => {
  return new Date(datetime).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusButtonClass = (status, currentStatus) => {
  const isSelected = status === currentStatus;
  switch (status) {
    case '○':
      return isSelected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800';
    case '△':
      return isSelected ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800';
    case '×':
      return isSelected ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case '○':
      return 'text-green-600 font-medium';
    case '△':
      return 'text-yellow-600 font-medium';
    case '×':
      return 'text-red-600 font-medium';
    default:
      return 'text-gray-400';
  }
};

const selectStatus = (date, status) => {
  responses.value = {
    ...responses.value,
    [date]: status
  };
};

const getDateStatus = (date) => {
  return responses.value[date] || null;
};

const submitResponse = async () => {
  try {
    error.value = null;
    const participantData = {
      name: participantName.value,
      responses: responses.value,
      comment: comment.value
    };
    
    await meetingStore.joinMeeting(route.params.id, participantData);
    // 成功メッセージを表示
  } catch (err) {
    error.value = err.message;
  }
};

onMounted(async () => {
  try {
    if (!meeting.value) {
      error.value = '会議が見つかりません';
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

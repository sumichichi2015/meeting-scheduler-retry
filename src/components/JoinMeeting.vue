<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <template v-if="meeting">
        <h2 class="text-lg font-medium text-gray-900">{{ meeting.name }}</h2>
        <p class="mt-1 text-sm text-gray-500">主催者: {{ meeting.organizer }}</p>

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
              <span class="w-32">{{ formatDate(date) }}</span>
              <div class="flex space-x-2">
                <button
                  v-for="status in ['○', '△', '×']"
                  :key="status"
                  @click="selectStatus(date, status)"
                  :class="[
                    'px-3 py-1 rounded-md text-sm font-medium',
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

        <!-- 参加者一覧 -->
        <div class="mt-8">
          <h3 class="text-sm font-medium text-gray-700">参加者一覧</h3>
          <div class="mt-2 divide-y divide-gray-200">
            <div v-for="participant in meeting.participants" :key="participant.id" class="py-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ participant.name }}</p>
                  <p class="text-sm text-gray-500">{{ formatDateTime(participant.joinedAt) }}</p>
                </div>
                <div class="text-sm text-gray-500">
                  {{ participant.comment }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="text-center text-red-600">
        会議が見つかりません
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMeetingStore } from '../stores/meeting';

const route = useRoute();
const meetingStore = useMeetingStore();

const meeting = computed(() => meetingStore.getMeeting(route.params.id));
const participantName = ref('');
const comment = ref('');
const responses = ref({});

const hasResponded = computed(() => {
  return Object.keys(responses.value).length > 0;
});

const isValid = computed(() => {
  return participantName.value.trim() && Object.keys(responses.value).length > 0;
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
};

const formatDateTime = (datetime) => {
  return new Date(datetime).toLocaleString('ja-JP');
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
    const participantData = {
      name: participantName.value,
      responses: responses.value,
      comment: comment.value
    };
    
    await meetingStore.joinMeeting(route.params.id, participantData);
    // 成功時の処理
  } catch (error) {
    // エラー処理
    console.error('回答の送信に失敗しました:', error);
  }
};

onMounted(() => {
  // 必要に応じて会議データの初期読み込み
});
</script>

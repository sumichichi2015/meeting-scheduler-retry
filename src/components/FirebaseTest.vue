<template>
  <div class="firebase-test p-4">
    <h2 class="text-xl font-bold mb-4">Firebaseテスト</h2>
    
    <div class="space-y-4">
      <!-- テストデータ作成 -->
      <div class="border p-4 rounded">
        <h3 class="font-bold mb-2">テストデータの作成</h3>
        <button 
          @click="createTestMeeting" 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          テスト会議を作成
        </button>
        <div v-if="createdMeetingId" class="mt-2 text-green-600">
          作成された会議ID: {{ createdMeetingId }}
        </div>
      </div>

      <!-- リアルタイム監視テスト -->
      <div class="border p-4 rounded">
        <h3 class="font-bold mb-2">リアルタイム監視テスト</h3>
        <div v-if="watchedMeeting" class="space-y-2">
          <div><strong>会議ID:</strong> {{ watchedMeeting.id }}</div>
          <div><strong>作成日時:</strong> {{ new Date(watchedMeeting.createdAt.toDate()).toLocaleString() }}</div>
          <div><strong>コメント:</strong> {{ watchedMeeting.comment }}</div>
        </div>
      </div>

      <!-- 参加者追加テスト -->
      <div class="border p-4 rounded">
        <h3 class="font-bold mb-2">参加者追加テスト</h3>
        <div class="space-y-2">
          <input 
            v-model="participantName" 
            class="border p-2 rounded w-full"
            placeholder="参加者名を入力"
          >
          <button 
            @click="addTestParticipant" 
            :disabled="!createdMeetingId"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            参加者を追加
          </button>
        </div>
        <div v-if="participants.length > 0" class="mt-2">
          <h4 class="font-bold">参加者一覧:</h4>
          <ul class="list-disc list-inside">
            <li v-for="participant in participants" :key="participant.id">
              {{ participant.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMeetingStore } from '../stores/meeting';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const meetingStore = useMeetingStore();
const createdMeetingId = ref(null);
const watchedMeeting = ref(null);
const participantName = ref('');
const participants = ref([]);

// テスト会議の作成
const createTestMeeting = async () => {
  try {
    const meetingData = {
      dates: {
        '2025-02-07': {
          timeSlots: [
            { start: '10:00', end: '10:30' },
            { start: '10:30', end: '11:00' }
          ]
        }
      },
      comment: 'これはテスト会議です',
      participants: []
    };

    createdMeetingId.value = await meetingStore.saveMeeting(meetingData);
    console.log('テスト会議が作成されました:', createdMeetingId.value);
    
    // 作成した会議の監視を開始
    watchMeeting(createdMeetingId.value);
  } catch (error) {
    console.error('会議の作成に失敗しました:', error);
  }
};

// 会議データの監視
const watchMeeting = async (meetingId) => {
  try {
    const meeting = await meetingStore.getMeeting(meetingId);
    watchedMeeting.value = meeting;
    participants.value = meeting.participants || [];
  } catch (error) {
    console.error('会議データの取得に失敗しました:', error);
  }
};

// テスト参加者の追加
const addTestParticipant = async () => {
  if (!createdMeetingId.value || !participantName.value) return;

  try {
    await meetingStore.addParticipant(createdMeetingId.value, {
      name: participantName.value,
      availability: {}
    });
    participantName.value = ''; // 入力欄をクリア
  } catch (error) {
    console.error('参加者の追加に失敗しました:', error);
  }
};
</script>

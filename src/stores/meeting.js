import { defineStore } from 'pinia';

export const useMeetingStore = defineStore('meeting', {
  state: () => ({
    meetings: {},
    currentMeeting: null,
    error: null
  }),

  actions: {
    async createMeeting(meetingData) {
      try {
        // 会議IDを生成（実際の実装ではサーバーサイドで行う）
        const meetingId = crypto.randomUUID();
        
        const meeting = {
          id: meetingId,
          ...meetingData,
          participants: [],
          createdAt: new Date().toISOString()
        };

        // ストアに保存
        this.meetings[meetingId] = meeting;
        this.currentMeeting = meeting;
        
        return meetingId;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async joinMeeting(meetingId, participantData) {
      try {
        const meeting = this.meetings[meetingId];
        if (!meeting) {
          throw new Error('会議が見つかりません');
        }

        // 参加者を追加
        meeting.participants.push({
          ...participantData,
          joinedAt: new Date().toISOString()
        });

        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async updateParticipantStatus(meetingId, participantId, status) {
      try {
        const meeting = this.meetings[meetingId];
        if (!meeting) {
          throw new Error('会議が見つかりません');
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        if (!participant) {
          throw new Error('参加者が見つかりません');
        }

        participant.status = status;
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    }
  },

  getters: {
    getMeeting: (state) => (meetingId) => {
      return state.meetings[meetingId];
    },
    
    getParticipants: (state) => (meetingId) => {
      const meeting = state.meetings[meetingId];
      return meeting ? meeting.participants : [];
    }
  }
});

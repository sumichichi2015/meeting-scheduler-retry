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
        // 会議IDを生成
        const meetingId = crypto.randomUUID();
        
        const meeting = {
          id: meetingId,
          name: meetingData.name,
          organizer: meetingData.organizer,
          dates: meetingData.dates,
          timeSlots: meetingData.timeSlots,
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

        // 参加者名の重複チェック
        if (meeting.participants.some(p => p.name === participantData.name)) {
          throw new Error('この名前は既に使用されています');
        }

        // 参加者を追加
        const participant = {
          id: crypto.randomUUID(),
          name: participantData.name,
          responses: participantData.responses,
          comment: participantData.comment,
          joinedAt: new Date().toISOString()
        };

        meeting.participants.push(participant);
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async updateParticipantStatus(meetingId, participantId, responses) {
      try {
        const meeting = this.meetings[meetingId];
        if (!meeting) {
          throw new Error('会議が見つかりません');
        }

        const participant = meeting.participants.find(p => p.id === participantId);
        if (!participant) {
          throw new Error('参加者が見つかりません');
        }

        participant.responses = responses;
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
    },

    getAvailableTimeSlots: (state) => (meetingId) => {
      const meeting = state.meetings[meetingId];
      if (!meeting) return {};
      return meeting.timeSlots;
    }
  }
});

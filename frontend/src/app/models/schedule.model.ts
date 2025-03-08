/*     "scheduleId": {
      "_id": "67cc6e66bad0d96a6d3da84f",
      "days": [
        "Monday",
        "Wednesday"
      ],
      "startTime": "6:00",
      "endTime": "3:30",
      "room": "A-101",
      "startDate": "2023-09-01T00:00:00.000Z",
      "endDate": "2023-12-15T00:00:00.000Z",
      "createdAt": "2025-03-08T16:20:54.758Z",
      "updatedAt": "2025-03-08T16:20:54.758Z",
      "__v": 0
    }, */
export interface Schedule {
  _id: string;
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

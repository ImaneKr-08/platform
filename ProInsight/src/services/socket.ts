/**
 * Socket service — connects to the backend /monitoring namespace
 * and re-exports a single shared socket instance.
 *
 * Events emitted by the backend:
 *   telemetryUpdated  { braceletId, studentId, heartRate, stressScore, stressLevel }
 *   studentConnected  { studentId, braceletId }
 *   studentDisconnected { studentId }
 *   sessionStarted    { sessionId, examId, module }
 *   sessionEnded      { sessionId, examId }
 */

import { io, Socket } from 'socket.io-client'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${API_BASE_URL}/monitoring`, {
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
}

export function disconnectSocket() {
  socket?.disconnect()
}

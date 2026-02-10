import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  channelId: string
  userId: string
}

class SocketService {
  private socket: Socket | null = null
  private messageCallbacks: ((message: Message) => void)[] = []

  connect(userId: string, email: string) {
    const backendUrl = import.meta.env.VITE_WS_URL || 'https://wspr-backend.onrender.com'
    
    this.socket = io(backendUrl, {
      auth: { userId, email },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('Connected to WSPR backend')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WSPR backend')
    })

    this.socket.on('message', (message: Message) => {
      this.messageCallbacks.forEach(callback => callback(message))
    })

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinChannel(channelId: string) {
    if (this.socket) {
      this.socket.emit('join-channel', channelId)
    }
  }

  leaveChannel(channelId: string) {
    if (this.socket) {
      this.socket.emit('leave-channel', channelId)
    }
  }

  sendMessage(channelId: string, content: string, author: string, userId: string) {
    if (this.socket) {
      const message = {
        id: Date.now().toString(),
        channelId,
        content,
        author,
        userId,
        timestamp: new Date().toISOString()
      }
      this.socket.emit('send-message', message)
      return message
    }
    return null
  }

  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback)
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback)
    }
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()
export type { Message }

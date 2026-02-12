import { useState, useEffect } from 'react'
import { X, Search, UserPlus, Check, Clock, Ban } from 'lucide-react'
import { searchUsers } from '../../services/profile.service'
import { sendContactRequest, getContacts, getPendingRequests, acceptContactRequest, declineContactRequest } from '../../services/contact.service'
import { WsprProfile, WsprContact } from '../../lib/supabase'

interface FindContactsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
}

export default function FindContactsModal({ isOpen, onClose, currentUserId }: FindContactsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WsprProfile[]>([])
  const [existingContacts, setExistingContacts] = useState<Set<string>>(new Set())
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const [incomingRequests, setIncomingRequests] = useState<(WsprContact & { profile: WsprProfile })[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'pending'>('search')

  useEffect(() => {
    if (isOpen) {
      loadExistingContacts()
      loadPendingRequests()
    }
  }, [isOpen])

  const loadExistingContacts = async () => {
    const contacts = await getContacts(currentUserId)
    setExistingContacts(new Set(contacts.map(c => c.contact_id)))
  }

  const loadPendingRequests = async () => {
    const requests = await getPendingRequests(currentUserId)
    setIncomingRequests(requests)
  }

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    const success = await acceptContactRequest(requestId, currentUserId, senderId)
    if (success) {
      loadPendingRequests()
      loadExistingContacts()
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    const success = await declineContactRequest(requestId)
    if (success) {
      loadPendingRequests()
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results = await searchUsers(searchQuery)
    // Filter out current user
    setSearchResults(results.filter(user => user.id !== currentUserId))
    setIsSearching(false)
  }

  const handleSendRequest = async (contactId: string) => {
    const success = await sendContactRequest(currentUserId, contactId)
    if (success) {
      setPendingRequests(prev => new Set(prev).add(contactId))
    }
  }

  const getContactStatus = (userId: string) => {
    if (existingContacts.has(userId)) return 'connected'
    if (pendingRequests.has(userId)) return 'pending'
    return 'none'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-samurai-black-lighter rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-samurai-grey-dark">
        {/* Header */}
        <div className="p-6 border-b border-samurai-grey-dark">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Contacts</h2>
            <button
              onClick={onClose}
              className="text-samurai-steel hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'search'
                  ? 'bg-samurai-red text-white'
                  : 'bg-samurai-black text-samurai-steel hover:text-white'
              }`}
            >
              Find Contacts
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors relative ${
                activeTab === 'pending'
                  ? 'bg-samurai-red text-white'
                  : 'bg-samurai-black text-samurai-steel hover:text-white'
              }`}
            >
              Pending Requests
              {incomingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs rounded-full flex items-center justify-center font-bold">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="p-6 border-b border-samurai-grey-dark">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-samurai-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by email or name..."
                className="w-full pl-10 pr-4 py-3 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white placeholder-samurai-steel focus:outline-none focus:border-samurai-red transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-samurai-red hover:bg-samurai-red-dark text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </div>
            <p className="text-sm text-samurai-steel mt-2">
              Search all RMG users to add as contacts
            </p>
          </div>
        )}

        {/* Search Results */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-6">
          {isSearching ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-samurai-red border-t-transparent"></div>
              <p className="text-samurai-steel mt-4">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-samurai-steel mx-auto mb-4 opacity-50" />
              <p className="text-samurai-steel">
                {searchQuery ? 'No users found' : 'Enter a name or email to search'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => {
                const status = getContactStatus(user.id)
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-samurai-black rounded-lg border border-samurai-grey-dark hover:border-samurai-steel transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-samurai-red rounded-full flex items-center justify-center text-white font-bold">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{user.display_name}</p>
                        <p className="text-sm text-samurai-steel">
                          {user.status_message || user.status}
                        </p>
                      </div>
                    </div>

                    {status === 'connected' ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Check size={18} />
                        <span className="text-sm font-semibold">Connected</span>
                      </div>
                    ) : status === 'pending' ? (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <Clock size={18} />
                        <span className="text-sm font-semibold">Pending</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-samurai-red hover:bg-samurai-red-dark text-white rounded-lg font-semibold transition-colors"
                      >
                        <UserPlus size={18} />
                        Add Contact
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div className="flex-1 overflow-y-auto p-6">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-samurai-steel mx-auto mb-4 opacity-50" />
                <p className="text-samurai-steel">No pending contact requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-samurai-black rounded-lg border border-yellow-500/30 hover:border-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {request.profile.avatar_url ? (
                        <img
                          src={request.profile.avatar_url}
                          alt={request.profile.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: request.profile.avatar_color || '#E63946' }}
                        >
                          {request.profile.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold">{request.profile.display_name}</p>
                        <p className="text-sm text-samurai-steel">
                          {request.profile.status_message || 'Wants to connect'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id, request.user_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        <Check size={18} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-samurai-grey-dark hover:bg-samurai-steel text-white rounded-lg font-semibold transition-colors"
                      >
                        <Ban size={18} />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

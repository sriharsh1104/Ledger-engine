import { Hash, Lock, MessageCircle, Plus, Phone, Radio, Search, Users } from 'lucide-react'
import type { Channel, VoiceRoom } from '../../api/comms.types'

interface ChannelSidebarProps {
  channels: Channel[]
  rooms: VoiceRoom[]
  selectedChannelId: string | null
  selectedRoomId: string | null
  wsConnected: boolean
  /** Resolve sidebar label (esp. DMs → peer username / contact name) */
  channelLabel: (channel: Channel) => string
  onSelectChannel: (id: string) => void
  onSelectRoom: (id: string) => void
  onNewChannel: () => void
  onNewDm: () => void
  onFindGroups: () => void
  onJoinPrivateChannel: () => void
  onNewRoom: () => void
  onJoinPrivateRoom: () => void
  onOpenContacts: () => void
}

function ChannelRow({
  channel,
  label,
  active,
  onClick,
}: {
  channel: Channel
  label: string
  active: boolean
  onClick: () => void
}) {
  const Icon =
    channel.kind === 'direct'
      ? MessageCircle
      : channel.visibility === 'private'
        ? Lock
        : Hash
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors cursor-pointer
        ${active
          ? 'bg-accent/15 text-accent'
          : 'text-slate-400 hover:bg-surface-overlay hover:text-white'
        }`}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-70" />
      <span className="truncate flex-1">{label}</span>
      {channel.memberCount > 0 && (
        <span className="text-[10px] text-slate-500 tabular-nums">{channel.memberCount}</span>
      )}
    </button>
  )
}

export function ChannelSidebar({
  channels,
  rooms,
  selectedChannelId,
  selectedRoomId,
  wsConnected,
  channelLabel,
  onSelectChannel,
  onSelectRoom,
  onNewChannel,
  onNewDm,
  onFindGroups,
  onJoinPrivateChannel,
  onNewRoom,
  onJoinPrivateRoom,
  onOpenContacts,
}: ChannelSidebarProps) {
  const groups = channels.filter((c) => c.kind !== 'direct')
  const dms = channels.filter((c) => c.kind === 'direct')

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-surface-raised border-r border-border-subtle h-full">
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Messages</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-accent' : 'bg-slate-600'}`}
              />
              {wsConnected ? 'Live' : 'Connecting…'}
            </p>
          </div>
          <button
            type="button"
            title="Contacts & search"
            onClick={onOpenContacts}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-overlay cursor-pointer"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              My groups
            </p>
            <div className="flex gap-0.5">
              <button
                type="button"
                title="Find public groups"
                onClick={onFindGroups}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-surface-overlay cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Join with invite code"
                onClick={onJoinPrivateChannel}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-surface-overlay cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="New group"
                onClick={onNewChannel}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-surface-overlay cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-0.5">
            {groups.length === 0 && (
              <p className="px-2 py-2 text-xs text-slate-600">
                No groups yet — create or find one
              </p>
            )}
            {groups.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                label={channelLabel(c)}
                active={c.id === selectedChannelId}
                onClick={() => onSelectChannel(c.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Direct messages
            </p>
            <button
              type="button"
              title="New DM"
              onClick={onNewDm}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-surface-overlay cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {dms.length === 0 && (
              <p className="px-2 py-2 text-xs text-slate-600">No DMs yet</p>
            )}
            {dms.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                label={channelLabel(c)}
                active={c.id === selectedChannelId}
                onClick={() => onSelectChannel(c.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Public voice rooms
            </p>
            <div className="flex gap-0.5">
              <button
                type="button"
                title="Join private room (code + password)"
                onClick={onJoinPrivateRoom}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-surface-overlay cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Create room"
                onClick={onNewRoom}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-surface-overlay cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-0.5">
            {rooms.length === 0 && (
              <p className="px-2 py-2 text-xs text-slate-600">No public rooms</p>
            )}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors cursor-pointer
                  ${room.id === selectedRoomId
                    ? 'bg-accent/15 text-accent'
                    : 'text-slate-400 hover:bg-surface-overlay hover:text-white'
                  }`}
              >
                <Phone className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate flex-1">{room.name}</span>
                <span className="text-[10px] text-slate-500">{room.memberCount}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

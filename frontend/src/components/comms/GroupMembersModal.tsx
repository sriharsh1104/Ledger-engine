import { useEffect, useMemo, useState } from 'react'
import {
  Ban,
  Crown,
  Eraser,
  LogOut,
  MoreVertical,
  Shield,
  ShieldOff,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmModal } from '../ui/Modal'
import { UserSearchPicker } from './UserSearchPicker'
import {
  resolveUserStatus,
  useAddMember,
  useBlockMember,
  useChannelMembers,
  useDeleteUserMessages,
  useLeaveChannel,
  useRemoveMember,
  useUnblockMember,
  useUpdateMemberRole,
  useUsersStatus,
} from '../../hooks/api'
import { getApiErrorMessage } from '../../api/client'
import { resolvePeerLabel } from '../../lib/displayName'
import { statusLabel } from '../../lib/status'
import { UserAvatar } from '../presence/UserAvatar'
import type { ChannelMember, ChannelMemberRole } from '../../api/comms.types'
import type { User } from '../../types'

interface BlockedEntry {
  userId: string
  name: string
}

interface GroupMembersModalProps {
  open: boolean
  onClose: () => void
  channelId: string | null
  channelName?: string
  currentUserId?: string
  contacts: User[]
  onBanner?: (message: string) => void
  /** Called after current user successfully leaves the group */
  onLeft?: () => void
}

type PendingAction =
  | { type: 'kick'; userId: string; name: string }
  | { type: 'clear'; userId: string; name: string }
  | { type: 'block'; userId: string; name: string }
  | { type: 'unblock'; userId: string; name: string }
  | { type: 'leave'; userId: string; name: string }
  | null

function roleRank(role: string) {
  if (role === 'owner') return 3
  if (role === 'moderator') return 2
  return 1
}

function roleBadge(role: string) {
  if (role === 'owner') {
    return {
      label: 'Owner',
      className: 'text-amber-300 bg-amber-400/10',
      Icon: Crown,
    }
  }
  if (role === 'moderator') {
    return {
      label: 'Mod',
      className: 'text-sky-300 bg-sky-400/10',
      Icon: Shield,
    }
  }
  return {
    label: 'Member',
    className: 'text-slate-400 bg-surface-overlay',
    Icon: Users,
  }
}

function canKick(
  myRole: ChannelMemberRole | string | undefined,
  targetRole: string,
  isSelf: boolean,
) {
  if (isSelf || !myRole) return false
  if (myRole === 'owner') return targetRole !== 'owner'
  if (myRole === 'moderator') return targetRole === 'member'
  return false
}

function canModerate(myRole: ChannelMemberRole | string | undefined) {
  return myRole === 'owner' || myRole === 'moderator'
}

export function GroupMembersModal({
  open,
  onClose,
  channelId,
  channelName,
  currentUserId,
  contacts,
  onBanner,
  onLeft,
}: GroupMembersModalProps) {
  const membersQuery = useChannelMembers(channelId, open && !!channelId)
  const removeMember = useRemoveMember()
  const addMember = useAddMember()
  const updateRole = useUpdateMemberRole()
  const deleteMsgs = useDeleteUserMessages()
  const blockMember = useBlockMember()
  const unblockMember = useUnblockMember()
  const leaveChannel = useLeaveChannel()

  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState<BlockedEntry[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!open) {
      setMenuFor(null)
      setPending(null)
      setError('')
      setBusyId(null)
      setAdding(false)
    }
  }, [open])

  useEffect(() => {
    setBlocked([])
    setAdding(false)
  }, [channelId])

  const members = membersQuery.data ?? []
  const myMember = members.find((m) => m.userId === currentUserId)
  const myRole = myMember?.role
  const memberIds = useMemo(() => members.map((m) => m.userId), [members])
  const statusQuery = useUsersStatus(memberIds, open && memberIds.length > 0)
  const statusMap = statusQuery.data

  const sorted = useMemo(() => {
    return [...members].sort(
      (a, b) => roleRank(b.role) - roleRank(a.role) || a.userId.localeCompare(b.userId),
    )
  }, [members])

  function memberLabel(m: ChannelMember) {
    return resolvePeerLabel(
      m.user ?? { id: m.userId, name: '', email: '' },
      contacts,
      'User',
    ).title
  }

  async function handleAddFromContacts(user: User) {
    if (!channelId) return
    setError('')
    setBusyId(user.id)
    try {
      await addMember.mutateAsync({ channelId, userId: user.id })
      onBanner?.(`Added ${user.name} to the group`)
      setAdding(false)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function runPending() {
    if (!pending || !channelId) return
    setError('')
    setBusyId(pending.userId)
    try {
      if (pending.type === 'kick') {
        await removeMember.mutateAsync({
          channelId,
          userId: pending.userId,
        })
        onBanner?.(`Removed ${pending.name}`)
      } else if (pending.type === 'clear') {
        const res = await deleteMsgs.mutateAsync({
          channelId,
          userId: pending.userId,
        })
        onBanner?.(
          `Deleted ${res?.deletedCount ?? 0} messages from ${pending.name}`,
        )
      } else if (pending.type === 'block') {
        await blockMember.mutateAsync({
          channelId,
          userId: pending.userId,
        })
        setBlocked((prev) =>
          prev.some((b) => b.userId === pending.userId)
            ? prev
            : [...prev, { userId: pending.userId, name: pending.name }],
        )
        onBanner?.(`Blocked ${pending.name}`)
      } else if (pending.type === 'leave') {
        await leaveChannel.mutateAsync(channelId)
        onBanner?.('You left the group')
        onClose()
        onLeft?.()
      } else if (pending.type === 'unblock') {
        await unblockMember.mutateAsync({
          channelId,
          userId: pending.userId,
        })
        setBlocked((prev) => prev.filter((b) => b.userId !== pending.userId))
        onBanner?.(`Unblocked ${pending.name}`)
      }
      setPending(null)
      setMenuFor(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setPending(null)
    } finally {
      setBusyId(null)
    }
  }

  async function toggleRole(m: ChannelMember) {
    if (!channelId || myRole !== 'owner') return
    const next = m.role === 'moderator' ? 'member' : 'moderator'
    setError('')
    setBusyId(m.userId)
    try {
      await updateRole.mutateAsync({
        channelId,
        userId: m.userId,
        role: next,
      })
      onBanner?.(
        next === 'moderator'
          ? `${memberLabel(m)} is now a moderator`
          : `${memberLabel(m)} is now a member`,
      )
      setMenuFor(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const confirmCopy = (() => {
    if (!pending) return null
    switch (pending.type) {
      case 'kick':
        return {
          title: `Remove ${pending.name}?`,
          message:
            'They will leave this group. They can rejoin with an invite unless blocked.',
          confirmLabel: 'Remove',
        }
      case 'clear':
        return {
          title: `Delete ${pending.name}'s messages?`,
          message:
            'All of their messages in this group will be removed for everyone.',
          confirmLabel: 'Delete messages',
        }
      case 'block':
        return {
          title: `Block ${pending.name}?`,
          message:
            'They are removed from the group and cannot find or join it via search, invite link, QR, or code.',
          confirmLabel: 'Block',
        }
      case 'leave':
        return {
          title: 'Leave this group?',
          message:
            'You will leave this group and it will disappear from your sidebar. You can rejoin with an invite.',
          confirmLabel: 'Leave group',
        }
      case 'unblock':
      default:
        return {
          title: `Unblock ${pending.name}?`,
          message:
            'They can join again with an invite. They are not re-added automatically.',
          confirmLabel: 'Unblock',
        }
    }
  })()

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={channelName ? `Members · ${channelName}` : 'Members'}
        size="md"
      >
        {membersQuery.isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading members…</p>
        ) : membersQuery.isError ? (
          <p className="text-sm text-danger py-4">
            {getApiErrorMessage(membersQuery.error)}
          </p>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-sm text-danger">{error}</p>}

            {canModerate(myRole) && (
              <div className="space-y-2">
                {!adding ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setAdding(true)}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add from contacts
                  </Button>
                ) : (
                  <div className="rounded-xl border border-border-subtle bg-surface-overlay/40 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-300">
                        Search contacts or people to add
                      </p>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-white cursor-pointer"
                        onClick={() => setAdding(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    <UserSearchPicker
                      allowManageContacts
                      actionLabel="Add"
                      defaultTab="contacts"
                      excludeIds={memberIds}
                      onSelect={(user) => void handleAddFromContacts(user)}
                    />
                    {busyId && addMember.isPending && (
                      <p className="text-xs text-slate-500">Adding…</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <ul className="max-h-80 overflow-y-auto rounded-xl border border-border-subtle divide-y divide-border-subtle">
              {sorted.map((m) => {
                const name = memberLabel(m)
                const isSelf = m.userId === currentUserId
                const badge = roleBadge(m.role)
                const BadgeIcon = badge.Icon
                const showKick = canKick(myRole, m.role, isSelf)
                const showModTools = canModerate(myRole) && !isSelf && m.role !== 'owner'
                const showRoleToggle = myRole === 'owner' && !isSelf && m.role !== 'owner'
                const showLeave = isSelf && myRole !== 'owner'
                const openMenu = menuFor === m.userId
                const presence = resolveUserStatus(
                  m.userId,
                  m.user?.status,
                  statusMap,
                )

                return (
                  <li key={m.userId} className="relative px-3 py-2.5 flex items-center gap-3">
                    <UserAvatar
                      name={name}
                      image={m.user?.profileImage}
                      status={presence}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {name}
                        {isSelf ? (
                          <span className="text-slate-500 font-normal"> · you</span>
                        ) : null}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${badge.className}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        {presence && (
                          <span className="text-[10px] text-slate-500">
                            {statusLabel(presence)}
                          </span>
                        )}
                      </div>
                    </div>
                    {showLeave && (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={busyId === m.userId}
                        onClick={() =>
                          setPending({
                            type: 'leave',
                            userId: m.userId,
                            name,
                          })
                        }
                        title="Leave group"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave
                      </Button>
                    )}
                    {(showKick || showModTools || showRoleToggle) && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          title="Member actions"
                          disabled={busyId === m.userId}
                          onClick={() =>
                            setMenuFor((id) => (id === m.userId ? null : m.userId))
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-overlay cursor-pointer disabled:opacity-40"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu && (
                          <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-border-subtle bg-surface-raised shadow-xl py-1">
                            {showRoleToggle && (
                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-surface-overlay cursor-pointer text-left"
                                onClick={() => void toggleRole(m)}
                              >
                                {m.role === 'moderator' ? (
                                  <>
                                    <ShieldOff className="w-3.5 h-3.5" />
                                    Remove moderator
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3.5 h-3.5" />
                                    Make moderator
                                  </>
                                )}
                              </button>
                            )}
                            {showModTools && (
                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-surface-overlay cursor-pointer text-left"
                                onClick={() =>
                                  setPending({
                                    type: 'clear',
                                    userId: m.userId,
                                    name,
                                  })
                                }
                              >
                                <Eraser className="w-3.5 h-3.5" />
                                Delete their messages
                              </button>
                            )}
                            {showKick && (
                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-surface-overlay cursor-pointer text-left"
                                onClick={() =>
                                  setPending({
                                    type: 'kick',
                                    userId: m.userId,
                                    name,
                                  })
                                }
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                Remove from group
                              </button>
                            )}
                            {showModTools && (
                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 cursor-pointer text-left"
                                onClick={() =>
                                  setPending({
                                    type: 'block',
                                    userId: m.userId,
                                    name,
                                  })
                                }
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Block from group
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {canModerate(myRole) && blocked.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-0.5">
                  Blocked this session
                </p>
                <ul className="rounded-xl border border-border-subtle divide-y divide-border-subtle">
                  {blocked.map((b) => (
                    <li
                      key={b.userId}
                      className="px-3 py-2.5 flex items-center justify-between gap-3"
                    >
                      <p className="text-sm text-slate-300 truncate">{b.name}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={busyId === b.userId}
                        onClick={() =>
                          setPending({
                            type: 'unblock',
                            userId: b.userId,
                            name: b.name,
                          })
                        }
                      >
                        Unblock
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {confirmCopy && (
        <ConfirmModal
          open={!!pending}
          onClose={() => setPending(null)}
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          cancelLabel="Cancel"
          onConfirm={() => void runPending()}
        />
      )}
    </>
  )
}

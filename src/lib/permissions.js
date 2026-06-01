// project: Firestoreのプロジェクトオブジェクト
// user: Firebase authのユーザー (null = 非ログイン)
// guestName: 非ログインユーザーの名前
// targetThread: 権限チェック対象のスレッド (状態変更時など)

export const getEffectivePermissions = (project, user) => {
  if (!project) return {}

  // オーナーは全権限
  if (user && project.ownerId === user.uid) {
    return {
      canCreateThread: true,
      canComment: true,
      canChangeStatus: true,
      canManageMembers: true,
      isOwner: true,
    }
  }

  // ログインユーザー (メンバー)
  if (user) {
    const member = (project.members || []).find(m => m.uid === user.uid)
    if (member) {
      return { ...member.permissions, isOwner: false, isMember: true }
    }
  }

  // 非ログインユーザー
  return { ...(project.guestPermissions || {}), isOwner: false, isMember: false }
}

// スレッド状態変更可否: 作成者本人 or canChangeStatus権限持ち
export const canChangeThreadStatus = (project, user, guestName, thread) => {
  if (!thread) return false
  const perms = getEffectivePermissions(project, user)
  if (perms.isOwner) return true
  if (perms.canChangeStatus) return true
  // 作成者チェック (ログイン or 非ログイン)
  if (user && thread.authorId === user.uid) return true
  if (!user && guestName && thread.authorName === guestName && !thread.authorId) return true
  return false
}

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy,
  onSnapshot, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { db } from './firebase'

// ========== プロジェクト ==========

export const createProject = async (title, description, ownerId, ownerName, guestPermissions) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const ref = await addDoc(collection(db, 'projects'), {
    title,
    description,
    ownerId,
    ownerName,
    code,
    guestPermissions, // { canCreateThread, canComment, canChangeStatus }
    members: [], // [{ uid, displayName, email, permissions: {...} }]
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, code }
}

export const getProjectByCode = async (code) => {
  const q = query(collection(db, 'projects'), where('code', '==', code.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export const getProject = async (projectId) => {
  const snap = await getDoc(doc(db, 'projects', projectId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export const subscribeProject = (projectId, callback) =>
  onSnapshot(doc(db, 'projects', projectId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })

export const getUserProjects = (userId, callback) => {
  // オーナーのプロジェクト
  const q = query(
    collection(db, 'projects'),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const updateProjectPermissions = async (projectId, guestPermissions) => {
  await updateDoc(doc(db, 'projects', projectId), { guestPermissions })
}

export const updateMemberPermissions = async (projectId, uid, permissions) => {
  const projRef = doc(db, 'projects', projectId)
  const snap = await getDoc(projRef)
  if (!snap.exists()) return
  const members = snap.data().members || []
  const updated = members.map(m => m.uid === uid ? { ...m, permissions } : m)
  await updateDoc(projRef, { members: updated })
}

export const addMemberToProject = async (projectId, member) => {
  await updateDoc(doc(db, 'projects', projectId), {
    members: arrayUnion(member)
  })
}

export const removeMemberFromProject = async (projectId, uid) => {
  const projRef = doc(db, 'projects', projectId)
  const snap = await getDoc(projRef)
  if (!snap.exists()) return
  const members = (snap.data().members || []).filter(m => m.uid !== uid)
  await updateDoc(projRef, { members })
}

// ========== スレッド ==========

export const createThread = async (projectId, title, authorId, authorName, parentId = null) => {
  return await addDoc(collection(db, 'threads'), {
    projectId,
    parentId,
    title,
    authorId,
    authorName,
    status: 'open', // 'open' | 'resolved'
    createdAt: serverTimestamp(),
  })
}

export const subscribeThreads = (projectId, parentId, callback) => {
  const q = query(
    collection(db, 'threads'),
    where('projectId', '==', projectId),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const updateThreadStatus = async (threadId, status) => {
  await updateDoc(doc(db, 'threads', threadId), { status })
}

export const getThread = async (threadId) => {
  const snap = await getDoc(doc(db, 'threads', threadId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export const subscribeThread = (threadId, callback) =>
  onSnapshot(doc(db, 'threads', threadId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })

// ========== コメント ==========

export const addComment = async (threadId, content, authorId, authorName) => {
  return await addDoc(collection(db, 'comments'), {
    threadId,
    content,
    authorId: authorId || null,
    authorName,
    createdAt: serverTimestamp(),
  })
}

export const subscribeComments = (threadId, callback) => {
  const q = query(
    collection(db, 'comments'),
    where('threadId', '==', threadId),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

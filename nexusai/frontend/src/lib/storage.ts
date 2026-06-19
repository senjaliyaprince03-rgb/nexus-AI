"use client"

type StorageKind = "local" | "session"

const memoryStores: Record<StorageKind, Map<string, string>> = {
  local: new Map<string, string>(),
  session: new Map<string, string>(),
}

function createMemoryStorage(kind: StorageKind): Storage {
  const store = memoryStores[kind]

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function resolveStorage(kind: StorageKind): Storage {
  if (typeof window === "undefined") {
    return createMemoryStorage(kind)
  }

  const candidate = kind === "local" ? window.localStorage : window.sessionStorage
  try {
    const probe = `__nexusai_storage_probe__${kind}`
    candidate.setItem(probe, "1")
    candidate.removeItem(probe)
    return candidate
  } catch {
    return createMemoryStorage(kind)
  }
}

let localStorageRef: Storage | null = null
let sessionStorageRef: Storage | null = null

export function getSafeLocalStorage(): Storage {
  if (!localStorageRef) {
    localStorageRef = resolveStorage("local")
  }
  return localStorageRef
}

export function getSafeSessionStorage(): Storage {
  if (!sessionStorageRef) {
    sessionStorageRef = resolveStorage("session")
  }
  return sessionStorageRef
}

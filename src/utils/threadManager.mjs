let mainThread = null;

export function getMainThread() {
    return mainThread;
}

export function setMainThread(thread) {
    mainThread = thread;
}

export function clearMainThread() {
    mainThread = null;
}

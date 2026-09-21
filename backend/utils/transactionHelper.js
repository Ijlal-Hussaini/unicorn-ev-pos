import mongoose from 'mongoose';

let isReplicaSetCached = null;

/**
 * Checks whether the active MongoDB connection supports replica set transactions.
 * Returns true for MongoDB Atlas / replica sets / mongos sharded clusters.
 * Returns false for standalone MongoDB instances.
 */
export const isReplicaSet = async () => {
  if (isReplicaSetCached !== null) return isReplicaSetCached;
  try {
    if (!mongoose.connection || !mongoose.connection.db) return false;
    const info = await mongoose.connection.db.admin().command({ hello: 1 });
    isReplicaSetCached = Boolean(info.setName || info.msg === 'isdbgrid');
    return isReplicaSetCached;
  } catch (_) {
    return false;
  }
};

/**
 * Creates a session only if replica set transactions are supported.
 */
export const getSafeSession = async () => {
  const supportsTx = await isReplicaSet();
  if (!supportsTx) {
    return null;
  }
  const session = await mongoose.startSession();
  await session.startTransaction();
  return session;
};

/**
 * Safely commits and ends a session if it exists.
 */
export const commitSafeSession = async (session) => {
  if (session) {
    try {
      await session.commitTransaction();
    } finally {
      session.endSession();
    }
  }
};

/**
 * Safely aborts and ends a session if it exists.
 */
export const abortSafeSession = async (session) => {
  if (session) {
    try {
      await session.abortTransaction();
    } catch (_) {
      // Ignored if transaction already ended
    } finally {
      session.endSession();
    }
  }
};

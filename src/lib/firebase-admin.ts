import { initializeApp as initAdminApp, getApps as getAdminApps, getApp as getAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initClientApp } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  collection as clientCollection, 
  doc as clientDoc, 
  getDocs as clientGetDocs, 
  setDoc as clientSetDoc, 
  limit as clientLimit, 
  query as clientQuery, 
  writeBatch as clientWriteBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Admin Auth initialization
const adminApp = !getAdminApps().length 
  ? initAdminApp({
      projectId: firebaseConfig.projectId,
    })
  : getAdminApp();

export const adminAuth = getAdminAuth(adminApp);

// Client Firestore initialization for robust backend query bypass (handling IAM permission errors on named databases)
const clientApp = initClientApp(firebaseConfig);
const clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

class DocumentReferenceWrapper {
  constructor(public firestoreDoc: any) {}
  async set(data: any, options?: { merge?: boolean }) {
    if (options && options.merge) {
      await clientSetDoc(this.firestoreDoc, data, { merge: true });
    } else {
      await clientSetDoc(this.firestoreDoc, data);
    }
  }
}

class QueryWrapper {
  constructor(public firestoreCollection: any, public limitCount?: number) {}
  
  limit(n: number) {
    return new QueryWrapper(this.firestoreCollection, n);
  }

  async get() {
    let q = this.firestoreCollection;
    if (this.limitCount !== undefined) {
      q = clientQuery(q, clientLimit(this.limitCount));
    }
    const snap = await clientGetDocs(q);
    
    return {
      empty: snap.empty,
      forEach: (callback: (doc: any) => void) => {
        snap.forEach(d => {
          callback({
            id: d.id,
            data: () => d.data()
          });
        });
      },
      docs: snap.docs.map(d => ({
        id: d.id,
        data: () => d.data()
      }))
    };
  }
}

class CollectionReferenceWrapper extends QueryWrapper {
  constructor(public firestoreCollection: any) {
    super(firestoreCollection);
  }

  doc(id: string) {
    const d = clientDoc(this.firestoreCollection, id);
    return new DocumentReferenceWrapper(d);
  }
}

class BatchWrapper {
  private batchInstance: any;
  constructor(dbInstance: any) {
    this.batchInstance = clientWriteBatch(dbInstance);
  }

  set(docRefWrapper: DocumentReferenceWrapper, data: any, options?: { merge?: boolean }) {
    if (options && options.merge) {
      this.batchInstance.set(docRefWrapper.firestoreDoc, data, { merge: true });
    } else {
      this.batchInstance.set(docRefWrapper.firestoreDoc, data);
    }
  }

  async commit() {
    await this.batchInstance.commit();
  }
}

class FirestoreWrapper {
  constructor(private dbInstance: any) {}

  collection(name: string) {
    return new CollectionReferenceWrapper(clientCollection(this.dbInstance, name));
  }

  batch() {
    return new BatchWrapper(this.dbInstance);
  }
}

// Export the wrapper as adminDb to preserve compatibility with src/db/content.ts
export const adminDb = new FirestoreWrapper(clientDb) as any;



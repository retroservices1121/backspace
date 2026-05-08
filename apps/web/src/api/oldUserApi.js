/* eslint-disable */

// THis file is temporary.

class DontImportMe {

  // Exchange a User's ID for their public info
  static async getUserPublicById(userID) {
    const functionName = 'userAPI | getUserPublicById';
    log.debug('Entering Call', functionName);
    if (userID) {
      const docRef = doc(db, 'users', userID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data();
        log.debug('Found the the user.', functionName);
        const payload = {
          uid: userID,
          username: docData.username,
          profile_image: docData.profile_image,
          location: docData.location,
          display_name: docData.display_name,
          verified: !!docData.verified,
          followed_users: docData.followed_users ? docData.followed_users : [],
          followed_communities: docData.followed_communities ? docData.followed_communities : [],
          featured_community: docData.featured_community,
          onboarded: docData.onboarded ? true : false,
        };
        return payload;
      }
      log.debug('No such user document', functionName);
    } else {
      log.warn('missing userID', functionName);
      return null;
    }
  }

  // Exchange a username for their public info. I don't like this function
  static async getUidByUsername(username) {
    const functionName = 'userAPI | getUidByUsername';
    log.debug('Entering Call', functionName);
    if (username) {
      // let matches = []
      const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
      const querySnapshot = await getDocs(q);
      // console.log(querySnapshot.docs[0].data())
      if (querySnapshot.docs[0]) {
        const { uid } = querySnapshot.docs[0].data();
        if (uid) {
          log.debug(`Got username match. UID is ${uid}`);
          return uid;
        }
      }

      log.warn(`Could not get UID for ${username}`, functionName);
      return null;
    }
  }

  // Search for a match by using username. Returns array
  static async searchUserByUsername(username) {
    const functionName = 'userAPI | searchUserByUsername';
    log.debug('Entering Call', functionName);
    if (username) {
      const matches = [];
      const q = query(collection(db, 'users'), orderBy('username'), startAt(username), endAt(`${username}\uf8ff`));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((d) => {
        matches.push(d.data());
      });
      return matches;
    }
    return [];
  }

  // Search for a match by using DisplayName. Returns array
  static async searchUserByDisplayName(_displayName) {
    const functionName = 'userAPI | searchUserByUsername';
    log.debug('Entering Call', functionName);
    if (_displayName) {
      const matches = [];
      const q = query(collection(db, 'users'), orderBy('search_name'), startAt(_displayName.toLowerCase()), endAt(`${_displayName.toLowerCase()}\uf8ff`));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((d) => {
        matches.push(d.data());
      });
      return matches;
    }
    return [];
  }

  // Subscribe to a channel in a given community (get realtime updates)
  async subscribeConvoMessages(convo, callback) {
    const functionName = 'UserAPI | subscribeConvoMessages';
    log.debug('Subscribing to new conversation', functionName);
    log.debug(convo);
    await this.unsubscribeConvoMessages();
    const collectionPath = `${convo.dbPath}/messages`; // Get message collection
    const q = query(collection(db, collectionPath), orderBy('timestamp', 'desc'), limit(convo.messageCount));
    const unsubscribe = onSnapshot(q, async (collectionSnapshot) => {
      const messages = [];
      const changes = [];
      await collectionSnapshot.docChanges().forEach((change) => {
        const docData = change.doc.data();
        const message = new DirectMessage(
          docData.recipient,
          docData.sender,
          docData.text,
          docData.media,
          doc.id,
        );
        message.timestamp = docData.timestamp;
        messages.push(message);
        if (change.type === 'added') {
          changes.push(message);
        }
      });

      // messages.reverse(); //Newest first
      // changes.reverse();
      callback(messages, changes);
    });

    // Save off unsubscribe, if you don't do this, your listeners will update your state after you switch convos
    this.messages_unsub =  unsubscribe;
    this.message_count =  20;
  }

  // Unsubscribe to a channel (using the previously saved channel unsubscribe)
  async unsubscribeConvoMessages() {
    const functionName = 'UserAPI | unsubscribeConvoMessages';
    log.debug('Unsubscribing from current conversation', functionName);
    if (this.messages_unsub) {
      await this.messages_unsub();
      this.messages_unsub = null;
    }
  }

  // Subscribe to a channel in a given community (get realtime updates)
  async subscribeConversations(uid, callback) {
    const functionName = 'UserAPI | subscribeConversations';
    log.debug('Subscribing to Conversations', functionName);
    await this.unsubscribeConvoMessages();
    const collectionRef = collection(db, 'users', uid, 'direct_messages');
    const unsubscribe = await onSnapshot(collectionRef, async (collectionSnapshot) => {
      const conversations = [];
      collectionSnapshot.forEach((document) => {
        const convoData = document.data();
        const lastMessage = convoData.last_message;
        let lastMessageObj = null;
        if (lastMessage) {
          lastMessageObj = new DirectMessage(
            lastMessage.recipient,
            lastMessage.sender,
            lastMessage.text,
            lastMessage.media,
            lastMessage.id,
          );
          lastMessageObj.timestamp = lastMessage.timestamp;
        }

        const newConvo = new ConvoObj(uid, convoData.other_uid, document, lastMessageObj);
        conversations.push(newConvo);
      });

      // Sort Convos in time order
      conversations.sort((first, second) => {
        const firstMessage = first.lastMessage;
        if (!firstMessage) return 0;
        const secondMessage = second.lastMessage;
        if (!secondMessage) return -1;

        if (firstMessage.timestamp > secondMessage.timestamp) {
          return -1;
        } if (firstMessage.timestamp < secondMessage.timestamp) {
          return 1;
        } return 0;
      });

      callback(conversations);
    });

    // Save off unsubscribe, if you don't do this, your listeners will update your state after you switch convos
    this.convo_unsub = unsubscribe;
    this.message_count = 20;
  }

  // Unsubscribe to a channel (using the previously saved channel unsubscribe)
  async unsubscribeConversations() {
    const functionName = 'UserAPI | unsubscribeConversations';
    log.debug('Unsubscribing from conversations', functionName);
    if (this.convo_unsub) {
      await this.convo_unsub();
      this.convo_unsub = null;
    }
  }

  // Creates a new conversation for a given user (inputs are UIDs)
  static async newConversation(self, other) {
    const functionName = 'UserAPI | newConversation';
    if (!self || !other) {
      log.error('Missing Required Input Parameters', functionName);
      return false;
    }
    const docRef = doc(db, 'users', self, 'direct_messages', other);
    return setDoc(docRef, {
      other_uid: other,
      self,
      last_message: { timestamp: Timestamp.now() },
    }, { merge: true });
  }

  static async getPostCommunityOptions(uid) {
    const functionName = 'UserAPI | getPostCommunityOptions';
    if (!uid) {
      log.error('Missing Required Input Parameters', functionName);
      return null;
    }

    // Fetch Public doc
    const docRef = doc(db, 'users', uid);
    const userPublic = await getDoc(docRef);
    if (userPublic.exists) {
      const docData = userPublic.data();
      // Without promise.all this returns pending promises
      if (docData?.communities) {
        return Promise.all(docData?.communities.map(async (community) => getDoc(community)
          .then((documentRef) => {
            const data = documentRef.data();
            const info = {
              name: data.name,
              id: community.id,
              ref: community,
              channels: data.channel_list,
            };
            return info;
          })
          .catch((err) => {
            console.log(err);
          }),
        ));
      }
    }
    log.error("Was able to fetch user's document", functionName);
    return [];
  }

  static async setFollowUser(_uid, _other, _currentList) {
    const docRef = doc(db, 'users', _uid);
    const newList = _currentList;
    newList.push(_other);
    await updateDoc(docRef, { followed_users: newList });
  }

  static async unsetFollowUser(_uid, _other, _currentList) {
    const docRef = doc(db, 'users', _uid);
    const newList = _currentList;
    const index = newList.indexOf(_other);
    if (index > -1) newList.splice(index, 1);
    await updateDoc(docRef, { followed_users: newList });
  }

  static async toggleFollowUser(_uid, _other) {
    const functionName = 'userAPI | toggleFollowUser';
    log.debug('Toggling Follow');
    const docRef = doc(db, 'users', _uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data();
      const followList = docData.followed_users ? docData.followed_users : [];
      if (Array.isArray(followList) && followList.includes(_other)) {
        await UserApi.unsetFollowUser(_uid, _other, followList);
      } else {
        await UserApi.setFollowUser(_uid, _other, followList);
      }
    } else {
      log.warn('Could not retrieve users public document', functionName);
    }
  }
}
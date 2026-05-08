/* eslint-disable */

import { Timestamp } from '@firebase/firestore';


// For DMs, Conversation Object
export class ConvoObj {
  self: string;
  other: string;
  ref: any;
  lastMessage: any;
  messageCount: number;
  dbPath: string | null;

  constructor(self : string, other : string, ref : any, last_message : any = null) {
    this.self = self; // UID of self
    this.other = other; // UID of other participant
    this.ref = ref;
    this.lastMessage = last_message; // DM Object
    this.messageCount = 20;
    this.dbPath = this.calculateMyConvoPath();
  }

  calculateMyConvoPath() {
    return `/users/${this.self}/direct_messages/${this.other}`;
  }
}


// Common elements from Messages/Posts
export abstract class Message {
  sender: string;
  text: string;
  media: File | string | undefined; 
  mediaType: string;
  mediaPath: string | null;
  id: string | undefined;
  type: string;
  timestamp: Timestamp;
  send_status: string | null;

  constructor(sender : string, text : string, media : File | string | undefined, mediaType : string | undefined, id? : string) {
    // Core Class Values
    this.media = media;
    this.mediaType = mediaType ? mediaType : 'image';
    this.send_status = null;
    this.sender = sender;
    this.text = text;
    this.timestamp = Timestamp.now();
    this.id = id; // Unique key for rendering this message
    this.type = 'message';

    // Calculated Values
    this.mediaPath = this.media ? this.calculateMediaPath() : '';
  }

  calculateMediaPath(): string | null {
    return null
  };

  refreshTimestamp() {
    this.timestamp = Timestamp.now();
  }

  isDirectMessage() {
    return this.type === 'direct';
  }

  isPost() {
    return this.type === 'post';
  }
}


// Represents a DM conversation
export class ConversationClass {
  self: string;
  other: string;
  lastMessage: any;
  constructor(self : string, other : string, lastMessage : any = null) {
    this.self = self;
    this.other = other;
    this.lastMessage = lastMessage;
  }

  getJSON() {
    return {
      self: this.self,
      other: this.other,
      lastMessage : this.lastMessage,
    };
  }
}


export type CommunityReference  = {
  name: string;
  id: string;
  ref: any;
  channels: Array<any>;
}

export type ChannelReference  = {
  name: string;
  id: string;
  type: string;
}
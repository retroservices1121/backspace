// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

// Replace this with whatever thing Dylan comes up with.
export class Singleton {
  private static store = {};
  static runOnce(id: string, callback: Function) {
    if (!Singleton.store[id]) {
      Singleton.store[id] = true;
      callback();
    }
    return this;
  }
  static clear(id:string) {
    Singleton.store[id] = false;
  }
  static clearAll() {
    Singleton.store = {};
  }
}

export const useSingleton = Singleton.runOnce;

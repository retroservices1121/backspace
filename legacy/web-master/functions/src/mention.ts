// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

//This is for processing mentions from our rich text editor


function recursiveScan(json : any) {
  let usernameList : string[] = [];
  if (json != null) {
    if (json.type === 'mention') {
      usernameList.push(json.user);
    }
    for (let property in json) {
      // console.log('prop: ', property);
      if (json[property].type === 'mention') {
        usernameList.push(json[property].user);
      }
      if (Array.isArray(json[property]) || json[property].children) {
        const foundUsers = recursiveScan(json[property]);
        if (foundUsers) {
          usernameList = usernameList.concat(foundUsers);
        }
      }
    }
  }
  return usernameList;
}

/**
 * Takes in a stringified JSON and returns usernames in mentions
 * @param input stringified JSON (pre-parsed) 
 * @returns array of usernames (unique)
 */
export function findMentions(input: string) : string[] {
  //Assumes input was stringified json from rich text
  let usernameArray : string[] = [];
  try {
    const jsonObject = JSON.parse(input);
    for (let index in jsonObject) {
      const innerObject = jsonObject[index];
      const deeper = recursiveScan(innerObject);
      usernameArray = [...usernameArray, ...deeper];
    }
    const uniqueMap = new Map<string, boolean>();
    const unique = usernameArray.filter((value, index) => {
      if (uniqueMap.get(value)) return false;
      uniqueMap.set(value, true); 
      return true;
    });
    console.log('users: ', unique);
    usernameArray = unique;
  } catch (error) {
    console.error('Error processing mentions in rich text');
    console.error(error);
  }
  return usernameArray;
  
}

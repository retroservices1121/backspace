export enum MessageFields {
  Message = 'message',
  Media = 'media',
  //TODO: put emotes here
}

export type MessageFormState = {
  [MessageFields.Message]: string;
  [MessageFields.Media]: File | null;
};


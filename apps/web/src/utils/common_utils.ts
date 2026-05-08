// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

const dayShortLookup = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
const dayLongLookup = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthLongLookup = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
import { Media } from '@prisma/client';

// `envType` used to come from utils/firebase (which read it from a
// REACT_APP_ env baked at build time). Now it's just NODE_ENV.
const envType = process.env.NODE_ENV ?? 'development';
export const isDevelopment = () => envType !== 'production';
export const isProduction = () => envType === 'production';

export const isClient = () : boolean => {
  let result = false;
  try {
    result = window ? true : false;
  } catch (e) {
    // do nothing. if window !defined throws an error, that answers our question
    result = false;
  }
  return result;
};

export const isServer = () : boolean => {
  return !isClient();
};

export const serverURL = isDevelopment() ? 'http://localhost:3000' : 'https://backspace.to/';

//Open URL in new window/tab
export const openInNewTab = (url: string): void => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

export function sleep(ms : number) {
  const currentTime = new Date().getTime();
  while (currentTime + ms >= new Date().getTime()) {
  }
}

// NOTE: This will return larger than a 4 char string
export const makeShortNumber = (value : number) : string => {
  if (value / 1000000000 >= 1) { //BILLIONS
    //To return 2 decimal places
    return `${Math.round(value * 100) / 100000000000} B`;
  } else if (value / 1000000 >= 1) { //Millions  
    //To return 2 decimal places
    return `${Math.round(value * 100) / 100000000} M`;
  } else if (value / 1000 >= 1) { //Thousands
    //To return 1 decimal places
    return `${Math.round(value * 10) / 10000} k`;
  } else {
    return `${value}`;
  }
};

// NOTE: This will return less than a 4 char string
export const truncateLargeumbers = (value: number) => {
  // Billions
  return Math.abs(Number(value)) >= 1.0e+9
    ? (Math.abs(Number(value)) / 1.0e+9).toFixed(1) + 'B'
  // Hundred Millions
    : Math.abs(Number(value)) >= 1.0e+6
      ? (Math.abs(Number(value)) / 1.0e+6).toFixed(0) + 'M'
      // Ten Millions
      : Math.abs(Number(value)) >= 1.0e+6
        ? (Math.abs(Number(value)) / 1.0e+6).toFixed(1) + 'M'
        // Millions
        : Math.abs(Number(value)) >= 1.0e+6
          ? (Math.abs(Number(value)) / 1.0e+6).toFixed(2) + 'M'
          // Hundred Thousands
          : Math.abs(Number(value)) >= 1.0e+3
            ? (Math.abs(Number(value)) / 1.0e+3).toFixed(0) + 'K'
            // Ten Thousands
            : Math.abs(Number(value)) >= 1.0e+3
              ? (Math.abs(Number(value)) / 1.0e+3).toFixed(1) + 'K'
              // Thousands
              : Math.abs(Number(value)) >= 1.0e+3
                ? (Math.abs(Number(value)) / 1.0e+3).toFixed(2) + 'K'
                : Math.abs(Number(value));
};


// Takes a javascript date object
export function timeAgoString(dateObj : Date | string) {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') dateObj = new Date(dateObj);
  const currentTime = Date.now();
  const diffTime = Math.abs(currentTime.valueOf() - dateObj.valueOf()) / 1000; // In Seconds
  const diffDays = Math.ceil(diffTime / (60 * 60 * 24));
  const hours = diffTime / (60 * 60);
  const minutes = diffTime / 60;

  let timeStr = '';
  if (diffDays > 2) {
    timeStr = `${Math.round(diffDays)} days ago`;
  } else if (hours > 2) {
    timeStr = `${Math.round(hours)} hours ago`;
  } else if (minutes > 2) {
    timeStr = `${Math.round(minutes)} minutes ago`;
  } else if (minutes > 1) {
    timeStr = `${Math.round(minutes)} minute ago`;
  } else {
    timeStr = 'Less than 1 min ago';
  }
  return timeStr;
}

// Returns time ago in a number/single char output.
export function timeAgoStringAbbreviation(dateObj : Date) {
  if (!dateObj) return '';
  const currentTime = Date.now();
  const diffTime = Math.abs(currentTime.valueOf() - dateObj.valueOf()) / 1000; // In Seconds
  const diffDays = Math.ceil(diffTime / (60 * 60 * 24));
  const hours = diffTime / (60 * 60);
  const minutes = diffTime / 60;
  let timeStr = '';
  if (diffDays > 1.5) {
    timeStr = `${Math.round(diffDays)}d`;
  } else if (hours > 1.5) {
    timeStr = `${Math.round(hours)}h`;
  } else if (minutes > 2) {
    timeStr = `${Math.round(minutes)}m`;
  } else if (minutes > 1) {
    timeStr = `${Math.round(minutes)}m`;
  } else {
    timeStr = '<1m';
  }
  return timeStr;
}

// Used on a tile to give a human short readable timeoutput
// Takes a javascript date object
export function timeCompactString(dateObj : Date) {
  if (!dateObj) return '';
  const currentTime = Date.now();
  const diffTime = Math.abs(currentTime.valueOf() - dateObj.valueOf()) / 1000; // In Seconds
  const diffDays = Math.ceil(diffTime / (60 * 60 * 24));
  // let hours = diffTime/(60*60)
  // let minutes = diffTime/60
  let timeStr = '';
  if (diffDays > 365) { // Month/Day/Year
    timeStr = dateObj.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  } else if (diffDays > 6) { // Month/Day
    timeStr = dateObj.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  } else if (diffDays > 1) { // Weekday
    timeStr = dayShortLookup[dateObj.getDay()];
  } else { // Time
    timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return timeStr;
}

// Used on a message to give a human readable timeoutput
// Takes a javascript date object
export function timeString(dateObj : Date) {
  if (!dateObj) return '';
  const currentTime = new Date(Date.now());
  const diffTime = Math.abs(currentTime.valueOf() - dateObj.valueOf()) / 1000; // In Seconds
  const diffDays = Math.ceil(diffTime / (60 * 60 * 24));
  // let hours = diffTime/(60*60)
  // let minutes = diffTime/60
  let dateString = '';
  if (diffDays > 365) { // Month/Day/Year
    dateString = dateObj.toLocaleDateString([], { month: 'numeric', day: '2-digit', year: '2-digit' });
  } else if (diffDays > 6) { // Month/Day
    dateString = dateObj.toLocaleDateString([], { month: 'numeric', day: '2-digit' });
  } else if (diffDays > 1) { // Weekday
    dateString = dayLongLookup[dateObj.getDay()];
  } else if (currentTime.getDay() === dateObj.getDay()) { // Today
    dateString = 'Today';
  } else {
    dateString = 'Yesterday';
  }

  const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${dateString} at ${timeStr}`;
}

// Takes date object
export function dateLongString(dateObj : Date) {
  return `${dayLongLookup[dateObj.getDay()]}, ${monthLongLookup[dateObj.getMonth()]} ${dateObj.getDate()}`;
}

export const getMediaTypeByExtention = (mediaExtention : string | undefined) => {
  if (!mediaExtention) return 'none';
  const images = ['jpg', 'gif', 'png'];
  const videos = ['mp4', '3gp', 'ogg', 'mov'];

  let type = 'img';
  if (images.includes(mediaExtention)) {
    type = 'img';
  } else if (videos.includes(mediaExtention)) {
    type = 'video';
  }

  return type;
};

const images = ['jpg', 'gif', 'png'];
const videos = ['mp4', '3gp', 'ogg'];

export const getFileExtension = (fileName: string | File): string => {
  if (typeof fileName === 'string') {
    return fileName.split('.').pop() || '';
  } else {
    return fileName.name.split('.').pop() || '';
  }
  
};

export const getMediaType = (media : Media) => {
  if (!media) return 'none';
  const extension = media.fileExtension;
  let type = 'img';
  if (images.includes(extension)) {
    type = 'img';
  } else if (videos.includes(extension)) {
    type = 'video';
  }

  return type;
};

export const getFileType = (media : File | undefined) => {
  if (!media) return 'none';

  const extension = media.type;
  let type = 'img';
  if (images.includes(extension)) {
    type = 'img';
  } else if (videos.includes(extension)) {
    type = 'video';
  }

  return type;
};

export const getThemeButtonText = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1) + ' ' + 'Theme';

export function arrayMove(arr : Array<any>, fromIndex: number, toIndex: number) {
  var element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

export function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
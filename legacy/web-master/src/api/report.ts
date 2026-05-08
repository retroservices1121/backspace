// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Timestamp } from 'firebase/firestore';

import { Collections, ReportDocument } from 'shared/types/documents';

import { FireDB } from './firebase';


const ReportTable = new FireDB<ReportDocument>(Collections.Reports);

export const reportUser = (reportedUser: string, reportedBy: string) => {
  return ReportTable.addDoc({
    reporter: reportedBy,
    agaisnt: reportedUser,
    // @ts-ignore not sure how to fix this
    creation: Timestamp.now(),
    type: 'account',
  });
};

export const reportPost = (reportedUser: string, reportedBy: string, postId: string) => {
  return ReportTable.addDoc({
    reporter: reportedBy,
    agaisnt: reportedUser,
    // @ts-ignore not sure how to fix this
    creation: Timestamp.now(),
    type: 'post',
    post: postId,
  });
};

export const reportComment = (reportedUser: string, reportedBy: string, commentId: string) => {
  return ReportTable.addDoc({
    reporter: reportedBy,
    agaisnt: reportedUser,
    // @ts-ignore not sure how to fix this
    creation: Timestamp.now(),
    type: 'comment',
    comment: commentId,
  });
};

// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Notification, Prisma } from '@prisma/client';

import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized notification instance
const memoizedGetNotification = memoize(getNotification);

/**
 * Get a notification table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getNotification(
  uniqueField: Prisma.NotificationWhereUniqueInput, 
  include : Prisma.NotificationInclude = undefined) : Promise<Notification | null> {
  const request : Prisma.NotificationFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.notification.findUnique(request);
  return matchedUser ;
}

/**
 * Find a notification by id
 * @param  id unique id of notification
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching notification if one exists. Else null is returned
 */
export async function getNotificationById(id: bigint, useCache: boolean = false): Promise<Notification | null> {
  const includes : Prisma.NotificationInclude = {};
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetNotification.clear({ id }, includes); 
  }
  return memoizedGetNotification({ id }, includes);
}

/**
 * Create a new notification
 * @param  data data required to create a notification
 * @return returns newly created notification.
 */
export async function createNotification(data : Prisma.NotificationCreateInput) {
  const newNotification = await prisma.notification.create({
    data: data,
  }).catch(() => console.error(`Failed to create new notification ${data.type}`));
  return newNotification;
}

/**
 * Create a new notification
 * @param  id id of notification to update
 * @param  update data required to update notification
 * @return returns newly updated notification.
 */
export async function updateNotification(id: bigint, update: Prisma.NotificationUpdateInput) {
  const updated = await prisma.notification.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update notification ${id}`));
  return updated;
}

/**
 * Remove a notification entry by id
 * @param  id id of notification to update
 * @return removed notification
 */
export async function deleteNotification(id: bigint) {
  return prisma.notification.delete({ where: { id } });
}
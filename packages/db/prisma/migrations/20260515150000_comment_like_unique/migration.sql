-- One like per (comment, user). Pre-existing rows are not deduped
-- here because Phase 0 ships before any real CommentLike traffic.
-- If we ever discover duplicates, the constraint will fail loudly
-- and we'll add a dedupe step at that point.
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

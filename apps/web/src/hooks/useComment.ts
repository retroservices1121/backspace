// Comment actions hook. The legacy version was post-scoped only and
// supported add/delete (with a string-template bug that meant delete
// never actually hit the server). Rewritten so:
//   - the postId-scoped form returns add() for the composer,
//   - the (commentId, comment)-scoped form returns like/edit/remove.
// Both keep Redux in sync via postSlice so the UI updates without
// a refetch.

import { useState } from 'react';
import { toast } from 'react-toastify';

import useUser from 'hooks/useUser';
import axios from 'lib/axios';
import { pushComment, removeComment, updateComment } from 'store/postSlice';
import { useAppDispatch } from 'store/store';

export function useCommentComposer(postId: bigint | undefined) {
  const dispatch = useAppDispatch();
  const { user } = useUser();

  const add = async (text: string) => {
    if (!postId || !text?.trim()) {
      toast.error('Cannot submit comment');
      return false;
    }
    try {
      const { status, data } = await axios().post('/comment', {
        postId,
        text: text.trim(),
      });
      if (status >= 300 || !data) {
        toast.error('Failed to add comment');
        return false;
      }
      // The endpoint already includes author/_count/likes — but be
      // defensive: stamp the author from the current user if missing
      // (was the legacy behavior, kept so older endpoints still work).
      const merged = data.author ? data : { ...data, author: user };
      dispatch(pushComment(merged));
      return true;
    } catch (err) {
      console.error('comment add failed', err);
      toast.error('Failed to add comment');
      return false;
    }
  };

  return { add };
}

type CommentLite = {
  id: bigint;
  _count?: { likes: number };
  likes?: unknown[];
};

export function useCommentRow(comment: CommentLite) {
  const dispatch = useAppDispatch();
  const [isLiked, setIsLiked] = useState<boolean>(
    Array.isArray(comment.likes) && comment.likes.length > 0,
  );
  const [likeCount, setLikeCount] = useState<number>(comment._count?.likes ?? 0);
  const [busy, setBusy] = useState<{ like?: boolean; remove?: boolean }>({});

  const toggleLike = async (value: boolean = !isLiked) => {
    if (busy.like) return;
    setBusy(b => ({ ...b, like: true }));
    setIsLiked(value);
    setLikeCount(c => Math.max(0, c + (value ? 1 : -1)));
    try {
      const { data } = value
        ? await axios().post(`/comment/${comment.id}/like`)
        : await axios().delete(`/comment/${comment.id}/like`);
      if (data) {
        setLikeCount(data.count);
        setIsLiked(data.mine);
      }
    } catch (err) {
      // Roll back optimistic delta.
      setIsLiked(!value);
      setLikeCount(c => Math.max(0, c + (value ? -1 : 1)));
      console.error('comment like toggle failed', err);
    } finally {
      setBusy(b => ({ ...b, like: false }));
    }
  };

  const remove = async () => {
    if (busy.remove) return;
    setBusy(b => ({ ...b, remove: true }));
    try {
      const { status } = await axios().delete(`/comment?id=${comment.id}`);
      if (status >= 300) {
        toast.error('Failed to delete comment');
        return false;
      }
      dispatch(removeComment(comment.id));
      return true;
    } catch (err) {
      console.error('comment delete failed', err);
      toast.error('Failed to delete comment');
      return false;
    } finally {
      setBusy(b => ({ ...b, remove: false }));
    }
  };

  const edit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    try {
      const { status, data } = await axios().patch(`/comment?id=${comment.id}`, { text: trimmed });
      if (status >= 300 || !data) {
        toast.error('Failed to edit comment');
        return false;
      }
      dispatch(updateComment(data));
      return true;
    } catch (err) {
      console.error('comment edit failed', err);
      toast.error('Failed to edit comment');
      return false;
    }
  };

  return { isLiked, likeCount, toggleLike, remove, edit };
}

// Legacy default export — keeps PostViewer.tsx working until it's
// migrated to the new hooks. Mirrors the old shape: { add, delete }.
export default function useComment(postId: bigint | undefined) {
  const composer = useCommentComposer(postId);
  // delete() is intentionally not supported via this legacy shape —
  // the row-level useCommentRow().remove() is the way.
  return { add: composer.add };
}

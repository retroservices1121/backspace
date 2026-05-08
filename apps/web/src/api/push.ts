// Push tokens used to be persisted on the legacy Firestore User document.
// The Postgres User model does not yet have a pushToken column, so this is
// a no-op until that schema change lands. Call sites (currently only
// store/userSlice's autoLogin thunk) keep invoking it so the wiring is in
// place; expand to a POST /api/user/push-token endpoint when the column
// arrives.
export async function setPushToken(_authId: string, _token: string = '') {
  // intentionally no-op
}

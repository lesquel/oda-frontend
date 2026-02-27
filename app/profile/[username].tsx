/**
 * /profile/[username] — canonical public-profile URL.
 * Delegates rendering to /user/[username] to avoid duplication.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ProfileRedirect() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <Redirect href={`/user/${username}` as any} />;
}

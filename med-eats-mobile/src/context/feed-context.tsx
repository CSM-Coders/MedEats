// ============================================================
// CONTEXTO GLOBAL DEL FEED
// ------------------------------------------------------------
// Permite compartir posts reales entre varias pantallas:
// - Feed (leer y dar like)
// - Create (publicar)
// - Profile (ver posts propios)
// ============================================================

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Post } from "@/src/models/domain";
import { useAuth } from "@/src/context/auth-context";
import { createPostApi, fetchPosts, likePost, unlikePost } from "@/src/services/postApi";
import { markRestaurantVisited } from "@/src/services/userCollectionsApi";

type NewPostInput = {
  restaurantId: string;
  rating: number;
  caption: string;
  image: string;
};

type FeedContextValue = {
  posts: Post[];
  userPosts: Post[];
  isLoadingPosts: boolean;
  feedError: string | null;
  refreshPosts: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  createPost: (input: NewPostInput) => Promise<void>;
};

const FeedContext = createContext<FeedContextValue | undefined>(undefined);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const { user, getAccessToken } = useAuth();

  const refreshPosts = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setPosts([]);
      setFeedError("Your session expired. Please log in again.");
      return;
    }

    setIsLoadingPosts(true);
    try {
      const data = await fetchPosts(accessToken);
      setPosts(data);
      setFeedError(null);
    } catch {
      setFeedError("Unable to load feed right now.");
    } finally {
      setIsLoadingPosts(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    refreshPosts().catch(() => undefined);
  }, [user, refreshPosts]);

  const toggleLike = useCallback(
    async (postId: string) => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setFeedError("Your session expired. Please log in again.");
        return;
      }

      const targetPost = posts.find((post) => post.id === postId);
      if (!targetPost) {
        return;
      }

      try {
        const updatedPost = targetPost.isLiked
          ? await unlikePost(accessToken, postId)
          : await likePost(accessToken, postId);

        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === postId ? updatedPost : post))
        );
      } catch {
        setFeedError("Unable to update like.");
      }
    },
    [getAccessToken, posts]
  );

  const createPost = useCallback(
    async ({ restaurantId, rating, caption, image }: NewPostInput) => {
      const accessToken = await getAccessToken();
      if (!accessToken || !user) {
        setFeedError("Your session expired. Please log in again.");
        return;
      }

      try {
        const newPost = await createPostApi(accessToken, {
          restaurantId,
          rating,
          caption,
          image,
        });
        await markRestaurantVisited(accessToken, {
          restaurantId,
          rating,
          note: caption,
        });
        setPosts((currentPosts) => [newPost, ...currentPosts]);
      } catch {
        setFeedError("Unable to publish your post.");
        throw new Error("Unable to publish your post.");
      }
    },
    [getAccessToken, user]
  );

  const userPosts = useMemo(
    () => (user ? posts.filter((post) => post.userId === user.id) : []),
    [posts, user]
  );

  const value = useMemo(
    () => ({
      posts,
      userPosts,
      isLoadingPosts,
      feedError,
      refreshPosts,
      toggleLike,
      createPost,
    }),
    [posts, userPosts, isLoadingPosts, feedError, refreshPosts, toggleLike, createPost]
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const context = useContext(FeedContext);

  if (!context) {
    throw new Error("useFeed must be used inside FeedProvider");
  }

  return context;
}

// ============================================================
// CONTEXTO GLOBAL DEL FEED
// ------------------------------------------------------------
// Permite compartir posts entre varias pantallas:
// - Feed (leer y dar like)
// - Create (publicar)
// - Profile (ver posts propios)
// ============================================================

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Post } from "@/src/models/domain";
import { useAuth } from "@/src/context/auth-context";
import { getRestaurantById, initialPosts } from "@/src/services/mockData";

type NewPostInput = {
  restaurantId: string;
  rating: number;
  caption: string;
  image: string;
};

type FeedContextValue = {
  posts: Post[];
  userPosts: Post[];
  toggleLike: (postId: string) => void;
  createPost: (input: NewPostInput) => void;
};

const FeedContext = createContext<FeedContextValue | undefined>(undefined);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const { user } = useAuth();

  const toggleLike = useCallback((postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id !== postId
          ? post
          : {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
      )
    );
  }, []);

  const createPost = useCallback(
    ({ restaurantId, rating, caption, image }: NewPostInput) => {
      const restaurant = getRestaurantById(restaurantId);

      if (!restaurant || !user) {
        return;
      }

      const newPost: Post = {
        id: `p-${Date.now()}`,
        userId: user.id,
        username: user.username,
        userAvatar:
          user.avatarUrl || "https://images.unsplash.com/photo-1614436201459-156d322d38c6?w=200",
        restaurantId,
        restaurantName: restaurant.name,
        image,
        rating,
        caption,
        likes: 0,
        comments: 0,
        date: new Date().toISOString().slice(0, 10),
        isLiked: false,
      };

      setPosts((currentPosts) => [newPost, ...currentPosts]);
    },
    [user]
  );

  const userPosts = useMemo(
    () => (user ? posts.filter((post) => post.userId === user.id) : []),
    [posts, user]
  );

  const value = useMemo(
    () => ({ posts, userPosts, toggleLike, createPost }),
    [posts, userPosts, toggleLike, createPost]
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

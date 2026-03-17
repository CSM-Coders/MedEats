import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Post } from "@/src/models/domain";
import { currentUser, getRestaurantById, initialPosts } from "@/src/services/mockData";

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

  const toggleLike = (postId: string) => {
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
  };

  const createPost = ({ restaurantId, rating, caption, image }: NewPostInput) => {
    const restaurant = getRestaurantById(restaurantId);

    if (!restaurant) {
      return;
    }

    const newPost: Post = {
      id: `p-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?w=200",
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
  };

  const userPosts = useMemo(
    () => posts.filter((post) => post.userId === currentUser.id),
    [posts]
  );

  const value = useMemo(
    () => ({ posts, userPosts, toggleLike, createPost }),
    [posts, userPosts]
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

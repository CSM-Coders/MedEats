import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Star } from "lucide-react";
import { posts as initialPosts } from "../data/mockData";
import { useNavigate } from "react-router";

export function FeedScreen() {
  const [posts, setPosts] = useState(initialPosts);
  const navigate = useNavigate();

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  return (
    <div className="h-full overflow-y-auto bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 pt-12 z-10">
        <h1 className="text-2xl font-bold text-gray-900">MedEats</h1>
        <p className="text-sm text-gray-500">Discover food in Medellín</p>
      </div>

      {/* Feed Posts */}
      <div className="divide-y divide-gray-100">
        {posts.map((post) => (
          <div key={post.id} className="bg-white">
            {/* Post Header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {post.username}
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })}
                </p>
              </div>
              <button className="text-[#FF6B35] text-sm font-semibold px-4 py-1 rounded-full border border-[#FF6B35] hover:bg-[#FF6B35] hover:text-white transition-all">
                Follow
              </button>
            </div>

            {/* Post Image */}
            <div className="relative">
              <img
                src={post.image}
                alt={post.restaurantName}
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Post Actions */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 group"
                >
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      post.isLiked
                        ? "fill-[#E63946] text-[#E63946]"
                        : "text-gray-700 group-hover:text-[#E63946]"
                    }`}
                  />
                  <span className={`text-sm font-medium ${
                    post.isLiked ? "text-[#E63946]" : "text-gray-700"
                  }`}>
                    {post.likes}
                  </span>
                </button>

                <button className="flex items-center gap-1.5 group">
                  <MessageCircle className="w-6 h-6 text-gray-700 group-hover:text-[#FF6B35] transition-colors" />
                  <span className="text-sm font-medium text-gray-700">
                    {post.comments}
                  </span>
                </button>

                <button className="ml-auto">
                  <Bookmark className="w-6 h-6 text-gray-700 hover:text-[#FF6B35] transition-colors" />
                </button>
              </div>

              {/* Restaurant Info */}
              <button
                onClick={() => navigate(`/restaurant/${post.restaurantId}`)}
                className="w-full bg-gradient-to-r from-[#FF6B35]/10 to-[#E63946]/10 rounded-xl p-3 mb-3 text-left hover:from-[#FF6B35]/20 hover:to-[#E63946]/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {post.restaurantName}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(post.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">
                        {post.rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 bg-white rounded-full px-3 py-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < post.rating
                              ? "fill-[#FF6B35] text-[#FF6B35]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* Caption */}
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">
                  {post.username}
                </span>{" "}
                {post.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="p-6 text-center">
        <button className="text-[#FF6B35] font-semibold hover:underline">
          Load More Posts
        </button>
      </div>
    </div>
  );
}

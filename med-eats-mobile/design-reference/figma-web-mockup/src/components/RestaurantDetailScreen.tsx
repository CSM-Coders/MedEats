import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Star, MapPin, Menu, Heart, Share2 } from "lucide-react";
import { restaurants, reviews } from "../data/mockData";
import { useState } from "react";

export function RestaurantDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const restaurant = restaurants.find((r) => r.id === id);

  if (!restaurant) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white pb-6">
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-12 right-4 flex gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "fill-[#FF6B35] text-[#FF6B35]" : "text-gray-900"
              }`}
            />
          </button>
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all">
            <Share2 className="w-5 h-5 text-gray-900" />
          </button>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {restaurant.name}
        </h1>

        {/* Rating and Category */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(restaurant.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-gray-900">
              {restaurant.rating}
            </span>
          </div>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-600">{restaurant.category}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600">{restaurant.location}</span>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-6">{restaurant.description}</p>

        {/* View Menu Button */}
        <button className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#E63946] transition-all shadow-md mb-6">
          <Menu className="w-5 h-5" />
          View Menu
        </button>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Reviews & Ratings
          </h2>

          {/* Review Cards */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={review.avatar}
                    alt={review.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {review.username}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>

          {/* See All Reviews Button */}
          <button className="w-full mt-4 py-3 border-2 border-[#FF6B35] text-[#FF6B35] rounded-2xl font-semibold hover:bg-[#FF6B35] hover:text-white transition-all">
            See All Reviews
          </button>
        </div>
      </div>
    </div>
  );
}

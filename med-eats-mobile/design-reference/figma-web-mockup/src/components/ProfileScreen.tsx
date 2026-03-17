import { useState } from "react";
import { Settings, MapPin, Grid3X3, Bookmark, Edit, X, Check } from "lucide-react";
import { currentUser, userPosts, visitedRestaurants, restaurants } from "../data/mockData";
import { useNavigate } from "react-router";

type TabType = "posts" | "saved" | "visited";

export function ProfileScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Editable profile fields
  const [editedName, setEditedName] = useState(currentUser.name);
  const [editedUsername, setEditedUsername] = useState(currentUser.username);
  const [editedBio, setEditedBio] = useState(currentUser.bio);
  const [editedLocation, setEditedLocation] = useState(currentUser.location);

  const handleSaveProfile = () => {
    // Update the user profile (in a real app, this would save to backend)
    currentUser.name = editedName;
    currentUser.username = editedUsername;
    currentUser.bio = editedBio;
    currentUser.location = editedLocation;
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditedName(currentUser.name);
    setEditedUsername(currentUser.username);
    setEditedBio(currentUser.bio);
    setEditedLocation(currentUser.location);
    setIsEditingProfile(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-white pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 pt-10 z-10 flex items-center justify-between">
        <h1 className="font-semibold text-gray-900">{currentUser.username}</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
          <Settings className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-4">
        {/* Avatar + Stats */}
        <div className="flex items-start gap-6 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-3xl font-semibold">
              {currentUser.name.charAt(0)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around pt-3">
            <div className="text-center">
              <div className="font-bold text-gray-900">{userPosts.length}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900">
                {currentUser.followers >= 1000 
                  ? `${(currentUser.followers / 1000).toFixed(1)}K` 
                  : currentUser.followers}
              </div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900">{currentUser.following}</div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 mb-1">
            {currentUser.name}
          </h2>
          <div className="space-y-0.5">
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <span>🍕</span>
              <span>Food lover & explorer</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <span>📍</span>
              <span>{currentUser.location}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <span>✨</span>
              <span>{currentUser.bio}</span>
            </p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button 
          onClick={() => setIsEditingProfile(true)}
          className="w-full py-2 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 flex">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "posts"
              ? "border-[#FF6B35] text-gray-900"
              : "border-transparent text-gray-400"
          }`}
        >
          <Grid3X3 className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "saved"
              ? "border-[#FF6B35] text-gray-900"
              : "border-transparent text-gray-400"
          }`}
        >
          <Bookmark className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab("visited")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "visited"
              ? "border-[#FF6B35] text-gray-900"
              : "border-transparent text-gray-400"
          }`}
        >
          <MapPin className="w-6 h-6" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-0">
        {/* Posts Grid */}
        {activeTab === "posts" && (
          <div>
            {userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-gray-100 overflow-hidden relative group cursor-pointer"
                  >
                    <img
                      src={post.image}
                      alt={post.restaurantName}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-white">
                        <span className="text-sm font-semibold">❤️ {post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <span className="text-sm font-semibold">💬 {post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 rounded-full border-4 border-gray-900 flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="w-10 h-10 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Share your food experiences
                </p>
                <button
                  onClick={() => navigate("/create")}
                  className="px-6 py-3 bg-[#FF6B35] text-white rounded-full font-semibold hover:bg-[#E63946] transition-all"
                >
                  Create Your First Post
                </button>
              </div>
            )}
          </div>
        )}

        {/* Saved Posts (Empty State) */}
        {activeTab === "saved" && (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 rounded-full border-4 border-gray-900 flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Save Your Favorites
            </h3>
            <p className="text-gray-500">
              Save photos and posts you want to see later
            </p>
          </div>
        )}

        {/* Visited Restaurants */}
        {activeTab === "visited" && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FF6B35]" />
              Visited Restaurants
            </h3>
            {visitedRestaurants.length > 0 ? (
              <div className="space-y-3">
                {visitedRestaurants.map((visit) => {
                  const restaurant = restaurants.find(r => r.id === visit.restaurantId);
                  if (!restaurant) return null;
                  
                  return (
                    <button
                      key={visit.restaurantId}
                      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      className="w-full bg-gray-50 rounded-2xl p-3 flex items-center gap-3 hover:bg-gray-100 transition-all"
                    >
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">
                          {restaurant.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-500">Your rating:</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < visit.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(visit.visitDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">You haven't visited any restaurants yet</p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-[#FF6B35] text-white rounded-full font-semibold hover:bg-[#E63946] transition-all"
                >
                  Explore Restaurants
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 pt-12 border-b border-gray-200">
            <button
              onClick={handleCancelEdit}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <h2 className="font-semibold text-gray-900">Edit Profile</h2>
            <button
              onClick={handleSaveProfile}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <Check className="w-6 h-6 text-[#FF6B35]" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-[#FF6B35] flex items-center justify-center mb-2">
                <span className="text-white text-4xl font-semibold">
                  {editedName.charAt(0)}
                </span>
              </div>
              <button className="text-[#FF6B35] font-semibold text-sm">
                Change Profile Photo
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="@username"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
                  placeholder="Tell people about yourself"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editedBio.length} / 150
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>

              {/* Save Button (Bottom) */}
              <div className="pt-4">
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-3 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E63946] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
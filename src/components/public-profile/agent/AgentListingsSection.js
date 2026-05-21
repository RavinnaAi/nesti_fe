'use client';

import Image from 'next/image';
import { Bath, Bed, DollarSign, MapPin, Ruler } from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/publicProfileClient';
import { generateSessionId, generateVisitorId } from '@/utils/sessionHelpers';

export default function AgentListingsSection({ title, listings, type, profileSlug }) {
  const handleListingClick = async (listingId) => {
    try {
      await trackAnalyticsEvent({
        slug: profileSlug,
        event_type: 'listing_click',
        listing_id: listingId,
        session_id: generateSessionId(),
        visitor_id: generateVisitorId(),
      });
    } catch (error) {
      console.error('Failed to track listing click:', error);
    }
  };

  const isSold = type === 'sold';

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section id={type ? `${type}-listings` : undefined} className={`py-16 ${isSold ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-heading mb-4">
            {title}
          </h2>
          {isSold && (
            <p className="text-lg text-text-muted">
              See the successful transactions I&apos;ve recently closed.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.slice(0, 6).map((listing, index) => (
            <div
              key={listing._id || index}
              onClick={() => handleListingClick(listing._id)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              {/* Listing Image */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                {listing.image_url || listing.photos?.[0] ? (
                  <Image
                    src={listing.image_url || listing.photos[0]}
                    alt={listing.title || 'Property'}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white">
                    <MapPin size={48} />
                  </div>
                )}
                {isSold && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    SOLD
                  </div>
                )}
                {!isSold && listing.status && (
                  <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {listing.status.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Listing Details */}
              <div className="p-5">
                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="text-green-600" />
                  <span className="text-2xl font-bold text-text-heading">
                    {listing.price
                      ? typeof listing.price === 'number'
                        ? listing.price.toLocaleString()
                        : listing.price
                      : 'Contact for Price'}
                  </span>
                </div>

                {/* Address */}
                {listing.address && (
                  <p className="text-sm text-text-muted mb-3 flex items-start gap-2">
                    <MapPin className="flex-shrink-0 mt-1 text-primary" />
                    <span>{listing.address}</span>
                  </p>
                )}

                {/* Property Details */}
                <div className="flex gap-4 text-sm text-text-body">
                  {listing.bedrooms && (
                    <div className="flex items-center gap-1">
                      <Bed className="text-primary" />
                      <span>{listing.bedrooms} Bed</span>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath className="text-primary" />
                      <span>{listing.bathrooms} Bath</span>
                    </div>
                  )}
                  {listing.square_feet && (
                    <div className="flex items-center gap-1">
                      <Ruler className="text-primary" />
                      <span>{listing.square_feet.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>

                {/* Property Type */}
                {listing.property_type && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-text-muted font-medium">
                      {listing.property_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {listings.length > 6 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-md transition">
              View All Listings
            </button>
          </div>
        )}
      </div>
    </section>
  );
}



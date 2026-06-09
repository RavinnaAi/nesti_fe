'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bed, Bath, Maximize2, MapPin, Tag, X,
  ChevronLeft, ChevronRight, Calendar, MessageCircle,
} from 'lucide-react';
import { getSellerProperties } from '@/lib/publicProfileClient';

/* ─── helpers ─────────────────────────────────────────────── */
function formatPrice(val) {
  if (!val) return null;
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  if (!isNaN(num) && num > 0) {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  }
  return val;
}

/* ─── Property Detail Modal ───────────────────────────────── */
function PropertyModal({ property, profile, onClose, onInquire }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = property.images || [];

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow transition hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={16} className="text-slate-600" />
        </button>

        {/* Image carousel */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-100 sm:h-72">
          {imgs.length > 0 ? (
            <>
              <Image
                src={imgs[imgIdx]}
                alt={`Property image ${imgIdx + 1}`}
                fill
                className="object-contain object-center"
                sizes="(max-width: 672px) 100vw, 672px"
              />
              {imgs.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((i) => (i === 0 ? imgs.length - 1 : i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setImgIdx((i) => (i === imgs.length - 1 ? 0 : i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] text-white">
                    {imgIdx + 1} / {imgs.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">No images available</div>
          )}

          {/* Price badge */}
          {property.expected_price && (
            <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[13px] font-bold text-white shadow">
              {formatPrice(property.expected_price)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          {/* Location */}
          {(property.address || property.location) && (
            <div className="mb-3 flex items-start gap-1.5 text-sm font-medium text-text-heading">
              <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
              <span>{property.address || property.location}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="mb-4 flex flex-wrap gap-3">
            {property.property_type && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-text-body">
                <Tag size={11} className="text-primary" /> {property.property_type}
              </span>
            )}
            {property.bedrooms && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-text-body">
                <Bed size={11} className="text-primary" /> {property.bedrooms} Beds
              </span>
            )}
            {property.bathrooms && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-text-body">
                <Bath size={11} className="text-primary" /> {property.bathrooms} Baths
              </span>
            )}
            {property.square_footage && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-text-body">
                <Maximize2 size={11} className="text-primary" /> {property.square_footage} sqft
              </span>
            )}
            {property.timeline && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-text-body">
                <Calendar size={11} className="text-primary" /> {property.timeline}
              </span>
            )}
          </div>

          {/* Listed by */}
          <p className="mb-4 text-[12px] text-text-muted">
            Listed by <span className="font-semibold text-text-heading">{profile?.professional_name}</span> · Seller: {property.seller_name}
          </p>

          {/* CTA */}
          <button
            onClick={() => { onClose(); onInquire(property); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <MessageCircle size={16} />
            I&apos;m Interested — Start Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Property Card ───────────────────────────────────────── */
function PropertyCard({ property, onViewDetails }) {
  const img = property.images?.[0];
  const price = formatPrice(property.expected_price);

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onClick={() => onViewDetails(property)}
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-slate-100">
        {img ? (
          <Image
            src={img}
            alt={property.address || 'Property'}
            fill
            className="object-contain object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/80 text-slate-400 shadow-sm">
              <Maximize2 size={22} />
            </div>
            <span className="text-[11px] font-medium text-slate-400">No photo uploaded</span>
          </div>
        )}

        {/* Price overlay */}
        {price && (
          <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[12px] font-bold text-white shadow">
            {price}
          </div>
        )}

        {/* Property type badge — top-right, opposite price */}
        {property.property_type && (
          <div className="absolute right-3 top-3 rounded-full border border-primary/15 bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-sm backdrop-blur-sm">
            {property.property_type}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3.5">
        {/* Location */}
        {(property.location || property.address) ? (
          <div className="flex items-start gap-1 text-[13px] font-medium text-text-heading">
            <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
            <span className="line-clamp-1">{property.address || property.location}</span>
          </div>
        ) : null}

        {/* Stats */}
        {(property.bedrooms || property.bathrooms || property.square_footage) ? (
          <div className="flex items-center gap-3 text-[12px] text-text-muted">
            {property.bedrooms ? (
              <span className="flex items-center gap-1"><Bed size={12} className="text-primary" /> {property.bedrooms} bd</span>
            ) : null}
            {property.bathrooms ? (
              <span className="flex items-center gap-1"><Bath size={12} className="text-primary" /> {property.bathrooms} ba</span>
            ) : null}
            {property.square_footage ? (
              <span className="flex items-center gap-1"><Maximize2 size={12} className="text-primary" /> {property.square_footage} sqft</span>
            ) : null}
          </div>
        ) : null}

        {/* View details hint */}
        <div className="rounded-lg bg-primary/5 py-1.5 text-center text-[11px] font-semibold text-primary transition group-hover:bg-primary/10">
          View Details & Inquire
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section ────────────────────────────────────────── */
export default function AgentPropertiesSection({ profile, onPropertyInquiry }) {
  const PAGE_SIZE = 6;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProperty, setModalProperty] = useState(null);
  const [page, setPage] = useState(1);
  const fetchedSlugRef = useRef('');

  // Fetch seller properties from the dedicated endpoint
  useEffect(() => {
    if (!profile?.slug) return;
    if (fetchedSlugRef.current === profile.slug) return;
    fetchedSlugRef.current = profile.slug;

    setLoading(true);
    getSellerProperties(profile.slug)
      .then((data) => setProperties(Array.isArray(data?.properties) ? data.properties : []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [profile?.slug]);

  // Filter to only properties that have at least a location or price
  const validProperties = useMemo(
    () => properties.filter((p) => p.location || p.address || p.expected_price || p.property_type),
    [properties]
  );
  const totalPages = Math.max(1, Math.ceil(validProperties.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleProperties = validProperties.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [validProperties.length]);

  if (loading) {
    return (
      <section className="bg-transparent py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Available Now</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">Properties for Sale</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!validProperties.length) return null;

  const handleInquire = (property) => {
    onPropertyInquiry?.(property);
  };

  return (
    <>
      <section id="properties" className="bg-transparent py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Available Now</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-heading sm:text-3xl">Properties for Sale</h3>
            <p className="mt-1.5 text-sm text-text-muted">
              Browse active listings managed by {profile?.professional_name}. Click any property to view details and start your inquiry.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProperties.map((p) => (
              <PropertyCard key={p.id} property={p} onViewDetails={setModalProperty} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
              <p className="text-sm text-text-muted">
                Showing <span className="font-semibold text-text-heading">{pageStart + 1}</span>-
                <span className="font-semibold text-text-heading">{Math.min(pageStart + PAGE_SIZE, validProperties.length)}</span> of{' '}
                <span className="font-semibold text-text-heading">{validProperties.length}</span> properties
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-text-heading transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold transition ${
                          pageNumber === currentPage
                            ? 'bg-primary text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-text-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {modalProperty && (
        <PropertyModal
          property={modalProperty}
          profile={profile}
          onClose={() => setModalProperty(null)}
          onInquire={handleInquire}
        />
      )}
    </>
  );
}


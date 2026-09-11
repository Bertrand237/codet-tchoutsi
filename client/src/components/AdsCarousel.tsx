import { useEffect, useState, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { collection, getDocs, db } from '@/lib/firebase-compat';
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Advertisement {
  id: string;
  title: string;
  videoUrl: string;
  isActive: boolean;
}

export default function AdsCarousel() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchAds() {
      try {
        const adsSnap = await getDocs(collection(db, "ads"));

        // Support both `isActive` and legacy `active` field
        const activeAds = adsSnap.documents
          .filter(doc => doc.isActive === true || doc.active === true)
          .map(doc => ({
            id: doc.$id,
            // Use `title` (current) with fallback to `titre` (legacy)
            title: doc.title || doc.titre || "Publicité",
            videoUrl: doc.videoUrl || doc.videoURL,
            isActive: doc.isActive ?? doc.active ?? false,
          }));

        setAds(activeAds);
      } catch (error) {
        console.error("Erreur lors du chargement des publicités:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAds();
  }, []);

  // Update selected indicator when slide changes
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!emblaApi || ads.length <= 1) return;

    function startAutoplay() {
      autoplayRef.current = setInterval(() => {
        if (!isHovered) {
          emblaApi?.scrollNext();
        }
      }, 5000);
    }

    function stopAutoplay() {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    }

    stopAutoplay();
    startAutoplay();

    return () => stopAutoplay();
  }, [emblaApi, ads.length, isHovered]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (loading) return null;
  if (ads.length === 0) return null;

  return (
    <Card
      className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {ads.map((ad) => (
            <div key={ad.id} className="flex-[0_0_100%] min-w-0 relative">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-primary mb-4 text-center">
                  {ad.title}
                </h3>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={ad.videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                    data-testid={`video-ad-${ad.id}`}
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {ads.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-10"
            onClick={scrollPrev}
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-10"
            onClick={scrollNext}
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'w-5 bg-primary'
                  : 'w-2 bg-primary/30 hover:bg-primary/50'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              data-testid={`indicator-${index}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
